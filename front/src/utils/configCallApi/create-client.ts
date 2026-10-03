

import { InitiumSaaSPublicPluginPlatform } from "./custom/initium-saas.public.types";
import { InitiumSaaSPrivatePluginPlatform } from "./custom/initium-saas.types";
import { OthersPluginPlatform } from "./custom/others.types";
import { httpClientFactory } from "./factory/http-client-factory";


const plugins: [typeof InitiumSaaSPrivatePluginPlatform,typeof InitiumSaaSPublicPluginPlatform ,typeof OthersPluginPlatform ] = [
  InitiumSaaSPrivatePluginPlatform,InitiumSaaSPublicPluginPlatform,OthersPluginPlatform

];

// se agregan todos los plugins de llamas api para persona
const factory: ReturnType<typeof httpClientFactory<typeof plugins>> = httpClientFactory(plugins);

export function createClient(config: Parameters<typeof factory.create>[0]): ReturnType<typeof factory.create> {
  return factory.create(config);
}
