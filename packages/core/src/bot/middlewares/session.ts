import { type StorageAdapter, session } from 'grammy'
import { redis } from '../../cache/redis'
import type { SessionData } from '../../types/context'
import logger from '../../utils/logger'

// Default session data
function defaultSession(): SessionData {
  return {
    userId: undefined,
    role: 'VISITOR',
    language: 'ar',
    __language_code: 'ar',
    currentSection: null,
    currentModule: null,
    lastActivity: Date.now(),
  }
}

// Redis-backed storage adapter for grammY sessions
const redisStorage: StorageAdapter<SessionData> = {
  async read(key: string): Promise<SessionData | undefined> {
    try {
      const value = await redis.get(`session:${key}`)
      return value ? JSON.parse(value) : undefined
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error reading session')
      return undefined
    }
  },

  async write(key: string, value: SessionData): Promise<void> {
    try {
      await redis.setex(`session:${key}`, 86400, JSON.stringify(value)) // 24h TTL
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error writing session')
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(`session:${key}`)
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error deleting session')
    }
  },
}

// Create session middleware
export const sessionMiddleware = session({
  initial: defaultSession,
  storage: redisStorage,
})
