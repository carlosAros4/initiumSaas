import { PageAccessRow, AccessActionRow, ProfileWithAccess, UserProfileInfo } from '../dto/users.dto';

export const PROFILES_REPOSITORY = 'PROFILES_REPOSITORY';

export interface IProfilesRepository {
  getPageAccessRows(tenant: string): Promise<PageAccessRow[]>;
  getAccessActions(): Promise<AccessActionRow[]>;
  getProfilesWithAccess(tenant: string, branchId: number | null): Promise<ProfileWithAccess[]>;
  createProfile(tenant: string, name: string, description: string, accessKeys: string[], branchId: number | null): Promise<void>;
  updateProfile(tenant: string, profileId: number, name: string, description: string, accessKeys: string[]): Promise<void>;
  deleteProfile(tenant: string, profileId: number): Promise<void>;
  getUserProfiles(tenant: string, userId: number, branchId: number | null): Promise<UserProfileInfo[]>;
  assignProfilesToUser(tenant: string, userId: number, profileIds: number[], branchId: number | null): Promise<void>;
}
