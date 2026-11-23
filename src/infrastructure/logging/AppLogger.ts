import winston from 'winston';
import { config } from '../../config';

export interface ILogger {
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
}

export class AppLogger implements ILogger {
  private static instance: AppLogger;
  private logger: winston.Logger;

  private constructor() {
    const formats = [
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
    ];

    if (config.app.isProduction) {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          let output = `[${timestamp}] ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            output += ` ${JSON.stringify(meta)}`;
          }
          if (stack) {
            output += `\n${stack}`;
          }
          return output;
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(...formats),
      transports: [
        new winston.transports.Console({
          silent: config.app.isTest,
        }),
      ],
    });
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  public info(message: string, context?: unknown): void {
    this.logger.info(message, context ? { context } : undefined);
  }

  public warn(message: string, context?: unknown): void {
    this.logger.warn(message, context ? { context } : undefined);
  }

  public error(message: string, context?: unknown): void {
    this.logger.error(message, context ? { context } : undefined);
  }

  public debug(message: string, context?: unknown): void {
    this.logger.debug(message, context ? { context } : undefined);
  }
}

export const logger = AppLogger.getInstance();
