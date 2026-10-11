import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { IPostLoginRepository } from '../types/interfaces/post-login.repository';
import { Company } from 'src/service-capability/Login/types/dto/login';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';
import { encryptTenantId } from 'src/core/providers/user-session/user-session.provider';
import { RedisService } from 'src/core/redis';
import { PageTree } from '../types/dto/page-tree';
import { DataCliente } from '../types/dto/data-cliente';

const ACCESS_EXPIRES = '7m';
const REFRESH_EXPIRES = '7d';

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  is_main: boolean;
  favorite: boolean;
}

@Injectable()
export class PostLoginService {
  private readonly logger = new Logger(PostLoginService.name);

  constructor(
    @Inject('POST_LOGIN') private readonly repository: IPostLoginRepository,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
    private readonly redis: RedisService,
  ) { }

  async execute(tenantId?: string) {
    this.logger.log(`[postLogin] Iniciando post-login — rut: ${this.userSession.rut}`);

    const companies: Company[] = await this.repository.getCompanies(
      this.userSession.rut,
      this.userSession.dv,
    );

    // Generar key de redis
    const now = new Date();
    const key = `${this.userSession.rut}${now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)}`;
    const redisKey = createHash('sha256').update(key).digest('hex').slice(0, 20);

    // Selección de empresa (prioridad):
    // 1. tenant_id recibido (opcional) → empresa recién creada / específica
    // 2. empresa favorita activa
    // 3. empresa única activa
    let favoriteCompany: Company | null = null;

    if (tenantId && companies && companies.length > 0) {
      favoriteCompany = companies.find(c => c.tenant_id === tenantId && c.blocked === false) || null;
      if (favoriteCompany) {
        this.logger.log(`[postLogin] Empresa iniciada por primera vez ${tenantId}`);
      }
    }

    // Buscar empresa favorita activa
    if (!favoriteCompany && companies && companies.length > 0) {
      favoriteCompany = companies.find(c => c.favorite === true && c.blocked === false) || null;
    }

    // Si tiene una sola empresa activa, usarla
    if (!favoriteCompany && companies && companies.length === 1 && companies[0].blocked === false) {
      favoriteCompany = companies[0];
    }

    // Variables para branch
    let selectedBranch: Branch | null = null;
    let branches: Branch[] = [];

    // Registrar en redis la company si aplica
    if (favoriteCompany) {
      await this.redis.setLogin(redisKey, 'companySession', favoriteCompany);

      // Obtener sucursales del usuario en esta empresa
      branches = await this.repository.getUserBranches(favoriteCompany.tenant_id);

      // Seleccionar sucursal: favorita > única > null (requiere selector)
      if (branches.length === 1) {
        selectedBranch = branches[0];
      } else if (branches.length > 1) {
        selectedBranch = branches.find(b => b.favorite === true && b.active) || null;
      }

      if (selectedBranch) {
        await this.redis.setLogin(redisKey, 'branchSession', selectedBranch);
      }

      // Obtener árbol de páginas y permisos
      const pageTree = await this.repository.getPageTree();
      const accessRuleClient = await this.repository.getAccessRuleUser(
        favoriteCompany.tenant_id,
        selectedBranch?.id || null,
      );

      // Filtrar el árbol de páginas según los access rules del usuario
      const filteredPageTree = this.filterPageTree(pageTree, accessRuleClient);

      await this.redis.setLogin(redisKey, 'PageTree', filteredPageTree);
      await this.redis.setLogin(redisKey, 'accessRules', accessRuleClient);
    }

    // Registrar datos del cliente en redis
    const userData = await this.repository.getUserData(
      this.userSession.rut,
      this.userSession.dv,
    );

    const dataCliente: DataCliente = {
      companies,
      userId: this.userSession.sub,
      rut: this.userSession.rut,
      dv: this.userSession.dv,
      firstName: userData?.first_name || '',
      lastName: userData?.last_name || '',
      gender: userData.gender,
      email: userData?.email || '',
      blocked: userData?.blocked || false,
      verified: userData?.verified || false,
      newUsers: userData?.newusers || false,
    };

    await this.redis.setLogin(redisKey, 'data_cliente', dataCliente);

    // Generar nuevo token con session_id, tenant_id y branch_id
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

    const tokenPayload: any = {
      sub: this.userSession.sub,
      rut: this.userSession.rut,
      dv: this.userSession.dv,
      session_id: redisKey,
    };

    if (favoriteCompany) {
      tokenPayload.tenant_id = encryptTenantId(favoriteCompany.tenant_id);
    }

    if (selectedBranch) {
      tokenPayload.branch_id = selectedBranch.id;
    }

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: REFRESH_EXPIRES });

    this.logger.log(`[postLogin] Post-login exitoso — userId: ${this.userSession.sub}, branch: ${selectedBranch?.name || 'pendiente'}`);

    return {
      accessToken,
      refreshToken,
      companies,
      branches,
      selectedBranch,
    };
  }

  /**
   * Filtra el árbol de páginas recursivamente.
   */
  private filterPageTree(pages: PageTree, accessKeys: string[]): PageTree[] {
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

    return filter(pages.children);
  }
}
