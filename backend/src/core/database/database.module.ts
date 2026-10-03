import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { BffConfigModule } from '../config.module';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  imports: [BffConfigModule.forRoot()],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({ connectionString: config.get<string>('DATABASE_URL') }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
