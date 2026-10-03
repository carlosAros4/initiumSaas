import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Logger, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RegisterService, RegisterResult } from '../service/Register.service';
import { typeCompaniesResult } from '../types/dto/companys';
import { CreateCompanyRequestDto } from '../types/dto/create-company-request.dto';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';
import { COOKIE_BASE } from 'src/core/utils/cookie.domain';

@ApiTags('client')
@ApiBearerAuth()
@Controller({ path: 'company' })
export class RegisterController {
  private readonly logger = new Logger(RegisterController.name);

  constructor(private readonly service: RegisterService
    ,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null
  ) { }


  @Get('type')
  @HttpCode(HttpStatus.OK)
  async typecompanies(): Promise<typeCompaniesResult> {
    this.logger.log('[typecompanies] Consultando tipos de empresa');
    const data = await this.service.getTypecompanies();
    this.logger.log(`[typecompanies] Resultado — cantidad: ${data.length}`);
    return {
      companies: data
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createCompany(
    @Body() body: CreateCompanyRequestDto,
   @Res({ passthrough: true }) response: Response): Promise<any> {
   
    this.logger.log(`[createCompany] Inicio — nombre: ${body.name}, rut: ${body.rut}`);
    const result = await this.service.createCompany(body);

    if (body.token) {
      response.cookie('access_token', body.token, COOKIE_BASE);
    }
    if (body.refresh) {
      response.cookie('refresh_token', body.refresh, COOKIE_BASE);
    }
    this.logger.log(`[createCompany] Empresa creada exitosamente`);
    return result;
  }
}
