import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../domain/exceptions';
import { logger } from '../../../infrastructure/logging/AppLogger';
import { config } from '../../../config';

export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(`[AppError ${error.statusCode}] ${error.message}`, {
        url: req.originalUrl,
        method: req.method,
        details: error.details,
        stack: error.stack,
      });
    } else {
      logger.warn(`[ClientError ${error.statusCode}] ${error.message}`, {
        url: req.originalUrl,
        method: req.method,
        details: error.details,
      });
    }

    res.status(error.statusCode).json({
      success: false,
      error: {
        type: error.name,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        details: error.details,
      },
    });
    return;
  }

  // Erro não tratado (Uncaught Exception)
  logger.error(`[UnhandledError] ${error.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: error.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      type: 'InternalServerError',
      message: 'Ocorreu um erro interno no servidor ao processar sua solicitação',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(config.app.isProduction ? {} : { stack: error.stack }),
    },
  });
}
