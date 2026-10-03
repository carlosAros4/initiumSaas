import { Global, Module } from '@nestjs/common';
import { UserSessionProvider } from './user-session.provider';

@Global()
@Module({
  providers: [UserSessionProvider],
  exports: [UserSessionProvider],
})
export class UserSessionModule {}
