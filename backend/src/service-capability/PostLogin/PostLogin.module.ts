import { Module } from '@nestjs/common';
import { PostLoginController } from './controllers/post-login.controller';
import { PostLoginService } from './service/post-login.service';
import { PostLoginImpl } from './implements/post-login.repository.impl';

@Module({
  imports: [],
  controllers: [PostLoginController],
  providers: [
    PostLoginService,
    {
      provide: 'POST_LOGIN',
      useClass: PostLoginImpl,
    },
  ],
})
export class PostLoginModule {}
