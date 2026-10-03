import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SalesCompanyService } from '../service/sales-company.service';
import { SalesRequest, SiteConfigResponse, SiteNameItem } from '../types/dto/sales-company.dto';

@ApiTags('sales-company')
@Controller({ path: 'sales-company' })
export class SalesCompanyController {
  private readonly logger = new Logger(SalesCompanyController.name);

  constructor(private readonly salesCompanyService: SalesCompanyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener configuración del sitio',
    description: 'Retorna la configuración del sitio de ventas de la empresa',
  })
  @ApiResponse({ status: 200, description: 'Configuración del sitio' })
  @ApiResponse({ status: 401, description: 'No hay empresa seleccionada' })
  async getSiteConfig(): Promise<SiteConfigResponse | null> {
    this.logger.log('[getSiteConfig] Solicitud para obtener configuración del sitio');
    return this.salesCompanyService.getSiteConfig();
  }
  
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener configuración del sitio',
    description: 'Retorna la configuración del sitio de ventas de la empresa',
  })
  @ApiResponse({ status: 200, description: 'Configuración del sitio' })
  @ApiResponse({ status: 401, description: 'No hay empresa seleccionada' })
  async setRegisterSalesConfig(@Body() body: SalesRequest): Promise<string> {
    this.logger.log('[getSiteConfig] Solicitud para obtener configuración del sitio');
    return this.salesCompanyService.setData(body);
  }

  @Get('public/sites')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los name_site habilitados',
    description: 'Endpoint público que retorna los nombres de sitios activos',
  })
  @ApiResponse({ status: 200, description: 'Lista de sitios habilitados' })
  async getAllSiteNames(): Promise<SiteNameItem[]> {
    this.logger.log('[getAllSiteNames] Solicitud pública para obtener sitios');
    return this.salesCompanyService.getAllSiteNames();
  }
}
