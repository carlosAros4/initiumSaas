import { BranchItem, BranchUserItem } from '../dto/users.dto';

export const BRANCHES_REPOSITORY = 'BRANCHES_REPOSITORY';

export interface IBranchesRepository {
  getBranches(tenant: string): Promise<BranchItem[]>;
  createBranch(tenant: string, name: string, address: string | null, phone: string | null): Promise<number>;
  updateBranch(tenant: string, branchId: number, name: string | null, address: string | null, phone: string | null, active: boolean | null): Promise<void>;
  setMainBranch(tenant: string, branchId: number): Promise<void>;

  getBranchUsers(tenant: string, branchId: number): Promise<BranchUserItem[]>;
  updateBranchUser(tenant: string, branchId: number, userId: number, active: boolean | null, blocked: boolean | null): Promise<void>;
  addUserToBranch(tenant: string, branchId: number, userId: number): Promise<void>;
  removeUserFromBranch(tenant: string, branchId: number, userId: number): Promise<void>;
}
