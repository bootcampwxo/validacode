import { Request, Response } from 'express';
import { DatabasePool } from '../../../infrastructure/database/DatabasePool';
import { config } from '../../../config';

export class HealthController {
  constructor(private readonly db: DatabasePool = DatabasePool.getInstance()) {}

  public check = async (_req: Request, res: Response): Promise<void> => {
    const dbHealth = await this.db.healthCheck();
    const uptimeSeconds = Math.floor(process.uptime());

    const status = dbHealth.isHealthy ? 'UP' : 'DOWN';
    const statusCode = dbHealth.isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      appName: config.app.name,
      environment: config.app.env,
      uptimeSeconds,
      components: {
        database: {
          status: dbHealth.isHealthy ? 'UP' : 'DOWN',
          latencyMs: dbHealth.latencyMs,
          host: config.database.host,
          database: config.database.database,
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapTotalMb: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        },
      },
    });
  };
}
