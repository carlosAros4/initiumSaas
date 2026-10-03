
import { FetcherError, type FetcherOptions, type HeadersForCrypto } from "../types/fetcher.types";
import type { AnyClientConfig } from "../types/client-config.types";
import { decryptResponse, encryptRequest } from "../types/decrypt";

function extractCryptoHeaders(headers: Record<string, string>): HeadersForCrypto | null {
  const txId = headers['transaction-id'];
  const spanId = headers['span-id'];
  const channelname = headers['channel-name'];
  const channelID = headers['channel-id'];

  if (!txId || !channelID || !channelname || !spanId) return null;

  return {
    "channel-id": channelID,
    "channel-name": channelname,
    'transaction-id': txId,
    'span-id': spanId
  };
}

export function buildFetcher(config: AnyClientConfig) {
  const { baseDomain, headers: baseHeaders, withCredentials: baseWithCredentials = false } = config;

  return async function fetcher<T = unknown>(path: string, options: FetcherOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      withCredentials = baseWithCredentials,
      skipEncrypt = false,
    } = options;

    const mergedHeaders: Record<string, string> = { ...baseHeaders, ...headers };
    const cryptoHeaders = extractCryptoHeaders(mergedHeaders);
    const shouldEncrypt = !skipEncrypt && !!cryptoHeaders;
    let requestBody: BodyInit | undefined;
    const requestHeaders: Record<string, string> = { ...mergedHeaders };
    if (body != null) {
      if (shouldEncrypt) {
        const encrypted = await encryptRequest(body, cryptoHeaders!);
        requestBody = encrypted;
        requestHeaders['Content-Type'] = 'application/octet-stream';
      } else {
        requestBody = JSON.stringify(body);
        requestHeaders['Content-Type'] = 'application/json';
      }
    } else {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseDomain}${path}`, {
      method,
      headers: requestHeaders,
      credentials: withCredentials ? 'include' : 'same-origin',
      body: requestBody,
    }).catch((err) => {
      throw new FetcherError(err instanceof Error ? err.message : String(err), 0, null);
    });

    const isEncrypted = res.headers.get('content-type')?.includes('application/octet-stream');

    if (isEncrypted && shouldEncrypt) {
      const buffer = await res.arrayBuffer();
      let decrypted: unknown;
      try {
        decrypted = await decryptResponse(buffer, cryptoHeaders!);
      } catch (err) {
        throw new FetcherError(
          `Decryption failed: ${err instanceof Error ? err.message : String(err)}`,
          res.status,
          null,
        );
      }
      if (!res.ok) {
        throw new FetcherError<T>(`HTTP ${res.status}: ${res.statusText}`, res.status, decrypted as T);
      }
      return decrypted as T;
    }

    // Non-encrypted response (fallback)
    const raw = await res.json().catch(() => null);
    if (!res.ok) throw new FetcherError<T>(`HTTP ${res.status}: ${res.statusText}`, res.status, raw);
    return raw as T;
  };
}
