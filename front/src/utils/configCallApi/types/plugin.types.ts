import type { ClientConfig } from "./client-config.types";

export interface ClientPlugin<TType extends string = string, TConfig extends ClientConfig = ClientConfig> {
  type: TType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builder: (config: any) => TConfig;
}
