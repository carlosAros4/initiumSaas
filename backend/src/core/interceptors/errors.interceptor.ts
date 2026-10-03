import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export class TechnicalException extends HttpException {
  constructor(message: string) {
    super({ message, error: 'TechnicalException' }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;

    return next.handle().pipe(
      catchError((error) => {
        // HttpException conocidas (4xx) → solo warn
        if (error instanceof HttpException) {
          const resBody = error.getResponse();
          const detail =
            typeof resBody === 'object' ? JSON.stringify(resBody) : resBody;
          this.logger.warn(
            `[${method} ${url}] ${error.getStatus()} — ${error.message} — ${detail}`,
          );
          return throwError(() => error);
        }

        // Errores técnicos (DB, etc.) → error completo con stack
        this.logger.error(
          `[${method} ${url}] Unhandled error — ${error.message}`,
          error.stack,
        );

        if (!error.status) {
          return throwError(() => new TechnicalException(error.message || 'Internal error'));
        }

        return throwError(
          () => new HttpException(error.message || 'Error', error.status),
        );
      }),
    );
  }
}
