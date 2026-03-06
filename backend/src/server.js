import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { initSentry, registerSentryProcessHandlers } from './lib/sentry.js';
import { RetentionService } from './services/retention.service.js';

initSentry();
registerSentryProcessHandlers();

const server = app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'server_started');
});

if (env.nodeEnv !== 'test') {
  RetentionService.startRetentionSweepJob();
}

const shutdown = async (signal) => {
  logger.info({ signal }, 'shutdown_started');
  server.close(async () => {
    logger.info('http_server_closed');
    if (redis?.isOpen) {
      await redis.quit();
      logger.info('redis_disconnected');
    }
    await prisma.$disconnect();
    logger.info('db_disconnected');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('shutdown_timed_out_force_exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
