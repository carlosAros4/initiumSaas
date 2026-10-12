import { Global, Module } from '@nestjs/common';
import { UserSessionProvider } from './user-session.provider';
import { SessionContextService } from './session-context.service';

@Global()
@Module({
  providers: [UserSessionProvider, SessionContextService],
  exports: [UserSessionProvider, SessionContextService],
})
export class UserSessionModule {}
