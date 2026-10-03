
import type { HeadersForCrypto } from './fetcher.types';

const ALGORITHM = 'AES-CTR';
const IV_LEN = 16;
const MAC_LEN = 32;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKeys(headers: HeadersForCrypto) {
  const combined = `${headers['channel-name']}__${headers['span-id']}&&${headers['transaction-id']}||${headers['channel-id']}`;
  const encHash = await crypto.subtle.digest('SHA-256', encoder.encode(combined));
  const encKeyBytes = new Uint8Array(encHash);

  const macInput = new Uint8Array(encKeyBytes.length + 4);
  macInput.set(encKeyBytes);
  macInput.set(encoder.encode('hmac'), encKeyBytes.length);
  const macHash = await crypto.subtle.digest('SHA-256', macInput);

  const encKey = await crypto.subtle.importKey('raw', encHash, { name: ALGORITHM }, false, ['encrypt', 'decrypt']);
  const macKey = await crypto.subtle.importKey('raw', macHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  return { encKey, macKey };
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

/**
 * Decrypts binary response: [IV (16)] [ciphertext (N)] [HMAC (32)]
 */
export async function decryptResponse(buffer: ArrayBuffer, headers: HeadersForCrypto): Promise<unknown> {
  const buf = new Uint8Array(buffer);
  if (buf.length < IV_LEN + MAC_LEN) throw new Error('Invalid encrypted payload');

  const iv = buf.subarray(0, IV_LEN);
  const ct = buf.subarray(IV_LEN, buf.length - MAC_LEN);
  const mac = buf.subarray(buf.length - MAC_LEN);
  const { encKey, macKey } = await deriveKeys(headers);

  const macData = new Uint8Array(iv.length + ct.length);
  macData.set(iv);
  macData.set(ct, iv.length);
  const expectedMac = new Uint8Array(await crypto.subtle.sign('HMAC', macKey, macData));

  if (!timingSafeEqual(mac, expectedMac)) throw new Error('Integrity check failed');

  const plainBuf = await crypto.subtle.decrypt(
    { name: ALGORITHM, counter: iv as unknown as BufferSource, length: 128 },
    encKey,
    ct as unknown as BufferSource,
  );

  const plain = decoder.decode(plainBuf);
  try { return JSON.parse(plain); } catch { return plain; }
}

/**
 * Encrypts data to binary: [IV (16)] [ciphertext (N)] [HMAC (32)]
 */
export async function encryptRequest(data: unknown, headers: HeadersForCrypto): Promise<ArrayBuffer> {
  const { encKey, macKey } = await deriveKeys(headers);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const plain = typeof data === 'string' ? data : JSON.stringify(data);

  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: ALGORITHM, counter: iv as unknown as BufferSource, length: 128 },
    encKey,
    encoder.encode(plain),
  ));

  const macData = new Uint8Array(iv.length + ct.length);
  macData.set(iv);
  macData.set(ct, iv.length);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', macKey, macData));

  const result = new Uint8Array(iv.length + ct.length + mac.length);
  result.set(iv);
  result.set(ct, iv.length);
  result.set(mac, iv.length + ct.length);
  return result.buffer;
}
