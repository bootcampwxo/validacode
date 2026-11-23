import { AppServer } from './interfaces/http/Server';
import { logger } from './infrastructure/logging/AppLogger';
import { DatabasePool } from './infrastructure/database/DatabasePool';

async function bootstrap() {
  try {
    logger.info('[Bootstrap] Inicializando o Sistema de Reembolso de Despesas...');

    // Verifica conectividade com PostgreSQL
    const dbPool = DatabasePool.getInstance();
    const health = await dbPool.healthCheck();

    if (!health.isHealthy) {
      logger.warn(
        `[Bootstrap] Banco de dados PostgreSQL não respondeu no healthcheck (${health.latencyMs}ms). Verifique se o serviço está ativo.`
      );
    } else {
      logger.info(
        `[Bootstrap] Conexão com PostgreSQL estabelecida com sucesso (${health.latencyMs}ms).`
      );
    }

    const server = new AppServer();
    await server.start();

    // Tratamento de Encerramento Gracioso (Graceful Shutdown)
    const shutdown = async (signal: string) => {
      logger.info(`[Bootstrap] Sinal de encerramento ${signal} recebido. Finalizando serviços...`);
      try {
        await server.stop();
        logger.info('[Bootstrap] Servidor e conexões encerrados com sucesso.');
        process.exit(0);
      } catch (err) {
        logger.error('[Bootstrap] Erro durante o encerramento gracioso:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('[Bootstrap] Falha crítica durante a inicialização da aplicação:', error);
    process.exit(1);
  }
}

bootstrap();
