import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from '../service/profiles.service';
import {
  ProfilesSectionResponse, CreateProfileDto, CreateProfileResponse,
  UpdateProfileDto, AssignProfilesDto, UserProfilesResponse,
} from '../types/dto/users.dto';

@ApiTags('settings')
@Controller({ path: 'settings' })
export class ProfilesController {
  private readonly logger = new Logger(ProfilesController.name);

  constructor(private readonly profilesService: ProfilesService) {}

  @Get('profiles/sections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfiles con accesos y reglas (filtrados por sucursal)' })
  @ApiResponse({ status: 200, description: 'Perfiles y árbol de reglas de acceso' })
  async getSeccionProfiles(): Promise<ProfilesSectionResponse> {
    this.logger.log('[getSeccionProfiles] Solicitud para obtener perfiles y reglas de acceso');
    return this.profilesService.getSeccionProfiles();
  }

  @Post('profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un perfil (asociado a la sucursal actual si hay branch seleccionado)' })
  @ApiResponse({ status: 201, description: 'Perfil creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  async createProfile(@Body() body: CreateProfileDto): Promise<CreateProfileResponse> {
    this.logger.log(`[createProfile] Crear perfil: ${body.name}`);
    return this.profilesService.createProfile(body);
  }

  @Put('profiles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar un perfil' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Perfil editado exitosamente' })
  async updateProfile(@Param('id') id: string, @Body() body: UpdateProfileDto): Promise<CreateProfileResponse> {
    this.logger.log(`[updateProfile] Editar perfil ${id}`);
    return this.profilesService.updateProfile(Number(id), body);
  }

  @Delete('profiles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un perfil' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Perfil eliminado exitosamente' })
  async deleteProfile(@Param('id') id: string): Promise<CreateProfileResponse> {
    this.logger.log(`[deleteProfile] Eliminar perfil ${id}`);
    return this.profilesService.deleteProfile(Number(id));
  }

  @Get('users/:userId/profiles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfiles de un usuario (en la sucursal actual)' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Perfiles del usuario' })
  async getUserProfiles(@Param('userId') userId: string): Promise<UserProfilesResponse> {
    this.logger.log(`[getUserProfiles] Obtener perfiles para usuario ${userId}`);
    return this.profilesService.getUserProfiles(Number(userId));
  }

  @Put('users/:userId/profiles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar perfiles a un usuario (en la sucursal actual)' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Perfiles asignados exitosamente' })
  async assignProfiles(@Param('userId') userId: string, @Body() body: AssignProfilesDto): Promise<CreateProfileResponse> {
    this.logger.log(`[assignProfiles] Asignar perfiles a usuario ${userId}`);
    return this.profilesService.assignProfilesToUser(Number(userId), body.profileIds);
  }
}
