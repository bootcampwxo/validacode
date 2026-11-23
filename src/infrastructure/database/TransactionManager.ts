import { PoolClient } from 'pg';
import { DatabasePool } from './DatabasePool';
import { DatabaseError } from '../../domain/exceptions';

export interface ITransactionContext {
  client: PoolClient;
  query<T = any>(text: string, params?: unknown[]): Promise<T[]>;
}

export class TransactionManager {
  private readonly dbPool: DatabasePool;

  constructor(dbPool?: DatabasePool) {
    this.dbPool = dbPool || DatabasePool.getInstance();
  }

  public async runInTransaction<T>(
    work: (tx: ITransactionContext) => Promise<T>,
    isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED'
  ): Promise<T> {
    const client = await this.dbPool.getClient();

    const txContext: ITransactionContext = {
      client,
      query: async <R = any>(text: string, params: unknown[] = []): Promise<R[]> => {
        const result = await client.query(text, params);
        return result.rows as R[];
      },
    };

    try {
      await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      const result = await work(txContext);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[TransactionManager] Erro ao executar rollback:', rollbackError);
      }
      throw error instanceof DatabaseError
        ? error
        : new DatabaseError(`Transação abortada: ${(error as Error).message}`, error);
    } finally {
      client.release();
    }
  }
}
