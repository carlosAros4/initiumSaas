export interface SiteConfigResponse {
  id: number;
  nameSite: string;
  enabled: boolean;
}

export interface SiteNameItem {
  nameSite: string;
}

export interface SalesRequest {
  nameSite: string;
  enabled: boolean;
}
