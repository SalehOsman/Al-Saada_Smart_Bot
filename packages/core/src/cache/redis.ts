import Redis from 'ioredis'
import { env } from '../config/env'
import logger from '../utils/logger'

// Create Redis singleton instance
let redisInstance: Redis | null = null

// Function to get or create Redis instance
function getRedisInstance(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(env.REDIS_URL)

    // Handle connection events
    redisInstance.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    redisInstance.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })

    redisInstance.on('close', () => {
      logger.info('Redis connection closed')
    })
  }

  return redisInstance
}

/**
 * Redis singleton instance for general application cache.
 */
export const redis = getRedisInstance()

/**
 * Separate Redis connection for BullMQ.
 * Configured with `maxRetriesPerRequest: null` as required by BullMQ.
 */
export const bullmqRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

/**
 * Gracefully disconnects all Redis instances.
 */
export async function disconnect(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
    logger.info('Redis connection closed for graceful shutdown')
  }
}
