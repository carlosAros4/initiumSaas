import { Module } from '@nestjs/common';
import { LoginController } from './controllers/login.controller';
import { LoginImpl } from './implements/login.repository.impl';
import { LoginService } from './service/login.service';

@Module({
  controllers: [LoginController],
  providers: [
    LoginService,
    {
      provide: 'LOGIN',
      useClass: LoginImpl,
    },
  ],
})
export class LoginModule {}
