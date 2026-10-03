import { Body, Controller, Delete, HttpCode, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginService } from '../service/login.service';
import { SessionRequestDto } from '../types/dto/login-request.dto';
import { loginResponseCompany } from '../types/dto/login';
import { RegisterRequestDto } from '../types/dto/register-request.dto';
import { RegisterResult } from '../types/dto/register';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('auth')
@ApiBearerAuth()
@Controller({ path: 'auth' })
export class LoginController {
  private readonly logger = new Logger(LoginController.name);

  constructor(private readonly loginService: LoginService) { }

  @Post('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'type 2 → accessToken + refreshToken en cookies HttpOnly seguras.',
  })
  async createSession(@Req() request: Request,
    @Body() body: SessionRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<loginResponseCompany | undefined> {
    this.logger.log(`[createSession] Inicio — rut: ${body.rut}, isLogin: ${body.isLogin}`);

    const { accessToken, refreshToken, verified, blocked, newUsers } = await this.loginService.login(body);

    if (!body.isLogin) {
      this.logger.log(`[createSession] Flujo onboarding — token en body`);
      return { accessToken: accessToken, refresh:refreshToken,
        verified: verified, blocked, newUsers, };
    }

    // Tipo 2: tokens en cookies seguras (flujo sesión completa)
    response.cookie('access_token', accessToken,COOKIE_BASE);

    response.cookie('refresh_token', refreshToken, COOKIE_BASE);

    this.logger.log(`[createSession] Sesión creada con cookies`);
    return { verified, blocked, newUsers };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterRequestDto): Promise<RegisterResult> {
    this.logger.log(`[register] Inicio — rut: ${body.rut}, email: ${body.email}`);
    const result = await this.loginService.createUser(body);
    this.logger.log(`[register] Completado — rut: ${body.rut}`);
    return result;
  }

  @Delete('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Elimina las cookies de access_token y refresh_token.' })
  async logout(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
    this.logger.log('[logout] Eliminando cookies de sesión');
    response.clearCookie('access_token', { ...COOKIE_BASE, domain: 'localhost' });
    response.clearCookie('refresh_token', { ...COOKIE_BASE, domain: 'localhost' });
    this.logger.log('[logout] Cookies eliminadas');
    return { message: 'Sesión cerrada' };
  }
}
