import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../../config';
import { DatabaseError } from '../../domain/exceptions';

export class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;
  private isConnected = false;

  private constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: config.database.timeoutMs,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('[DatabasePool] Erro inesperado no cliente do pool PostgreSQL:', err);
    });
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  public getRawPool(): Pool {
    return this.pool;
  }

  public async query<T extends QueryResultRow = any>(
    text: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.debug('[SQL Query]', { text, duration: `${duration}ms`, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error('[DatabasePool] Falha na execução da query:', { text, params, error });
      throw new DatabaseError(
        `Erro ao executar query no banco de dados: ${(error as Error).message}`,
        error
      );
    }
  }

  public async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new DatabaseError('Não foi possível obter conexão do pool de banco de dados', error);
    }
  }

  public async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { isHealthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { isHealthy: false, latencyMs: Date.now() - start };
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
