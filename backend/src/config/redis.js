import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

const redisClient = env.redisUrl ? createClient({ url: env.redisUrl }) : null;

if (redisClient) {
  redisClient.on('error', (error) => {
    logger.warn({ err: error }, 'redis_client_error');
  });
}

export const redis = redisClient;

export const ensureRedisConnected = async () => {
  if (!redisClient) {
    throw Object.assign(new Error('REDIS_NOT_CONFIGURED'), { code: 'REDIS_NOT_CONFIGURED' });
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
