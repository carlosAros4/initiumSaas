import { Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Health')
@Controller('health')
export class HealthController {

  @Get()
  check() {
    return { data:111};
  }

  @Post('echo')
  echo(@Req() req: Request) {
    return {
      data: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      },
    };
  }
}
