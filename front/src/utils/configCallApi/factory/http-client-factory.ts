
import { buildFetcher } from "../builders/build-fetcher";
import { buildUseFetch } from "../builders/build-use-fetch";
import type { FactoryConfig } from "../types/client-builders.types";
import type { ClientPlugin } from "../types/plugin.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const httpClientFactory = <TPlugins extends ClientPlugin<any, any>[]>(plugins: TPlugins) => {
  const registry = new Map<string, (config: unknown) => unknown>(
    plugins.map((p) => [p.type, p.builder])
  );

  const create = (factoryConfig: FactoryConfig<TPlugins>) => {
    const builder = registry.get(factoryConfig.type);
    if (!builder) throw new Error(`Client "${factoryConfig.type}" not registered`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientConfig = builder((factoryConfig as any).config) as import("../types/client-config.types").AnyClientConfig;
    const fetcher = buildFetcher(clientConfig);
    const useFetch = buildUseFetch(fetcher);
    const headers = clientConfig.headers;
    return { fetcher, useFetch, headers };
  };

  return { create };
};
