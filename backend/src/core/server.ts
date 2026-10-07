import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ErrorsInterceptor } from './interceptors/errors.interceptor';


export class BffServer {
  private moduleRef: any;

  withModule(module: any): this {
    this.moduleRef = module;
    return this;
  }

  async start(): Promise<void> {
    const app = await NestFactory.create(this.moduleRef, { bufferLogs: true, bodyParser: false });

    // Body parsers
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').raw({ type: 'application/octet-stream', limit: '10mb' }));

    // CORS
    app.enableCors({
      origin: ['http://localhost'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'channel-id',
        'channel-name',
        'transaction-id',
        'span-id',
        'x-layer-data',
        'x-api-id',
        'x-client-id',
        'x-transaction-id',
        'x-span-id',
        'application',
      ],
      exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Cookie parser
    app.use(cookieParser());

    // ClassSerializer + ErrorsInterceptor globales
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new ErrorsInterceptor(),
    );

    // Validation pipe global
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    // Versionado URI
    app.enableVersioning({ type: VersioningType.URI });

    // Global prefix (excluye /health)
    app.setGlobalPrefix('initium-saas/', { exclude: ['/health', '/health/echo'] });

    // Swagger
    const config = new DocumentBuilder()
      .setTitle('BFF API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Server running on port ${port}`);
  }
}
