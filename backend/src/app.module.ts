import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { BffConfigModule } from './core/config.module';
import { LoginModule } from './service-capability/Login/Login.module';
import { SecurityMiddleware } from './core/middlewares/Security/Security.middleware';
import { IntrospectMiddleware } from './core/middlewares/introspect/Instrospect.middleware';
import { RegisterModule } from './service-capability/registerCompany/Register.module';
import { SessionModule } from './service-capability/Session/Session.module';
import { PostLoginModule } from './service-capability/PostLogin/PostLogin.module';
import { SettingsModule } from './service-capability/Settings/Settings.module';
import { SalesCompanyModule } from './service-capability/SalesCompany/SalesCompany.module';
import { UserSessionModule } from './core/providers/user-session';
import { RedisModule } from './core/redis';

@Module({
  imports: [
    BffConfigModule.forRoot(),
    HealthModule,
    LoginModule,
    RegisterModule,
    SessionModule,
    PostLoginModule,
    SettingsModule,
    SalesCompanyModule,
    UserSessionModule,
    RedisModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      // .exclude(
      //   { path: 'auth/(.*)', method: RequestMethod.ALL },
       
      // )
      .forRoutes('*');
    
    consumer
      .apply(IntrospectMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'sales-company/public/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
