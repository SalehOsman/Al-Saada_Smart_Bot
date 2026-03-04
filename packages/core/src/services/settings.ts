import { redis } from '../cache/redis'
import logger from '../utils/logger'
import { prisma } from '../database/prisma'
import { env } from '../config/env'

const DEFAULT_LANGUAGE_KEY = 'system:defaultLanguage'
const ACTIVE_NOTIFICATIONS_KEY = 'system:activeNotificationTypes'

/**
 * Service to manage system-wide settings.
 * Implements FR-036.
 */
export const settingsService = {
  /**
   * Get the default language for new users.
   */
  async getDefaultLanguage(): Promise<'ar' | 'en'> {
    const lang = await redis.get(DEFAULT_LANGUAGE_KEY)
    return (lang as 'ar' | 'en') || 'ar'
  },

  /**
   * Set the default language for new users.
   */
  async setDefaultLanguage(lang: 'ar' | 'en'): Promise<void> {
    await redis.set(DEFAULT_LANGUAGE_KEY, lang)
    logger.info(`System default language updated to: ${lang}`)
  },

  /**
   * Get active notification types.
   */
  async getActiveNotificationTypes(): Promise<string[]> {
    const types = await redis.smembers(ACTIVE_NOTIFICATIONS_KEY)
    if (types.length === 0) {
      // Default: all types active
      return [
        'JOIN_REQUEST_NEW',
        'JOIN_REQUEST_APPROVED',
        'JOIN_REQUEST_REJECTED',
        'USER_DEACTIVATED',
        'MAINTENANCE_ON',
        'MAINTENANCE_OFF'
      ]
    }
    return types
  },

  /**
   * Toggle a notification type.
   */
  async toggleNotificationType(type: string): Promise<boolean> {
    const isActive = await redis.sismember(ACTIVE_NOTIFICATIONS_KEY, type)
    if (isActive) {
      await redis.srem(ACTIVE_NOTIFICATIONS_KEY, type)
      return false
    } else {
      await redis.sadd(ACTIVE_NOTIFICATIONS_KEY, type)
      return true
    }
  },

  /**
   * Get system information.
   */
  async getSystemInfo(): Promise<{
    version: string
    uptime: string
    env: string
    dbStatus: 'UP' | 'DOWN'
    redisStatus: 'UP' | 'DOWN'
  }> {
    let dbStatus: 'UP' | 'DOWN' = 'UP'
    let redisStatus: 'UP' | 'DOWN' = 'UP'

    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (e) {
      dbStatus = 'DOWN'
    }

    try {
      await redis.ping()
    } catch (e) {
      redisStatus = 'DOWN'
    }

    const uptimeSeconds = process.uptime()
    const days = Math.floor(uptimeSeconds / (24 * 3600))
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}d ${hours}h ${minutes}m`

    return {
      version: '0.1.0', // Could be read from package.json
      uptime,
      env: env.NODE_ENV || 'development',
      dbStatus,
      redisStatus
    }
  }
}
