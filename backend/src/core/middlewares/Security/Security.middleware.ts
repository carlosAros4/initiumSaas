import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { decryptFromBuffer, encryptToBuffer, HeadersForCrypto } from './utils/crypto.utils';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') return next();

    const channelName = req.headers['channel-name'] as string | undefined;
    const channelID = req.headers['channel-id'] as string | undefined;
    const transactionID = req.headers['transaction-id'] as string | undefined;
    const spanID = req.headers['span-id'] as string | undefined;
    const headersCrypto: HeadersForCrypto = {
      'span-id': spanID,
      'transaction-id': transactionID,
      'channel-id': channelID,
      'channel-name': channelName,
    };

    // Decrypt request body
    const body = req.body;
    if (body && Buffer.isBuffer(body) && body.length > 0) {
      try {
        req.body = decryptFromBuffer(body, headersCrypto);
      } catch (error) {
        return next(error);
      }
    }

    // Encrypt response
    const originalJson = res.json.bind(res);
    let sent = false;

    res.json = (body: any): Response => {
      if (sent) return originalJson(body);
      sent = true;
      const buf = encryptToBuffer(body, headersCrypto);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', buf.length);
      res.end(buf);
      return res;
    };

    next();
  }
}
