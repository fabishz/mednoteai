import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { redis, ensureRedisConnected } from '../config/redis.js';

const router = Router();

const withTimeout = async (promise, timeoutMs, timeoutErrorMessage) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(timeoutErrorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
};

const getServiceStatus = async (checkFn) => {
  try {
    await checkFn();
    return 'connected';
  } catch {
    return 'down';
  }
};

router.get('/', async (req, res) => {
  const timeoutMs = env.healthcheckTimeoutMs;

  const [databaseStatus, redisStatus] = await Promise.all([
    getServiceStatus(() => withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs, 'database_timeout')),
    getServiceStatus(async () => {
      await withTimeout(ensureRedisConnected(), timeoutMs, 'redis_connect_timeout');
      await withTimeout(redis?.ping?.(), timeoutMs, 'redis_ping_timeout');
    }),
  ]);

  const status = (databaseStatus === 'connected' && redisStatus === 'connected') ? 'ok' : 'degraded';
  const body = {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
  };

  res.status(status === 'ok' ? 200 : 503).json(body);
});

export default router;
