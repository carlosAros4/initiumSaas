import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ISalesCompanyRepository } from '../types/interfaces/sales-company.repository';
import { SalesRequest, SiteConfigResponse, SiteNameItem } from '../types/dto/sales-company.dto';import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

@Injectable()
export class SalesCompanyService {
  private readonly logger = new Logger(SalesCompanyService.name);

  constructor(
    @Inject('SALES_COMPANY') private readonly repository: ISalesCompanyRepository,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  async getSiteConfig(): Promise<SiteConfigResponse | null> {
    this.logger.log('[getSiteConfig] Obteniendo configuración del sitio');

    if (!this.userSession || !this.userSession.tenant_id) {
      this.logger.warn('[getSiteConfig] No hay tenant_id en el token');
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return this.repository.getSiteConfig(this.userSession.tenant_id);
  }
  async setData(data:SalesRequest): Promise<string> {
    this.logger.log('[getSiteConfig] Obteniendo configuración del sitio');

    if (!this.userSession || !this.userSession.tenant_id) {
      this.logger.warn('[getSiteConfig] No hay tenant_id en el token');
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    await this.repository.setData(this.userSession.tenant_id,data)

    return 'ok';
  }

  async getAllSiteNames(): Promise<SiteNameItem[]> {
    this.logger.log('[getAllSiteNames] Obteniendo todos los name_site');
    return this.repository.getAllSiteNames();
  }
}
