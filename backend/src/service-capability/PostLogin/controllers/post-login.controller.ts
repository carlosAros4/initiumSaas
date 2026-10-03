import { Body, Controller, Post, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PostLoginService } from '../service/post-login.service';
import { PostLoginRequestDto } from '../types/dto/post-login-request.dto';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('post-login')
@Controller({ path: 'post-login' })
export class PostLoginController {
  private readonly logger = new Logger(PostLoginController.name);

  constructor(private readonly postLoginService: PostLoginService) {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post-login', description: 'Obtiene companies y branches, registra en Redis y emite cookies con tokens.' })
  async postLogin(
    @Body() body: PostLoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`[postLogin] Ejecutando post-login${body?.tenant_id ? ` — tenant_id: ${body.tenant_id}` : ''}`);
    const { accessToken, refreshToken, companies, branches, selectedBranch } = await this.postLoginService.execute(body?.tenant_id);

    // Tokens en cookies seguras
    res.cookie('access_token', accessToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_BASE,
      domain: 'localhost',
    });

    return { companies, branches, selectedBranch };
  }
}
