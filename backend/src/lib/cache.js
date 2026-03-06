import { ensureRedisConnected, redis } from '../config/redis.js';
import { logger } from './logger.js';

export async function getCache(key) {
  if (!redis) return null;

  try {
    await ensureRedisConnected();
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    logger.warn({ err: error, key }, 'cache_get_failed');
    return null;
  }
}

export async function setCache(key, value, ttl = 60) {
  if (!redis) return;

  try {
    await ensureRedisConnected();
    await redis.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn({ err: error, key }, 'cache_set_failed');
  }
}

export async function deleteCache(key) {
  if (!redis) return;

  try {
    await ensureRedisConnected();
    await redis.del(key);
  } catch (error) {
    logger.warn({ err: error, key }, 'cache_delete_failed');
  }
}
