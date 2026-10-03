import { SalesRequest, SiteConfigResponse, SiteNameItem } from '../dto/sales-company.dto';

export interface ISalesCompanyRepository {
  getSiteConfig(tenantId: string): Promise<SiteConfigResponse | null>;
  setData(tenantId: string, data: SalesRequest);
  getAllSiteNames(): Promise<SiteNameItem[]>;
}
