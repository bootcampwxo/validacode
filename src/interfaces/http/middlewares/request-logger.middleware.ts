import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logging/AppLogger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    const logMsg = `${method} ${originalUrl} ${statusCode} - ${duration}ms [${ip}]`;

    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
}
