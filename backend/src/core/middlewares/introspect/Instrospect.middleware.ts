import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class IntrospectMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IntrospectMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
      return next();
    }
    this.logger.log(`[introspect] ${req.method} ${req.originalUrl}`);
    const authHeader = req.headers.authorization;
 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`[introspect] Token no proporcionado — ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET no configurado');
      }
      const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      req['user'] = {
        id: payload.sub,
        rut: payload.rut,
        dv: payload.dv,
        tenant_id: payload.tenant_id ?? null,
        session_id: payload.session_id ?? null,
        branch_id: payload.branch_id ?? null,
        iat: payload.iat,
        exp: payload.exp,
      };
      this.logger.log(`[introspect] Token válido — userId: ${payload.sub}`);
      next();
    } catch (error) {
      this.logger.warn(`[introspect] Token inválido — ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedException('No autorizado');
    }
  }
}