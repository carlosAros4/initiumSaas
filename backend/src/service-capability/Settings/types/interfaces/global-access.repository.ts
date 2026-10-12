import { GlobalPageAccess, GlobalAccessUser } from '../dto/users.dto';

export const GLOBAL_ACCESS_REPOSITORY = 'GLOBAL_ACCESS_REPOSITORY';

export interface IGlobalAccessRepository {
  getGlobalPagesWithRules(tenant: string): Promise<GlobalPageAccess[]>;
  getGlobalAccessUsers(tenant: string): Promise<GlobalAccessUser[]>;
  getUserGlobalAccess(tenant: string, userId: number): Promise<string[]>;
  assignGlobalAccessToUser(tenant: string, userId: number, accessKeys: string[]): Promise<void>;
}
