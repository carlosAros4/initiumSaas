import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EnvironmentService } from './environment.service';
import { ErrorsInterceptor } from './interceptors/errors.interceptor';

@Global()
@Module({})
export class BffConfigModule {
  static forRoot({ envFilePath = '.env' } = {}): DynamicModule {
    return {
      module: BffConfigModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath,
          cache: true,
        }),
      ],
      providers: [
        EnvironmentService,
        { provide: APP_INTERCEPTOR, useClass: ErrorsInterceptor },
      ],
      exports: [EnvironmentService],
    };
  }
}
