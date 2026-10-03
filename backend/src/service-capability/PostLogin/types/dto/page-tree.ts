export interface AccessRule {
  id: number;
  accessKey: string;
  module: string;
  description: string | null;
}

export type typePage=  'module' |'label' |'link';


export interface PageTree {
  id: number;
  name: string;
  module: string | null;
  url: string | null;
  slug: string;
  order: number;
  type: typePage;
  accessRule: string | null;
  children: PageTree[];
}
