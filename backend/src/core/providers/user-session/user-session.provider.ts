import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { createDecipheriv, createCipheriv, createHash, randomBytes } from 'crypto';
import { UserSession } from './user-session.interface';

export const USER_SESSION = 'USER_SESSION';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const key = process.env.KEY_TENANT_ID;
  if (!key) throw new Error('KEY_TENANT_ID is not defined');
  // Derivar 32 bytes con SHA-256 para que cualquier string sea válido como key
  return createHash('sha256').update(key).digest();
}

export function encryptTenantId(tenantId: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(tenantId, 'utf8'), cipher.final()]);
  // Formato: iv:encrypted (ambos en hex)
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptTenantId(encryptedTenantId: string): string {
  const key = getKey();
  const [ivHex, encryptedHex] = encryptedTenantId.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export const UserSessionProvider: Provider<UserSession | null> = {
  provide: USER_SESSION,
  scope: Scope.REQUEST,
  useFactory: (req: Request): UserSession | null => {
    const user = (req['user'] as UserSession) ?? null;
    if (!user) return null;

    // Solo desencriptar tenant_id si viene en el token
    if (user.tenant_id) {
      return {
        ...user,
        tenant_id: decryptTenantId(user.tenant_id),
        branch_id: user.branch_id ?? null,
      };
    }

    return {
      ...user,
      branch_id: user.branch_id ?? null,
    };
  },
  inject: [REQUEST],
};