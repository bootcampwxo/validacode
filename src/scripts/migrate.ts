import { MigrationRunner } from '../infrastructure/database/MigrationRunner';
import { DatabasePool } from '../infrastructure/database/DatabasePool';
import { logger } from '../infrastructure/logging/AppLogger';

async function run() {
  const dbPool = DatabasePool.getInstance();
  const runner = new MigrationRunner();

  try {
    logger.info('[Scripts/Migrate] Executando migrations pendentes...');
    const applied = await runner.runPendingMigrations();
    logger.info(`[Scripts/Migrate] Concluído! ${applied.length} migrations aplicadas.`);
    process.exit(0);
  } catch (error) {
    logger.error('[Scripts/Migrate] Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    await dbPool.close();
  }
}

run();
