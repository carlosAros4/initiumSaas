import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IBranchesRepository, BRANCHES_REPOSITORY } from '../types/interfaces/branches.repository';
import { BranchItem, CreateBranchDto, UpdateBranchDto, BranchUserItem, UpdateBranchUserDto, BranchResponse } from '../types/dto/users.dto';
import { SessionContextService } from 'src/core/providers/user-session';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    @Inject(BRANCHES_REPOSITORY) private readonly repository: IBranchesRepository,
    private readonly session: SessionContextService,
  ) {}

  async getBranches(): Promise<BranchItem[]> {
    this.logger.log('[getBranches] Obteniendo sucursales');
    const { tenant } = this.session.getValidatedSession();
    return this.repository.getBranches(tenant);
  }

  async createBranch(dto: CreateBranchDto): Promise<BranchResponse> {
    this.logger.log(`[createBranch] Creando sucursal: ${dto.name}`);
    const { tenant } = this.session.getValidatedSession();

    if (!dto.name || dto.name.trim().length < 2) {
      throw new BadRequestException('El nombre de la sucursal debe tener al menos 2 caracteres');
    }

    await this.repository.createBranch(tenant, dto.name.trim(), dto.address?.trim() || null, dto.phone?.trim() || null);
    return { message: 'Sucursal creada exitosamente' };
  }

  async updateBranch(branchId: number, dto: UpdateBranchDto): Promise<BranchResponse> {
    this.logger.log(`[updateBranch] Editando sucursal ${branchId}`);
    const { tenant } = this.session.getValidatedSession();

    if (dto.name !== undefined && dto.name.trim().length < 2) {
      throw new BadRequestException('El nombre de la sucursal debe tener al menos 2 caracteres');
    }

    await this.repository.updateBranch(
      tenant,
      branchId,
      dto.name?.trim() || null,
      dto.address !== undefined ? (dto.address?.trim() || null) : null,
      dto.phone !== undefined ? (dto.phone?.trim() || null) : null,
      dto.active !== undefined ? dto.active : null,
    );
    return { message: 'Sucursal actualizada exitosamente' };
  }

  async getBranchUsers(branchId: number): Promise<BranchUserItem[]> {
    this.logger.log(`[getBranchUsers] Obteniendo usuarios de sucursal ${branchId}`);
    const { tenant } = this.session.getValidatedSession();
    return this.repository.getBranchUsers(tenant, branchId);
  }

  async updateBranchUser(branchId: number, userId: number, dto: UpdateBranchUserDto): Promise<BranchResponse> {
    this.logger.log(`[updateBranchUser] Actualizando usuario ${userId} en sucursal ${branchId}`);
    const { tenant } = this.session.getValidatedSession();

    await this.repository.updateBranchUser(
      tenant,
      branchId,
      userId,
      dto.active !== undefined ? dto.active : null,
      dto.blocked !== undefined ? dto.blocked : null,
    );
    return { message: 'Usuario actualizado en la sucursal' };
  }

  async addUserToBranch(branchId: number, userId: number): Promise<BranchResponse> {
    this.logger.log(`[addUserToBranch] Agregando usuario ${userId} a sucursal ${branchId}`);
    const { tenant } = this.session.getValidatedSession();
    await this.repository.addUserToBranch(tenant, branchId, userId);
    return { message: 'Usuario agregado a la sucursal' };
  }

  async setMainBranch(branchId: number): Promise<BranchResponse> {
    this.logger.log(`[setMainBranch] Cambiando sede principal a ${branchId}`);
    const { tenant } = this.session.getValidatedSession();
    await this.repository.setMainBranch(tenant, branchId);
    return { message: 'Sede principal actualizada' };
  }

  async removeUserFromBranch(branchId: number, userId: number): Promise<BranchResponse> {
    this.logger.log(`[removeUserFromBranch] Eliminando usuario ${userId} de sucursal ${branchId}`);
    const { tenant } = this.session.getValidatedSession();
    await this.repository.removeUserFromBranch(tenant, branchId, userId);
    return { message: 'Usuario eliminado de la sucursal' };
  }
}
