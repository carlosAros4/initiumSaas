export interface FetcherOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    withCredentials?: boolean;
    skipEncrypt?: boolean;
    /** true para descargas de archivos binarios (PDF, Excel, etc.) */
    document?: boolean;
}

/** Resultado de una respuesta binaria. El fileName se obtiene del header Content-Disposition. */
export interface BlobResponse {
    blob: Blob;
    fileName: string | null;
}

export type HeadersForCrypto = { 
  'transaction-id': string; 
  'span-id': string;
  'channel-name':string;
  'channel-id':string
 };
export class FetcherError<T = unknown> extends Error {
    status: number;
    data: T | null;
    constructor(message: string, status: number, data: T | null,
    ) {
        super(message);
        this.name = 'FetcherError';
        this.status = status;
        this.data = data;
    }
}
