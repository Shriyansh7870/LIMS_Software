import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redisUrl, {
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis connection failed after 3 retries, continuing without cache');
      return null;
    }
    return Math.min(times * 200, 3000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.warn('Redis error:', err.message));

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = 60): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // Silently fail — cache is optional
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Silently fail
  }
}
