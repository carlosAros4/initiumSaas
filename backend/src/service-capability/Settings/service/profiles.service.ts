import { Inject, Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { IProfilesRepository, PROFILES_REPOSITORY } from '../types/interfaces/profiles.repository';
import { AccessRuleTree, PageAccessRow, AccessActionRow, ProfilesSectionResponse, CreateProfileDto, CreateProfileResponse, UpdateProfileDto, UserProfilesResponse } from '../types/dto/users.dto';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @Inject(PROFILES_REPOSITORY) private readonly repository: IProfilesRepository,
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

  async getSeccionProfiles(): Promise<ProfilesSectionResponse> {
    this.logger.log('[getSeccionProfiles] Obteniendo perfiles con accesos y reglas de acceso');
    const { tenant, branchId } = this.validateSession();

    const profiles = await this.repository.getProfilesWithAccess(tenant, branchId);
    const pageAccessRows = await this.repository.getPageAccessRows();
    const accessActions = await this.repository.getAccessActions();

    // Dos ramas según el scope de la PÁGINA que origina cada acceso.
    const globalAccessRules = this.buildAccessTreeFromPages(pageAccessRows, accessActions, 'global');
    const branchAccessRules = this.buildAccessTreeFromPages(pageAccessRows, accessActions, 'branch');
    // Combinado (compatibilidad hacia atrás).
    const accessRules = this.buildAccessTreeFromPages(pageAccessRows, accessActions, null);

    this.logger.log(
      `[getSeccionProfiles] Ramas — global: ${globalAccessRules.length}, branch: ${branchAccessRules.length}`,
    );

    return { profiles, globalAccessRules, branchAccessRules, accessRules };
  }

  /**
   * Arma el árbol de accesos a partir de la jerarquía de PÁGINAS, no de
   * parent_rule_id.
   *
   * Reglas de armado:
   *  - Cada página activa con access_rule produce un nodo de acceso.
   *  - Un nodo cuelga del acceso de su ANCESTRO de página más cercano que
   *    también tenga acceso (saltando páginas intermedias sin acceso). Si no
   *    hay ancestro con acceso, el nodo es raíz.
   *  - Las acciones internas (access_rule con parent_rule_id) quedan DENTRO
   *    del nodo de la página cuyo access_rule es su parent_rule_id.
   *
   * @param scope filtra el árbol por scope de página ('global' | 'branch').
   *              Si es null, incluye todas las páginas (árbol combinado).
   */
  private buildAccessTreeFromPages(
    pageRows: PageAccessRow[],
    actions: AccessActionRow[],
    scope: 'global' | 'branch' | null,
  ): AccessRuleTree[] {
    // Páginas consideradas según scope.
    const rows = scope ? pageRows.filter((p) => p.scopeType === scope) : pageRows;

    // Nodo de acceso por página (clave: pageId).
    const nodeByPageId = new Map<number, AccessRuleTree>();
    // Para resolver ancestros: acceso de página por pageId dentro del scope.
    const includedPageIds = new Set(rows.map((p) => p.pageId));
    // Mapa global de pageId → parentPageId (de TODAS las páginas con acceso),
    // necesario para subir por ancestros aunque alguno quede fuera del scope.
    const parentByPageId = new Map<number, number | null>();
    for (const p of pageRows) parentByPageId.set(p.pageId, p.parentPageId);

    for (const p of rows) {
      nodeByPageId.set(p.pageId, {
        id: p.accessRuleId,
        key: p.accessKey,
        descripcion: p.accessDescription,
        children: [],
      });
    }

    // Anexar acciones internas (parent_rule_id) dentro del nodo de su página.
    // Indexamos nodos por accessRuleId para ubicar al padre de cada acción.
    const nodeByAccessRuleId = new Map<number, AccessRuleTree>();
    for (const p of rows) {
      nodeByAccessRuleId.set(p.accessRuleId, nodeByPageId.get(p.pageId)!);
    }

    for (const action of actions) {
      const parentNode = nodeByAccessRuleId.get(action.parentRuleId);
      if (parentNode) {
        const actionNode: AccessRuleTree = {
          id: action.id,
          key: action.key,
          descripcion: action.descripcion,
          children: [],
        };
        parentNode.children.push(actionNode);
        nodeByAccessRuleId.set(action.id, actionNode);
      }
    }

    // Encuentra el ancestro de página más cercano (incluido en el scope) que
    // tenga nodo de acceso.
    const findAncestorNode = (pageId: number): AccessRuleTree | null => {
      let current = parentByPageId.get(pageId) ?? null;
      while (current != null) {
        if (includedPageIds.has(current)) {
          return nodeByPageId.get(current) ?? null;
        }
        current = parentByPageId.get(current) ?? null;
      }
      return null;
    };

    const roots: AccessRuleTree[] = [];
    // Mantener el orden por "order" de página.
    const orderedRows = [...rows].sort((a, b) => a.order - b.order);

    for (const p of orderedRows) {
      const node = nodeByPageId.get(p.pageId)!;
      const ancestorNode = findAncestorNode(p.pageId);
      if (ancestorNode) {
        ancestorNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async createProfile(dto: CreateProfileDto): Promise<CreateProfileResponse> {
    this.logger.log(`[createProfile] Creando perfil: ${dto.name}`);
    const { tenant, branchId } = this.validateSession();

    if (!dto.name || dto.name.trim().length < 3) {
      throw new BadRequestException('El nombre del perfil debe tener al menos 3 caracteres');
    }

    const profileBranchId = dto.branchId !== undefined ? dto.branchId : branchId;

    try {
      await this.repository.createProfile(tenant, dto.name.trim(), dto.description?.trim() || '', dto.accessKeys || [], profileBranchId);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Ya existe un perfil con ese nombre');
      }
      throw error;
    }

    return { message: 'Perfil creado exitosamente' };
  }

  async updateProfile(profileId: number, dto: UpdateProfileDto): Promise<CreateProfileResponse> {
    this.logger.log(`[updateProfile] Editando perfil ${profileId}: ${dto.name}`);
    const { tenant } = this.validateSession();

    if (!dto.name || dto.name.trim().length < 3) {
      throw new BadRequestException('El nombre del perfil debe tener al menos 3 caracteres');
    }

    try {
      await this.repository.updateProfile(tenant, profileId, dto.name.trim(), dto.description?.trim() || '', dto.accessKeys || []);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Ya existe un perfil con ese nombre');
      }
      throw error;
    }

    return { message: 'Perfil editado exitosamente' };
  }

  async deleteProfile(profileId: number): Promise<CreateProfileResponse> {
    this.logger.log(`[deleteProfile] Eliminando perfil ${profileId}`);
    const { tenant } = this.validateSession();
    await this.repository.deleteProfile(tenant, profileId);
    return { message: 'Perfil eliminado exitosamente' };
  }

  async getUserProfiles(userId: number): Promise<UserProfilesResponse> {
    this.logger.log(`[getUserProfiles] Obteniendo perfiles para usuario ${userId}`);
    const { tenant, branchId } = this.validateSession();
    const profiles = await this.repository.getUserProfiles(tenant, userId, branchId);
    return { profiles };
  }

  async assignProfilesToUser(userId: number, profileIds: number[]): Promise<CreateProfileResponse> {
    this.logger.log(`[assignProfilesToUser] Asignando perfiles a usuario ${userId}`);
    const { tenant, branchId } = this.validateSession();
    await this.repository.assignProfilesToUser(tenant, userId, profileIds, branchId);
    return { message: 'Perfiles asignados exitosamente' };
  }
}
