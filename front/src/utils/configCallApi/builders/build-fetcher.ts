
import { FetcherError, type BlobResponse, type FetcherOptions, type HeadersForCrypto } from "../types/fetcher.types";

/** Extrae el nombre del archivo desde el header Content-Disposition. */
function parseFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  // Soporta filename="x.pdf" y filename*=UTF-8''x.pdf
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const match = contentDisposition.match(/filename="?([^"\n;]+)"?/i);
  return match?.[1] ?? null;
}
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
      document = false,
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

    // Respuesta binaria (descarga de archivos: PDF, Excel, etc.)
    if (document) {
      if (!res.ok) {
        const errText = await res.text().catch(() => null);
        throw new FetcherError<T>(`HTTP ${res.status}: ${res.statusText}`, res.status, errText as T);
      }
      const blob = await res.blob();
      const fileName = parseFileName(res.headers.get('content-disposition'));
      return { blob, fileName } as BlobResponse as T;
    }

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
