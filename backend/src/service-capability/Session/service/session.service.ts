import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { RedisService } from 'src/core/redis';
import { CompanyRequestDto, BranchRequestDto } from '../types/dto/register-request.dto';
import { ChangePasswordRequestDto } from '../types/dto/change-password-request.dto';
import { ISessionRepository } from '../types/interfaces/session.repository';
import { PageTree } from 'src/service-capability/PostLogin/types/dto/page-tree';
import { SelectCompanyResponseDto, SelectBranchResponseDto } from '../types/dto/session.dto';
import { USER_SESSION, type UserSession } from 'src/core/providers/user-session';
import { encryptTenantId } from 'src/core/providers/user-session/user-session.provider';
import type { Branch } from 'src/service-capability/PostLogin/service/post-login.service';

const ACCESS_EXPIRES = '7m';
const REFRESH_EXPIRES = '7d';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly redis: RedisService,
    @Inject('SESSION') private readonly repository: ISessionRepository,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) { }

  /**
   * Cambia la contraseña del usuario autenticado y limpia la marca newUsers.
   * Se usa en el flujo de cambio obligatorio para usuarios nuevos.
   */
  async changePassword(data: ChangePasswordRequestDto): Promise<{ message: string }> {
    if (!this.userSession) {
      throw new UnauthorizedException('Sesión no válida');
    }

    const { rut, dv } = this.userSession;
    this.logger.log(`[changePassword] Cambio de contraseña — rut: ${rut}`);

    const currentHash = await this.repository.getPasswordHash(rut, dv);
    if (!currentHash) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const matches = await bcrypt.compare(data.currentPassword, currentHash);
    if (!matches) {
      this.logger.warn(`[changePassword] Contraseña actual incorrecta — rut: ${rut}`);
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const sameAsCurrent = await bcrypt.compare(data.newPassword, currentHash);
    if (sameAsCurrent) {
      throw new BadRequestException('La nueva contraseña debe ser distinta a la actual');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.repository.updatePasswordAndClearNewUser(rut, dv, hashedPassword);

    // Reflejar el cambio en la sesión de Redis solo si hay sesión activa.
    // En el flujo de usuario nuevo el cambio ocurre ANTES de post-login,
    // por lo que aún no existe session_id ni datos en Redis.
    if (this.userSession.session_id) {
      try {
        const dataCliente = await this.redis.get<{ [key: string]: any }>('data_cliente');
        if (dataCliente) {
          dataCliente.newUsers = false;
          await this.redis.set('data_cliente', dataCliente);
        }
      } catch (err) {
        this.logger.warn(`[changePassword] No se pudo actualizar Redis (sesión no inicializada): ${err}`);
      }
    }

    this.logger.log(`[changePassword] Contraseña actualizada y marca newUsers limpiada — rut: ${rut}`);
    return { message: 'Contraseña actualizada correctamente' };
  }

  async getSessionData() {
    this.logger.log('[getSessionData] Obteniendo datos de sesión desde Redis');

    const dataCliente = await this.redis.get('data_cliente');
    const companySession = await this.redis.get<{ tenant_id: string } | null>('companySession');
    const branchSession = await this.redis.get('branchSession');

    if (companySession) {
      const rules = await this.redis.get('accessRules');
      const pagetree = await this.redis.get('PageTree');

      // Obtener branches disponibles para el usuario
      const branches = await this.repository.getUserBranches(companySession.tenant_id);

      return {
        cliente: dataCliente,
        company: companySession,
        branch: branchSession,
        branches,
        rules,
        pagetree,
      };
    }
    return {
      cliente: dataCliente,
      company: companySession,
      branch: branchSession,
      branches: [],
    };
  }

  async selectCompany(data: CompanyRequestDto, currentToken: string): Promise<SelectCompanyResponseDto> {
    this.logger.log(`[selectCompany] Seleccionando company id: ${data.id}, favorite: ${data.favorite}`);

    const company = await this.repository.getCompanies(Number(data.id));

    if (!company) {
      throw new NotFoundException('Empresa no encontrada o no tienes acceso');
    }

    // Gestionar favoritos
    if (data.favorite) {
      this.logger.log(`[selectCompany] Marcando como favorita — id: ${data.id}`);
      await this.repository.resetFavorite();
      await this.repository.insertFavorite(Number(data.id));
      company.favorite = true;
    } else if (!data.favorite && company.favorite) {
      this.logger.log(`[selectCompany] Eliminando favorita — id: ${data.id}`);
      await this.repository.resetFavorite();
      company.favorite = false;
    }

    // Registrar company seleccionada en Redis
    await this.redis.set('companySession', company);

    // Resetear branch al cambiar de empresa
    await this.redis.del('branchSession');

    // Actualizar data_cliente en Redis con los favoritos actualizados
    const dataCliente = await this.redis.get<{ companies: any[]; [key: string]: any }>('data_cliente');
    if (dataCliente && dataCliente.companies) {
      dataCliente.companies = dataCliente.companies.map((c: any) => ({
        ...c,
        favorite: data.favorite ? c.id === Number(data.id) : (c.id === Number(data.id) ? false : c.favorite),
      }));
      await this.redis.set('data_cliente', dataCliente);
    }

    // Obtener sucursales del usuario en esta empresa
    const branches = await this.repository.getUserBranches(company.tenant_id);

    // Auto-seleccionar branch si es posible
    let selectedBranch: Branch | null = null;
    if (branches.length === 1) {
      selectedBranch = branches[0];
    } else if (branches.length > 1) {
      selectedBranch = branches.find(b => b.favorite === true && b.active) || null;
    }

    if (selectedBranch) {
      await this.redis.set('branchSession', selectedBranch);
    }

    // Obtener árbol de páginas y permisos (filtrados por branch si hay)
    const pageTree = await this.repository.getPageTree();
    const accessRuleClient = await this.repository.getAccessRuleUser(
      company.tenant_id,
      selectedBranch?.id || null,
    );

    const filteredPageTree = this.filterPageTree(pageTree, accessRuleClient);

    await this.redis.set('PageTree', filteredPageTree);
    await this.redis.set('accessRules', accessRuleClient);

    // Renovar tokens con el tenant_id y branch_id
    const { accessToken, newRefreshToken } = await this.refreshTokenWithTenantAndBranch(
      currentToken,
      company.tenant_id,
      selectedBranch?.id || null,
    );

    this.logger.log(`[selectCompany] Company registrada en sesión — ${company.name}, branch: ${selectedBranch?.name || 'pendiente'}`);

    return {
      company,
      accessRule: accessRuleClient,
      pageTree: filteredPageTree,
      accessToken,
      refreshToken: newRefreshToken,
      branches,
      selectedBranch,
    };
  }

  /**
   * Selecciona una sucursal para la sesión actual.
   * Recalcula permisos filtrados por la sucursal y regenera tokens.
   */
  async selectBranch(data: BranchRequestDto, currentToken: string): Promise<SelectBranchResponseDto> {
    this.logger.log(`[selectBranch] Seleccionando branch id: ${data.id}, favorite: ${data.favorite}`);

    const companySession = await this.redis.get<{ tenant_id: string }>('companySession');
    if (!companySession) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }

    const tenant = companySession.tenant_id;

    // Validar que el branch existe y el usuario tiene acceso
    const branch = await this.repository.getBranch(tenant, Number(data.id));
    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada o no tienes acceso');
    }

    // Gestionar favoritos de branch
    if (data.favorite) {
      this.logger.log(`[selectBranch] Marcando branch como favorita — id: ${data.id}`);
      await this.repository.resetBranchFavorite(tenant);
      await this.repository.insertBranchFavorite(tenant, Number(data.id));
      branch.favorite = true;
    } else if (!data.favorite && branch.favorite) {
      this.logger.log(`[selectBranch] Eliminando branch favorita — id: ${data.id}`);
      await this.repository.resetBranchFavorite(tenant);
      branch.favorite = false;
    }

    // Guardar en Redis
    await this.redis.set('branchSession', branch);

    // Recalcular permisos filtrados por la nueva sucursal
    const pageTree = await this.repository.getPageTree();
    const accessRuleClient = await this.repository.getAccessRuleUser(tenant, branch.id);
    const filteredPageTree = this.filterPageTree(pageTree, accessRuleClient);

    await this.redis.set('PageTree', filteredPageTree);
    await this.redis.set('accessRules', accessRuleClient);

    // Regenerar tokens con branch_id
    const { accessToken, newRefreshToken } = await this.refreshTokenWithTenantAndBranch(
      currentToken,
      tenant,
      branch.id,
    );

    this.logger.log(`[selectBranch] Branch seleccionada — ${branch.name}`);

    return {
      branch,
      accessRule: accessRuleClient,
      pageTree: filteredPageTree,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Renueva access_token y refresh_token a partir del refresh_token de las cookies.
   */
  async refreshToken(token: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    this.logger.log('[refreshToken] Intentando renovar tokens');

    const decoded = this.verifyRefreshToken(token);
    return this.generateTokens(decoded);
  }

  /**
   * Renueva tokens inyectando un tenant_id y branch_id (usado al seleccionar company/branch).
   */
  async refreshTokenWithTenantAndBranch(
    token: string,
    tenantId: string,
    branchId: number | null,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    this.logger.log(`[refreshTokenWithTenantAndBranch] Renovando tokens — tenant: ${tenantId}, branch: ${branchId}`);

    const decoded = this.verifyRefreshToken(token);
    const encryptedTenantId = encryptTenantId(tenantId);

    const payload: any = { ...decoded, tenant_id: encryptedTenantId };
    if (branchId) {
      payload.branch_id = branchId;
    } else {
      delete payload.branch_id;
    }

    return this.generateTokens(payload);
  }

  /**
   * Verifica y decodifica un refresh token.
   */
  private verifyRefreshToken(token: string): UserSession {
    if (!token) {
      this.logger.warn('[verifyRefreshToken] No se proporcionó refresh token');
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

    try {
      return jwt.verify(token, jwtSecret) as unknown as UserSession;
    } catch {
      this.logger.warn('[verifyRefreshToken] Token inválido o expirado');
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  /**
   * Genera un par de access_token y refresh_token a partir de un payload de sesión.
   */
  private generateTokens(decoded: UserSession): { accessToken: string; newRefreshToken: string } {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

    const tokenPayload: Omit<UserSession, 'iat' | 'exp'> = {
      sub: decoded.sub,
      rut: decoded.rut,
      dv: decoded.dv,
      ...(decoded.tenant_id && { tenant_id: decoded.tenant_id }),
      ...(decoded.session_id && { session_id: decoded.session_id }),
      ...(decoded.branch_id && { branch_id: decoded.branch_id }),
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: ACCESS_EXPIRES });
    const newRefreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: REFRESH_EXPIRES });

    this.logger.log(`[generateTokens] Tokens generados — userId: ${decoded.sub}`);

    return { accessToken, newRefreshToken };
  }

  /**
   * Filtra el árbol de páginas recursivamente.
   */
  private filterPageTree(pages: PageTree[], accessKeys: string[]): PageTree[] {
    const accessSet = new Set(accessKeys);

    const filter = (nodes: PageTree[]): PageTree[] => {
      return nodes.reduce<PageTree[]>((acc, node) => {
        const filteredChildren = filter(node.children);

        if (node.accessRule && !accessSet.has(node.accessRule)) {
          return acc;
        }

        if (node.children.length > 0 && filteredChildren.length === 0) {
          return acc;
        }

        acc.push({ ...node, children: filteredChildren });
        return acc;
      }, []);
    };

    return filter(pages);
  }
}
