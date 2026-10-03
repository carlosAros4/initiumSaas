import type { ClientPlugin } from "./plugin.types";

// Infer the union of all plugin types from a plugin array
export type PluginTypeUnion<TPlugins extends ClientPlugin[]> = TPlugins[number]['type'];

// Infer the config type for a given plugin type
export type PluginConfig<
  TPlugins extends ClientPlugin[],
  TType extends PluginTypeUnion<TPlugins>
> = Extract<TPlugins[number], { type: TType }> extends ClientPlugin<TType, infer TConfig>
  ? TConfig
  : never;

// Factory config derived from registered plugins
export type FactoryConfig<TPlugins extends ClientPlugin[]> = {
  [K in PluginTypeUnion<TPlugins>]: { type: K; config: PluginConfig<TPlugins, K> }
}[PluginTypeUnion<TPlugins>];
