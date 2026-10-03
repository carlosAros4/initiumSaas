export interface UserWithProfiles {
  id: number;
  name: string;
  email: string;
  rut: string;
  profiles: string[];
  active: boolean;
}

export interface UserSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
}

export interface AddUserToCompanyDto {
  userId: number;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
}

export interface AddUserResponse {
  message: string;
  existingUser?: UserSearchResult;
}


export type AccessScope = 'global' | 'branch';

export interface AccessRuleTree {
    id: number;
    key: string;
    descripcion: string;
    children: AccessRuleTree[];
}

// ─── Insumos para armar el árbol de accesos desde la jerarquía de páginas ───

// Página activa que posee un access_rule (fuente de un nodo de acceso).
export interface PageAccessRow {
    pageId: number;
    parentPageId: number | null;
    order: number;
    scopeType: AccessScope;
    accessRuleId: number;
    accessKey: string;
    accessDescription: string;
}

// Acción interna de un módulo: access_rule con parent_rule_id apuntando al
// access_rule de una página (ej: branches.new cuelga de branches).
export interface AccessActionRow {
    id: number;
    key: string;
    descripcion: string;
    parentRuleId: number;
}

export interface ProfileWithAccess {
    id: number;
    name: string;
    descripcion:string;
    userCount: number;
    accessKeys: string[];
}

export interface ProfilesSectionResponse {
    profiles: ProfileWithAccess[];
    /**
     * Reglas de acceso separadas en dos ramas según el scope_type de la
     * página raíz que las origina:
     *  - globalAccessRules: accesos globales (se asignan por usuario a nivel empresa)
     *  - branchAccessRules: accesos por sucursal (se asignan dentro de un perfil de sucursal)
     */
    globalAccessRules: AccessRuleTree[];
    branchAccessRules: AccessRuleTree[];
    /**
     * @deprecated Mantener por compatibilidad: árbol combinado (global + branch).
     * Preferir globalAccessRules / branchAccessRules.
     */
    accessRules: AccessRuleTree[];
}

export interface CreateProfileDto {
    name: string;
    description: string;
    accessKeys: string[];
    branchId?: number | null;
}

export interface UpdateProfileDto {
    name: string;
    description: string;
    accessKeys: string[];
}

export interface CreateProfileResponse {
    message: string;
}

export interface DeleteProfileDto {
    profileId: number;
}

export interface AssignProfilesDto {
    profileIds: number[];
}

export interface UserProfileInfo {
    id: number;
    name: string;
    descripcion: string;
    accessKeys: string[];
    assigned: boolean;
}

export interface UserProfilesResponse {
    profiles: UserProfileInfo[];
}

// ─── Branch DTOs ───

export interface BranchItem {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    active: boolean;
    is_main: boolean;
    userCount: number;
}

export interface CreateBranchDto {
    name: string;
    address?: string;
    phone?: string;
}

export interface UpdateBranchDto {
    name?: string;
    address?: string;
    phone?: string;
    active?: boolean;
}

export interface BranchUserItem {
    userId: number;
    name: string;
    email: string;
    rut: string;
    active: boolean;
    blocked: boolean;
    favorite: boolean;
}

export interface UpdateBranchUserDto {
    active?: boolean;
    blocked?: boolean;
}

export interface BranchResponse {
    message: string;
}





// ─── Global Access DTOs ───

// Regla de acceso perteneciente a una página global (árbol padre/hijos)
export interface GlobalAccessRuleTree {
    id: number;
    key: string;
    descripcion: string;
    children: GlobalAccessRuleTree[];
}

// Página marcada como global, con sus reglas de acceso asociadas
export interface GlobalPageAccess {
    pageId: number;
    pageName: string;
    rules: GlobalAccessRuleTree[];
    /**
     * access_key de los módulos PADRE (ancestros con acceso) de los que
     * depende esta página global. Para acceder a una página global el usuario
     * también necesita el acceso de su sección padre (ej: 'settings').
     * Vacío si la página no cuelga de ningún módulo con acceso.
     */
    requiredParentKeys: string[];
    // Descripciones legibles de los módulos padre requeridos (para mostrar en UI).
    requiredParentLabels: string[];
}

// Usuario de la empresa candidato a recibir accesos globales
export interface GlobalAccessUser {
    id: number;
    name: string;
    email: string;
    rut: string;
}

// Respuesta de la sección: páginas globales + usuarios de la empresa
export interface GlobalAccessSectionResponse {
    pages: GlobalPageAccess[];
    users: GlobalAccessUser[];
}

// Accesos globales actualmente asignados a un usuario
export interface UserGlobalAccessResponse {
    accessKeys: string[];
}

// Body para asignar accesos globales a un usuario
export interface AssignGlobalAccessDto {
    accessKeys: string[];
}

export interface GlobalAccessResponse {
    message: string;
}
