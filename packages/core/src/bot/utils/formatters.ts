/**
 * @file formatters.ts
 * @module bot/utils/formatters
 *
 * Shared formatting helpers and admin notification utility.
 *
 * Design principle: NO Arabic/English user-facing text in this file.
 * All display text lives in .ftl locale files.
 * Functions return i18n keys where translation is needed.
 */

import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'

// ---------------------------------------------------------------------------
// Date Formatter
// ---------------------------------------------------------------------------

/**
 * Formats a Date as DD/MM/YYYY.
 * Returns the i18n key 'value_unknown' if date is missing
 * (caller should use ctx.t(formatArabicDate(date))).
 *
 * @example
 * formatArabicDate(new Date('1980-09-01'))  // '01/09/1980'
 * formatArabicDate(undefined)               // 'value_unknown'
 */
export function formatArabicDate(date: Date | undefined | null): string {
  if (!date) return 'value_unknown'
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

// ---------------------------------------------------------------------------
// Gender Formatter
// ---------------------------------------------------------------------------

/**
 * Converts gender enum to its i18n translation key.
 * The actual display text lives in .ftl locale files.
 *
 * Keys: gender_male | gender_female | gender_unknown
 *
 * @example
 * ctx.t(formatGender('MALE'))    // from ar.ftl: gender_male
 * ctx.t(formatGender('FEMALE'))  // from ar.ftl: gender_female
 * ctx.t(formatGender(undefined)) // from ar.ftl: gender_unknown
 */
export function formatGender(gender: 'MALE' | 'FEMALE' | undefined | null): string {
  if (gender === 'MALE') return 'gender_male'
  if (gender === 'FEMALE') return 'gender_female'
  return 'gender_unknown'
}

// ---------------------------------------------------------------------------
// Admin Notifications
// ---------------------------------------------------------------------------

/** Must match Prisma NotificationType enum in schema.prisma */
export type AdminNotificationType = 'JOIN_REQUEST' | 'APPROVAL' | 'REJECTION' | 'SYSTEM' | 'ANNOUNCEMENT'

export interface AdminNotificationPayload {
  type: AdminNotificationType
  titleKey: string
  messageKey: string
  messageParams?: Record<string, string>
}

/**
 * Writes a notification record for every active Super Admin and Admin.
 * @todo T053/T054 - Replace with notificationService.queue() when BullMQ is ready.
 */
export async function notifyAdmins(ctx: BotContext, payload: AdminNotificationPayload): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
    select: { telegramId: true },
  })
  if (admins.length === 0) {
    logger.warn('notifyAdmins: No active admins found - notification skipped')
    return
  }
  await Promise.allSettled(
    admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.telegramId,
          type: payload.type,
          title: ctx.t(payload.titleKey),
          message: ctx.t(payload.messageKey, payload.messageParams ?? {}),
          isRead: false,
        },
      }),
    ),
  )
  logger.info(`notifyAdmins: Sent '${payload.type}' to ${admins.length} admin(s)`)
}
