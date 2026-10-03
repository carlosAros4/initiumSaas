import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule');

        const client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
          retryStrategy: (times) => {
            if (times > 10) {
              logger.error('Redis: máximo de reintentos alcanzado');
              return null;
            }
            return Math.min(times * 200, 2000);
          },
        });

        client.on('connect', () => logger.log('Redis conectado'));
        client.on('error', (err) => logger.error('Redis error', err.message));
        client.on('close', () => logger.warn('Redis conexión cerrada'));

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
