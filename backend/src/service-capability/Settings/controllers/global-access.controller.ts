import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GlobalAccessService } from '../service/global-access.service';
import {
  GlobalAccessSectionResponse, UserGlobalAccessResponse, AssignGlobalAccessDto, GlobalAccessResponse,
} from '../types/dto/users.dto';

@ApiTags('settings')
@Controller({ path: 'settings/global-access' })
export class GlobalAccessController {
  private readonly logger = new Logger(GlobalAccessController.name);

  constructor(private readonly globalAccessService: GlobalAccessService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener páginas globales y usuarios', description: 'Retorna las páginas marcadas como globales con sus reglas de acceso y los usuarios de la empresa.' })
  @ApiResponse({ status: 200, description: 'Páginas globales y usuarios' })
  async getGlobalAccessSection(): Promise<GlobalAccessSectionResponse> {
    this.logger.log('[getGlobalAccessSection] Solicitud de sección de accesos globales');
    return this.globalAccessService.getGlobalAccessSection();
  }

  @Get('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener accesos globales de un usuario' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Accesos globales del usuario' })
  async getUserGlobalAccess(@Param('userId') userId: string): Promise<UserGlobalAccessResponse> {
    this.logger.log(`[getUserGlobalAccess] Accesos globales de usuario ${userId}`);
    return this.globalAccessService.getUserGlobalAccess(Number(userId));
  }

  @Put('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar accesos globales a un usuario', description: 'Reemplaza el set de accesos globales del usuario. Solo se admiten access_key de páginas globales.' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID del usuario en el tenant' })
  @ApiResponse({ status: 200, description: 'Accesos globales actualizados' })
  @ApiResponse({ status: 400, description: 'Accesos no válidos para páginas globales' })
  async assignGlobalAccess(@Param('userId') userId: string, @Body() body: AssignGlobalAccessDto): Promise<GlobalAccessResponse> {
    this.logger.log(`[assignGlobalAccess] Asignar accesos globales a usuario ${userId}`);
    return this.globalAccessService.assignGlobalAccessToUser(Number(userId), body.accessKeys);
  }
}
