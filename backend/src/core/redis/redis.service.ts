import { Inject, Injectable, Scope } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { USER_SESSION } from '../providers/user-session';
import { UserSession } from '../providers/user-session/user-session.interface';

const DEFAULT_TTL = 7200; // 2 horas en segundos


type keys_redis = 'data_cliente' | 'companySession' | 'branchSession' | 'PageTree' | 'accessRules'
@Injectable({ scope: Scope.REQUEST })
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  private getSessionKey(id: string): string {
    if (!this.userSession?.session_id) {
      throw new Error('No hay sesión activa — no se puede acceder a Redis sin id de sesión');
    }
    return `${this.userSession.session_id}:${id}`;
  }

  /**
   * Guarda data usando el id de sesión del token como key.
   */
  async set<T = any>(id: keys_redis, data: T): Promise<void> {
    const value = JSON.stringify(data);
    await this.redis.set(this.getSessionKey(id), value, 'EX', DEFAULT_TTL);
  }

  /**
   * Lee data usando el id de sesión del token como key.
   */
  async get<T = any>(id: keys_redis): Promise<T | null> {
    const value = await this.redis.get(this.getSessionKey(id));
    return value ? JSON.parse(value) : null;
  }
   async setGeneric<T = any>(id: string, data: T): Promise<void> {
    const value = JSON.stringify(data);
    await this.redis.set(this.getSessionKey(id), value, 'EX', DEFAULT_TTL);
  }

  async getGeneric<T = any>(id: string): Promise<T | null> {
    const value = await this.redis.get(this.getSessionKey(id));
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set para login — no requiere sesión activa, usa key generada manualmente.
   */
  async setLogin<T = any>(key: string, id: keys_redis, data: T): Promise<void> {
    const value = JSON.stringify(data);
    await this.redis.set(`${key}:${id}`, value, 'EX', DEFAULT_TTL);
  }

 

  /**
   * Elimina la data asociada a un id.
   */
  async del(id: string): Promise<void> {
    await this.redis.del(this.getSessionKey(id));
  }

  /**
   * Verifica si existe data para un id.
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.redis.exists(this.getSessionKey(id));
    return result === 1;
  }
}
