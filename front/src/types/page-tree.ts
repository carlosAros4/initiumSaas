export interface PageTree {
  id: number;
  name: string;
  module: string | null;
  url: string | null;
  slug: string;
  order: number;
  type: 'module' | 'label' | 'link';
  accessRule: string | null;
  children: PageTree[];
}

export interface UserRoutesResponse {
  pageTree: PageTree[];
  accessRules: string[];
}

export interface RouteConfig {
  key: string;
  path: string;
  name: string;
}

export interface modulesRouter {
  module: string;
  url: string;
}


