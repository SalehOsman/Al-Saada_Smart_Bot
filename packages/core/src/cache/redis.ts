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

// Export the Redis singleton instance
export const redis = getRedisInstance()

// Function for graceful shutdown
export async function disconnect(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
    logger.info('Redis connection closed for graceful shutdown')
  }
}