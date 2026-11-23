import fs from 'fs';
import path from 'path';
import { DatabasePool } from './DatabasePool';

export class MigrationRunner {
  private readonly dbPool: DatabasePool;
  private readonly migrationsDir: string;

  constructor(migrationsDir?: string, dbPool?: DatabasePool) {
    this.dbPool = dbPool || DatabasePool.getInstance();
    this.migrationsDir =
      migrationsDir || path.resolve(__dirname, '../migrations');
  }

  public async initMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.dbPool.query(sql);
  }

  public async getExecutedMigrations(): Promise<string[]> {
    await this.initMigrationTable();
    const result = await this.dbPool.query<{ migration_name: string }>(
      'SELECT migration_name FROM schema_migrations ORDER BY id ASC'
    );
    return result.rows.map((r) => r.migration_name);
  }

  public async runPendingMigrations(): Promise<string[]> {
    await this.initMigrationTable();
    const executed = await this.getExecutedMigrations();

    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`[MigrationRunner] Diretório de migrations '${this.migrationsDir}' não encontrado.`);
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !executed.includes(f));

    if (pending.length === 0) {
      console.log('[MigrationRunner] Todas as migrations já foram executadas.');
      return [];
    }

    const batchRes = await this.dbPool.query<{ max_batch: number }>(
      'SELECT COALESCE(MAX(batch), 0) + 1 AS max_batch FROM schema_migrations'
    );
    const currentBatch = batchRes.rows[0].max_batch;

    const applied: string[] = [];

    for (const file of pending) {
      const filePath = path.join(this.migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      console.log(`[MigrationRunner] Executando migration: ${file}...`);
      const client = await this.dbPool.getClient();
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (migration_name, batch) VALUES ($1, $2)',
          [file, currentBatch]
        );
        await client.query('COMMIT');
        applied.push(file);
        console.log(`[MigrationRunner] Migration ${file} concluída com sucesso.`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[MigrationRunner] Erro ao executar migration ${file}:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    return applied;
  }

  public async rollbackLastBatch(): Promise<string[]> {
    await this.initMigrationTable();
    const batchRes = await this.dbPool.query<{ max_batch: number }>(
      'SELECT MAX(batch) AS max_batch FROM schema_migrations'
    );
    const lastBatch = batchRes.rows[0]?.max_batch;

    if (!lastBatch) {
      console.log('[MigrationRunner] Nenhuma migration para reverter.');
      return [];
    }

    const migrationsToRevert = await this.dbPool.query<{ migration_name: string }>(
      'SELECT migration_name FROM schema_migrations WHERE batch = $1 ORDER BY id DESC',
      [lastBatch]
    );

    console.log(`[MigrationRunner] Revertendo batch ${lastBatch}:`, migrationsToRevert.rows);
    await this.dbPool.query('DELETE FROM schema_migrations WHERE batch = $1', [lastBatch]);
    return migrationsToRevert.rows.map((r) => r.migration_name);
  }
}
