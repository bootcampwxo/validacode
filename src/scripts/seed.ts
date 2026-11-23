import { SeedRunner } from '../infrastructure/seeds/SeedRunner';
import { DatabasePool } from '../infrastructure/database/DatabasePool';
import { logger } from '../infrastructure/logging/AppLogger';

async function run() {
  const dbPool = DatabasePool.getInstance();
  const runner = new SeedRunner();

  try {
    logger.info('[Scripts/Seed] Executando carga inicial de seeds...');
    await runner.run();
    logger.info('[Scripts/Seed] Processo de seed finalizado com sucesso.');
    process.exit(0);
  } catch (error) {
    logger.error('[Scripts/Seed] Falha ao rodar seeds:', error);
    process.exit(1);
  } finally {
    await dbPool.close();
  }
}

run();
