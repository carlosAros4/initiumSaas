export type Proxy =
  | { enabled: true; path: string }
  | { enabled: false };

export interface ClientConfig {
  baseDomain: string;
  headers: Record<string, string>;
  withCredentials?: boolean;
}

// Resolved dynamically from registered plugins — see createClient
export type AnyClientConfig = ClientConfig;
