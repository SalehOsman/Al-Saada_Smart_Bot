import { session, SessionStore } from 'grammy'
import { redis } from '../../cache/redis'
import logger from '../../utils/logger'

// Create Redis-backed session store
const redisStore: SessionStore = {
  async get(key) {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : undefined
    } catch (error) {
      logger.error(`Error getting session key ${key}:`, error)
      return undefined
    }
  },
  
  async set(key, value, expiresInSeconds = 86400) { // Default 24 hours
    try {
      await redis.setex(key, expiresInSeconds, JSON.stringify(value))
    } catch (error) {
      logger.error(`Error setting session key ${key}:`, error)
    }
  },
  
  async delete(key) {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error(`Error deleting session key ${key}:`, error)
    }
  },
}

// Create session middleware with Redis store
export const sessionMiddleware = session({
  store: redisStore,
  initial: (ctx) => ({
    userId: ctx.from?.id,
    role: 'VISITOR', // Default role, will be updated after lookup
    language: 'ar', // Default language, can be updated by user
  }),
})