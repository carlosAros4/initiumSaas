import { createContext } from "react";

export type ClientType = "InitiumSaaS-Public" |"InitiumSaaS-Private" | "other";

export interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
}

export interface CallApiParams {
  path: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  redis?: boolean;
  headers?: Record<string, string>;
  skipEncrypt?: boolean;
  clientType: ClientType;
  token?:string;
  /** true para descargas de archivos binarios (PDF, Excel, etc.) */
  document?: boolean;
  /** Nombre del archivo al descargar (solo aplica con document: true). */
  fileName?: string;
}

export interface ICallApiContext {
  useFetch: <T = unknown>(params: CallApiParams) => UseFetchResult<T>;
  fetcher: <T = unknown>(params: CallApiParams) => Promise<T>;
}



export const CallApiContext = createContext<ICallApiContext | null>(null);
