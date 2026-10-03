import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BranchesService } from '../service/branches.service';
import {
  BranchItem, CreateBranchDto, UpdateBranchDto, BranchUserItem, UpdateBranchUserDto, BranchResponse,
} from '../types/dto/users.dto';

@ApiTags('settings')
@Controller({ path: 'settings/branches' })
export class BranchesController {
  private readonly logger = new Logger(BranchesController.name);

  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar sucursales', description: 'Retorna todas las sucursales de la empresa con cantidad de usuarios.' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  async getBranches(): Promise<BranchItem[]> {
    this.logger.log('[getBranches] Solicitud para listar sucursales');
    return this.branchesService.getBranches();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear sucursal', description: 'Crea una nueva sucursal en la empresa.' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  async createBranch(@Body() body: CreateBranchDto): Promise<BranchResponse> {
    this.logger.log(`[createBranch] Crear sucursal: ${body.name}`);
    return this.branchesService.createBranch(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar sucursal', description: 'Actualiza nombre, dirección, teléfono o estado de una sucursal.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  async updateBranch(@Param('id') id: string, @Body() body: UpdateBranchDto): Promise<BranchResponse> {
    this.logger.log(`[updateBranch] Editar sucursal ${id}`);
    return this.branchesService.updateBranch(Number(id), body);
  }

  @Get(':id/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios de una sucursal', description: 'Retorna usuarios con su estado (activo, bloqueado, favorita).' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Usuarios de la sucursal' })
  async getBranchUsers(@Param('id') id: string): Promise<BranchUserItem[]> {
    this.logger.log(`[getBranchUsers] Usuarios de sucursal ${id}`);
    return this.branchesService.getBranchUsers(Number(id));
  }

  @Put(':branchId/users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado de usuario en sucursal', description: 'Cambiar active/blocked de un usuario en una sucursal.' })
  @ApiParam({ name: 'branchId', type: 'number', description: 'ID de la sucursal' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado en la sucursal' })
  async updateBranchUser(
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateBranchUserDto,
  ): Promise<BranchResponse> {
    this.logger.log(`[updateBranchUser] Usuario ${userId} en sucursal ${branchId}`);
    return this.branchesService.updateBranchUser(Number(branchId), Number(userId), body);
  }

  @Post(':branchId/users/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar usuario a sucursal', description: 'Agrega un usuario existente del tenant a una sucursal.' })
  @ApiParam({ name: 'branchId', type: 'number', description: 'ID de la sucursal' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 201, description: 'Usuario agregado a la sucursal' })
  async addUserToBranch(
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
  ): Promise<BranchResponse> {
    this.logger.log(`[addUserToBranch] Usuario ${userId} a sucursal ${branchId}`);
    return this.branchesService.addUserToBranch(Number(branchId), Number(userId));
  }

  @Delete(':branchId/users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario de sucursal', description: 'Elimina definitivamente la relación del usuario con la sucursal.' })
  @ApiParam({ name: 'branchId', type: 'number', description: 'ID de la sucursal' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado de la sucursal' })
  async removeUserFromBranch(
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
  ): Promise<BranchResponse> {
    this.logger.log(`[removeUserFromBranch] Usuario ${userId} de sucursal ${branchId}`);
    return this.branchesService.removeUserFromBranch(Number(branchId), Number(userId));
  }

  @Put(':id/main')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar sede principal', description: 'Establece una sucursal como la sede principal de la empresa.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Sede principal actualizada' })
  async setMainBranch(@Param('id') id: string): Promise<BranchResponse> {
    this.logger.log(`[setMainBranch] Cambiar sede principal a ${id}`);
    return this.branchesService.setMainBranch(Number(id));
  }
}
