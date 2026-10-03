import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SessionService } from '../service/session.service';
import { CompanyRequestDto, BranchRequestDto } from '../types/dto/register-request.dto';
import { ChangePasswordRequestDto } from '../types/dto/change-password-request.dto';
import { RefreshResponseDto, SelectBranchResponseDto, SelectCompanyResponseDto, SessionResponseDto } from '../types/dto/session.dto';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('session')
@Controller({ path: 'session' })
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * GET /api/session
   * Retorna datos básicos del cliente, company y branch desde Redis
   */
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener sesión activa', description: 'Retorna datos del cliente, company y branch desde Redis.' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  async getsession() {
    this.logger.log('[me] Obteniendo datos de sesión');
    return this.sessionService.getSessionData();
  }

  /**
   * POST /api/session/refresh
   * Renueva access_token y refresh_token usando la cookie refresh_token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token', description: 'Renueva los tokens usando el refresh_token de las cookies.' })
  @ApiResponse({ status: 200, type: RefreshResponseDto })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    this.logger.log('[refreshToken] Intentando renovar tokens');

    const refreshToken = request.cookies?.['refresh_token'];
    const { accessToken, newRefreshToken } = await this.sessionService.refreshToken(refreshToken);

    response.cookie('access_token', accessToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    response.cookie('refresh_token', newRefreshToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    this.logger.log('[refreshToken] Tokens renovados exitosamente');
    return { message: 'Tokens renovados' };
  }

  /**
   * POST /api/session/company
   * Selecciona una empresa y opcionalmente la marca como favorita
   */
  @Post('company')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seleccionar empresa', description: 'Selecciona una empresa, carga sucursales y recalcula permisos.' })
  @ApiResponse({ status: 200, type: SelectCompanyResponseDto })
  async selectCompany(
    @Body() body: CompanyRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SelectCompanyResponseDto> {
    this.logger.log('[selectCompany] Seleccionando empresa');

    const refreshToken = request.cookies?.['refresh_token'];
    const result = await this.sessionService.selectCompany(body, refreshToken);

    // Setear los nuevos tokens en cookies
    response.cookie('access_token', result.accessToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    response.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    return result;
  }

  /**
   * POST /api/session/branch
   * Selecciona una sucursal y recalcula permisos para esa sucursal
   */
  @Post('branch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seleccionar sucursal', description: 'Selecciona una sucursal, recalcula permisos filtrados por branch.' })
  @ApiResponse({ status: 200, type: SelectBranchResponseDto })
  async selectBranch(
    @Body() body: BranchRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SelectBranchResponseDto> {
    this.logger.log('[selectBranch] Seleccionando sucursal');

    const refreshToken = request.cookies?.['refresh_token'];
    const result = await this.sessionService.selectBranch(body, refreshToken);

    // Setear los nuevos tokens en cookies
    response.cookie('access_token', result.accessToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    response.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    return result;
  }

  /**
   * POST /api/session/change-password
   * Cambia la contraseña del usuario autenticado y limpia la marca newUsers.
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña', description: 'Actualiza la contraseña del usuario y limpia la marca de usuario nuevo.' })
  async changePassword(@Body() body: ChangePasswordRequestDto): Promise<{ message: string }> {
    this.logger.log('[changePassword] Solicitud de cambio de contraseña');
    return this.sessionService.changePassword(body);
  }
}
