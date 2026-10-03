import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { RegisterController } from './controllers/Register.controller';
import { RegisterImpl } from './implements/Register.repository.impl';
import { RegisterService } from './service/Register.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RegisterController],
  providers: [
    RegisterService,
    {
      provide: 'REGISTER',
      useClass: RegisterImpl,
    },
  ],
})
export class RegisterModule {}
