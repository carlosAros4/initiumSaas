import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import {
  UserWithProfiles, UserSearchResult, AddUserToCompanyDto, AddUserResponse, CreateUserDto,
} from '../types/dto/users.dto';

@ApiTags('settings')
@Controller({ path: 'settings/users' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios con perfiles', description: 'Retorna usuarios de la sucursal actual con perfiles.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios con perfiles' })
  async getUsers(): Promise<UserWithProfiles[]> {
    this.logger.log('[getUsers] Solicitud para listar usuarios');
    return this.usersService.getUsersWithProfiles();
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar usuarios disponibles' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiResponse({ status: 200, description: 'Usuarios encontrados' })
  async searchUsers(@Query('q') query: string): Promise<UserSearchResult[]> {
    this.logger.log(`[searchUsers] Búsqueda: "${query}"`);
    return this.usersService.searchUsersNotInCompany(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar usuario a la empresa y sucursal actual' })
  @ApiResponse({ status: 201, description: 'Usuario agregado exitosamente' })
  async addUser(@Body() body: AddUserToCompanyDto): Promise<AddUserResponse> {
    this.logger.log(`[addUser] Agregar userId: ${body.userId}`);
    return this.usersService.addUserToCompany(body.userId);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear usuario nuevo y agregarlo a la empresa y sucursal' })
  @ApiResponse({ status: 201, description: 'Usuario creado y agregado' })
  @ApiResponse({ status: 409, description: 'RUT o email duplicado' })
  async createUser(@Body() body: CreateUserDto): Promise<AddUserResponse> {
    this.logger.log(`[createUser] Crear: ${body.firstName} ${body.lastName}`);
    return this.usersService.createUserAndAddToCompany(body);
  }
}
