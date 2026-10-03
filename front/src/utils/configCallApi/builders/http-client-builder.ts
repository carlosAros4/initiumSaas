import type { ClientConfig } from "../types/client-config.types";

export function defineHttpClientConfig<T extends ClientConfig = ClientConfig>(clientConfig: T): T {
  return clientConfig;
}
