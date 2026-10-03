import { UserWithProfiles, UserSearchResult } from '../dto/users.dto';

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface IUsersRepository {
  getUsersWithProfiles(tenant: string, branchId: number | null): Promise<UserWithProfiles[]>;
  searchUsersNotInCompany(tenant: string, query: string): Promise<UserSearchResult[]>;
  addUserToCompany(tenant: string, userId: number, branchId: number | null): Promise<void>;
  findUserByRut(rut: string, dv: string): Promise<UserSearchResult | null>;
  isUserInCompany(userId: number, tenant: string): Promise<boolean>;
  createUserAndAddToCompany(tenant: string, firstName: string, lastName: string, rut: string, dv: string, email: string, branchId: number | null): Promise<void>;
}
