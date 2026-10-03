import { Inject, Injectable, Logger, UnauthorizedException, ConflictException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { IUsersRepository, USERS_REPOSITORY } from '../types/interfaces/users.repository';
import { UserWithProfiles, UserSearchResult, AddUserResponse, CreateUserDto } from '../types/dto/users.dto';
import { validateRut } from 'src/core/utils/rut.utils';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USERS_REPOSITORY) private readonly repository: IUsersRepository,
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

  async getUsersWithProfiles(): Promise<UserWithProfiles[]> {
    this.logger.log('[getUsersWithProfiles] Obteniendo usuarios con perfiles');
    const { tenant, branchId } = this.validateSession();
    return this.repository.getUsersWithProfiles(tenant, branchId);
  }

  async searchUsersNotInCompany(query: string): Promise<UserSearchResult[]> {
    this.logger.log(`[searchUsersNotInCompany] Buscando: "${query}"`);
    const { tenant } = this.validateSession();
    return this.repository.searchUsersNotInCompany(tenant, query);
  }

  async addUserToCompany(userId: number): Promise<AddUserResponse> {
    this.logger.log(`[addUserToCompany] Agregando usuario ${userId}`);
    const { tenant, branchId } = this.validateSession();
    await this.repository.addUserToCompany(tenant, userId, branchId);
    return { message: 'Usuario agregado exitosamente' };
  }

  async createUserAndAddToCompany(dto: CreateUserDto): Promise<AddUserResponse> {
    this.logger.log(`[createUserAndAddToCompany] Creando usuario: ${dto.firstName} ${dto.lastName}`);
    const { tenant, branchId } = this.validateSession();

    const rutClean = dto.rut.replace(/\./g, '');
    const parts = rutClean.split('-');
    if (parts.length !== 2) {
      throw new ConflictException('Formato de RUT inválido. Debe ser XXXXXXXX-X');
    }
    const [rut, dv] = parts;

    if (!validateRut(rut, dv)) {
      throw new BadRequestException('El RUT ingresado no es válido.');
    }

    const existingUser = await this.repository.findUserByRut(rut, dv);
    if (existingUser) {
      const alreadyInCompany = await this.repository.isUserInCompany(existingUser.id, tenant);

      if (alreadyInCompany) {
        this.logger.warn(`[createUserAndAddToCompany] Usuario ${rut}-${dv} ya pertenece a la empresa`);
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'El usuario ya está registrado y pertenece a esta empresa.',
          },
          HttpStatus.CONFLICT,
        );
      }

      this.logger.warn(`[createUserAndAddToCompany] Usuario ya existe con RUT ${rut}-${dv}, no está en la empresa`);
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: 'El usuario ya está registrado en el sistema. Puedes agregarlo directamente.',
          existingUser,
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      await this.repository.createUserAndAddToCompany(tenant, dto.firstName, dto.lastName, rut, dv, dto.email, branchId);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('El RUT o email ya existe en el sistema');
      }
      throw error;
    }

    return { message: 'Usuario creado y agregado exitosamente' };
  }
}
