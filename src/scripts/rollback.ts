import { MigrationRunner } from '../infrastructure/database/MigrationRunner';
import { DatabasePool } from '../infrastructure/database/DatabasePool';
import { logger } from '../infrastructure/logging/AppLogger';

async function run() {
  const dbPool = DatabasePool.getInstance();
  const runner = new MigrationRunner();

  try {
    logger.info('[Scripts/Rollback] Revertendo último batch de migrations...');
    const reverted = await runner.rollbackLastBatch();
    logger.info(`[Scripts/Rollback] Concluído! ${reverted.length} migrations revertidas.`);
    process.exit(0);
  } catch (error) {
    logger.error('[Scripts/Rollback] Erro ao reverter migrations:', error);
    process.exit(1);
  } finally {
    await dbPool.close();
  }
}

run();
