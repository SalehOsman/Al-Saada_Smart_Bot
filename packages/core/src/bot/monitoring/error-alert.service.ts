import { Role } from '@prisma/client'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import { bot } from '../index'
import { i18n } from '../i18n'

export class ErrorAlertService {
  private throttledErrors = new Map<string, number>()
  private readonly THROTTLE_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Send an error alert to all SUPER_ADMIN users
   */
  async sendAlert(error: Error, location: string = 'unknown') {
    const errorSignature = `${error.name}:${error.message}:${location}`
    const lastSent = this.throttledErrors.get(errorSignature)
    const now = Date.now()

    if (lastSent && now - lastSent < this.THROTTLE_MS) {
      logger.debug({ errorSignature }, 'Alert throttled')
      return
    }

    this.throttledErrors.set(errorSignature, now)

    try {
      // 1. Find all active SUPER_ADMINs
      const admins = await prisma.user.findMany({
        where: {
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
        select: {
          telegramId: true,
          language: true,
        },
      })

      if (admins.length === 0) {
        logger.warn('No SUPER_ADMIN found to send error alert')
        return
      }

      // 2. Send Telegram message to each admin
      for (const admin of admins) {
        const locale = admin.language || 'ar'
        const message = i18n.t(locale, 'error-alert-super-admin', {
          type: error.name,
          message: error.message,
          location,
        })

        try {
          await bot.api.sendMessage(admin.telegramId.toString(), message, {
            parse_mode: 'Markdown',
          })
        } catch (sendErr) {
          logger.error({ err: sendErr, adminId: admin.telegramId.toString() }, 'Failed to send alert to specific admin')
        }
      }

      logger.info({ adminCount: admins.length }, 'Error alert sent to SUPER_ADMINs')
    } catch (err) {
      logger.error({ err }, 'Failed to send error alert')
    }
  }

  /**
   * Clear throttled errors (useful for testing or manual reset)
   */
  clearThrottle() {
    this.throttledErrors.clear()
  }
}

export const errorAlertService = new ErrorAlertService()
