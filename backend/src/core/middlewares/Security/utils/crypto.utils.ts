import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes } from 'crypto';

export type HeadersForCrypto = { 
  'transaction-id': string; 
  'span-id': string;
  'channel-name':string;
  'channel-id':string
 };

const ALGORITHM = 'aes-256-ctr';
const IV_LEN = 16;
const MAC_LEN = 32;

function deriveKeys(header: HeadersForCrypto) {
  const combined = `${header['channel-name']}__${header['span-id']}&&${header['transaction-id']}||${header['channel-id']}`;
  const encKey = createHash('sha256').update(combined).digest();
  const macKey = createHash('sha256').update(encKey).update('hmac').digest();
  return { encKey, macKey };
}

/**
 * Encrypts data to raw bytes: [IV (16)] [ciphertext (N)] [HMAC (32)]
 */
export function encryptToBuffer(data: unknown, header: HeadersForCrypto): Buffer {
  const { encKey, macKey } = deriveKeys(header);
  const iv = randomBytes(IV_LEN);
  const plain = typeof data === 'string' ? data : JSON.stringify(data);

  const cipher = createCipheriv(ALGORITHM, encKey, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const mac = createHmac('sha256', macKey).update(iv).update(ct).digest();

  return Buffer.concat([iv, ct, mac]);
}

/**
 * Decrypts raw bytes produced by encryptToBuffer().
 */
export function decryptFromBuffer(buf: Buffer, header: HeadersForCrypto): unknown {
  const { encKey, macKey } = deriveKeys(header);

  if (buf.length < IV_LEN + MAC_LEN) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = buf.subarray(0, IV_LEN);
  const ct = buf.subarray(IV_LEN, buf.length - MAC_LEN);
  const mac = buf.subarray(buf.length - MAC_LEN);

  const expectedMac = createHmac('sha256', macKey).update(iv).update(ct).digest();
  if (!mac.equals(expectedMac)) {
    throw new Error('Integrity check failed');
  }

  const decipher = createDecipheriv(ALGORITHM, encKey, iv);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');

  try { return JSON.parse(plain); } catch { return plain; }
}
