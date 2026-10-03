import type { PageTree } from "../types/page-tree";

export interface RouteItem {
  module: string;
  url: string;
}

export function pageFilter(pagetree: PageTree[]): RouteItem[] {
  const result: RouteItem[] = [];

  for (let i = 0; i < pagetree.length; i++) {
    if (pagetree[i].module && pagetree[i].url) {
      result.push({
        module: pagetree[i].module!,
        url: pagetree[i].url!,
      });
    }
    if (pagetree[i].children.length > 0) {
      result.push(...pageFilter(pagetree[i].children));
    }
  }

  return result;
}
