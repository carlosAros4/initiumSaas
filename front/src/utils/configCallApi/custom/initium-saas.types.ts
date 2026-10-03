import { defineHttpClientConfig } from "../builders/http-client-builder";
import type { ClientConfig } from "../types/client-config.types";
import type { ClientPlugin } from "../types/plugin.types";

export interface InitiumSaaSDefaultHeaders extends Record<string, string> {
  ['channel-id']: string;
  ['transaction-id']: string;
  ['channel-name']: string;
  ['span-id']: string;
}

export interface InitiumSaaSlientConfig extends ClientConfig {
  headers: InitiumSaaSDefaultHeaders;
}

export const InitiumSaaSPrivatePluginPlatform: ClientPlugin<'Initium-private', InitiumSaaSlientConfig> = {
  type: 'Initium-private',
  builder: (config: InitiumSaaSlientConfig) => {
    return defineHttpClientConfig<InitiumSaaSlientConfig>({
      ...config,
    });
  },
};
