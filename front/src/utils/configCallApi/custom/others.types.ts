import { defineHttpClientConfig } from "../builders/http-client-builder";
import type { ClientConfig } from "../types/client-config.types";
import type { ClientPlugin } from "../types/plugin.types";



// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OthersClientConfig extends ClientConfig {}

export const OthersPluginPlatform: ClientPlugin<'Others', OthersClientConfig> = {
  type: 'Others',
  builder: (config: OthersClientConfig) => {
    return defineHttpClientConfig<OthersClientConfig>({
      ...config,
    });
  },
};
