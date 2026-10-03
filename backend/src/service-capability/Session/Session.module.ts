import { Module } from '@nestjs/common';
import { SessionController } from './controllers/session.controller';
import { SessionImpl } from './implements/session.repository.impl';
import { SessionService } from './service/session.service';

@Module({
  controllers: [SessionController],
  providers: [
    SessionService,
    {
      provide: 'SESSION',
      useClass: SessionImpl,
    },
  ],
})
export class SessionModule {}
