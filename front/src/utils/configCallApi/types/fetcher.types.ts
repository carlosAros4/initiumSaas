export interface FetcherOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    withCredentials?: boolean;
    skipEncrypt?: boolean;
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
