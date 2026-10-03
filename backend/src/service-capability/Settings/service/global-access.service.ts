import { Inject, Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IGlobalAccessRepository, GLOBAL_ACCESS_REPOSITORY } from '../types/interfaces/global-access.repository';
import { GlobalAccessSectionResponse, UserGlobalAccessResponse, GlobalAccessResponse } from '../types/dto/users.dto';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

@Injectable()
export class GlobalAccessService {
  private readonly logger = new Logger(GlobalAccessService.name);

  constructor(
    @Inject(GLOBAL_ACCESS_REPOSITORY) private readonly repository: IGlobalAccessRepository,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  private validateSession(): { tenant: string; branchId: number | null } {
    if (!this.userSession || !this.userSession.tenant_id) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return {
      tenant: this.userSession.tenant_id,
      branchId: this.userSession.branch_id || null,
    };
  }

  async getGlobalAccessSection(): Promise<GlobalAccessSectionResponse> {
    this.logger.log('[getGlobalAccessSection] Obteniendo páginas globales y usuarios');
    const { tenant } = this.validateSession();

    const [pages, users] = await Promise.all([
      this.repository.getGlobalPagesWithRules(),
      this.repository.getGlobalAccessUsers(tenant),
    ]);

    return { pages, users };
  }

  async getUserGlobalAccess(userId: number): Promise<UserGlobalAccessResponse> {
    this.logger.log(`[getUserGlobalAccess] Obteniendo accesos globales de usuario ${userId}`);
    const { tenant } = this.validateSession();
    const accessKeys = await this.repository.getUserGlobalAccess(tenant, userId);
    return { accessKeys };
  }

  async assignGlobalAccessToUser(userId: number, accessKeys: string[]): Promise<GlobalAccessResponse> {
    this.logger.log(`[assignGlobalAccessToUser] Asignando accesos globales a usuario ${userId}`);
    const { tenant } = this.validateSession();

    const globalPages = await this.repository.getGlobalPagesWithRules();
    const allowedKeys = new Set<string>();
    const collect = (nodes: { key: string; children: any[] }[]) => {
      for (const n of nodes) {
        allowedKeys.add(n.key);
        if (n.children?.length) collect(n.children);
      }
    };
    globalPages.forEach((p) => {
      collect(p.rules);
      // Los accesos de los módulos padre (requiredParentKeys) también son
      // válidos: el frontend los envía automáticamente cuando una página
      // global tiene algún acceso marcado.
      p.requiredParentKeys?.forEach((k) => allowedKeys.add(k));
    });

    const invalid = (accessKeys || []).filter((k) => !allowedKeys.has(k));
    if (invalid.length > 0) {
      throw new BadRequestException(`Accesos no válidos para páginas globales: ${invalid.join(', ')}`);
    }

    await this.repository.assignGlobalAccessToUser(tenant, userId, accessKeys || []);
    return { message: 'Accesos globales actualizados exitosamente' };
  }
}
