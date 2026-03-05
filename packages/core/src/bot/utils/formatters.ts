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

import type { NotificationType } from '@prisma/client'
import { prisma } from '../../database/prisma'
import { queueBulkNotifications } from '../../services/notifications'
import type { NotificationJobData } from '../../types/notification'
import logger from '../../utils/logger'

// ---------------------------------------------------------------------------
// Date Formatter
// ---------------------------------------------------------------------------

/**
 * Formats a Date as DD/MM/YYYY.
 * Returns the i18n key 'value-unknown' if date is missing
 * (caller should use ctx.t(formatArabicDate(date))).
 *
 * @example
 * formatArabicDate(new Date('1980-09-01'))  // '01/09/1980'
 * formatArabicDate(undefined)               // 'value-unknown'
 */
export function formatArabicDate(date: Date | undefined | null): string {
  if (!date)
    return 'value-unknown'
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/**
 * Formats a Date as DD/MM/YYYY HH:MM.
 * Returns the i18n key 'value-unknown' if date is missing.
 *
 * @example
 * formatArabicDateTime(new Date('1980-09-01T14:30:00'))  // '01/09/1980 14:30'
 * formatArabicDateTime(undefined)                        // 'value-unknown'
 */
export function formatArabicDateTime(date: Date | undefined | null): string {
  if (!date)
    return 'value-unknown'
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const hs = String(date.getHours()).padStart(2, '0')
  const ms = String(date.getMinutes()).padStart(2, '0')
  return `${d}/${m}/${y} ${hs}:${ms}`
}

// ---------------------------------------------------------------------------
// Gender Formatter
// ---------------------------------------------------------------------------

/**
 * Converts gender enum to its i18n translation key.
 * The actual display text lives in .ftl locale files.
 *
 * Keys: gender-male | gender-female | gender-unknown
 *
 * @example
 * ctx.t(formatGender('MALE'))    // from ar.ftl: gender-male
 * ctx.t(formatGender('FEMALE'))  // from ar.ftl: gender-female
 * ctx.t(formatGender(undefined)) // from ar.ftl: gender-unknown
 */
export function formatGender(gender: 'MALE' | 'FEMALE' | undefined | null): string {
  if (gender === 'MALE')
    return 'gender-male'
  if (gender === 'FEMALE')
    return 'gender-female'
  return 'gender-unknown'
}

// ---------------------------------------------------------------------------
// Admin Notifications
// ---------------------------------------------------------------------------

export interface AdminNotificationPayload {
  type: NotificationType
  params?: Record<string, string>
}

/**
 * Writes a notification record for every active Super Admin and Admin.
 * Uses notificationService.queueBulkNotifications to add to BullMQ.
 */
export async function notifyAdmins(payload: AdminNotificationPayload): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
    select: { telegramId: true },
  })
  if (admins.length === 0) {
    logger.warn('notifyAdmins: No active admins found - notification skipped')
    return
  }

  const jobs: NotificationJobData[] = admins.map(admin => ({
    targetUserId: admin.telegramId,
    type: payload.type,
    params: payload.params ?? {},
  }))

  await queueBulkNotifications(jobs)

  logger.info(`notifyAdmins: Queued '${payload.type}' for ${admins.length} admin(s)`)
}

// ---------------------------------------------------------------------------
// Text Truncation
// ---------------------------------------------------------------------------

/**
 * Truncates text to a maximum length and appends an ellipsis if truncated.
 * Designed for mobile-friendly button text constraints (max 20 chars).
 *
 * @example
 * truncateText('very long section name here', 20) // 'very long section...'
 */
export function truncateText(text: string | undefined | null, maxLength = 20): string {
  if (!text) {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}
