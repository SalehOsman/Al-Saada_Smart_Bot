import { InlineKeyboard } from 'grammy'
import type { BotContext } from '../../types/context'
import { settingsService } from '../../services/settings'
import { backupService } from '../../services/backup'
import { maintenanceService } from '../../services/maintenance'
import logger from '../../utils/logger'
import { replyOrEdit } from '../utils/reply'
import { redis } from '../../cache/redis'

// Redis key for active notification types
const ACTIVE_NOTIFICATIONS_KEY = 'system:activeNotificationTypes'

// All available notification types
const NOTIFICATION_TYPES = [
  'JOIN_REQUEST_NEW',
  'JOIN_REQUEST_APPROVED',
  'JOIN_REQUEST_REJECTED',
  'USER_DEACTIVATED',
  'MAINTENANCE_ON',
  'MAINTENANCE_OFF',
] as const

// Map notification types to i18n keys
const NOTIFICATION_TYPE_I18N: Record<string, string> = {
  JOIN_REQUEST_NEW: 'notif-type-join-request-new',
  JOIN_REQUEST_APPROVED: 'notif-type-join-request-approved',
  JOIN_REQUEST_REJECTED: 'notif-type-join-request-rejected',
  USER_DEACTIVATED: 'notif-type-user-deactivated',
  MAINTENANCE_ON: 'notif-type-maintenance-on',
  MAINTENANCE_OFF: 'notif-type-maintenance-off',
}

/**
 * Main Settings Menu (Super Admin only).
 */
export async function settingsHandler(ctx: BotContext) {
  if (ctx.session.role !== 'SUPER_ADMIN') {
    return ctx.reply(ctx.t('errors-unauthorized'))
  }

  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-settings-maintenance'), 'settings:maintenance').row()
    .text(ctx.t('button-settings-language'), 'settings:language').row()
    .text(ctx.t('button-settings-notifications'), 'settings:notifications').row()
    .text(ctx.t('button-settings-system-info'), 'settings:info').row()
    .text(ctx.t('button-settings-backup'), 'settings:backup').row()
    .text(ctx.t('button-back-to-menu'), 'menu:main')

  return replyOrEdit(ctx, ctx.t('settings-menu-welcome'), keyboard)
}

/**
 * Handle Settings-related callback queries.
 */
export async function settingsActionsHandler(ctx: BotContext) {
  const data = ctx.callbackQuery?.data
  if (!data)
    return

  const userId = BigInt(ctx.from!.id)

  if (data === 'settings:maintenance') {
    const isEnabled = await maintenanceService.toggleMaintenance(userId)
    const statusKey = isEnabled ? 'maintenance-status-on' : 'maintenance-status-off'
    await ctx.answerCallbackQuery({ text: ctx.t(statusKey), show_alert: true })
    return
  }

  if (data === 'settings:language') {
    const currentLang = await settingsService.getDefaultLanguage()
    const keyboard = new InlineKeyboard()
      .text('العربية 🇪🇬', 'settings:lang:ar')
      .text('English 🇺🇸', 'settings:lang:en').row()
      .text(ctx.t('button-back-to-sections'), 'settings:main')

    await ctx.editMessageText(
      `${ctx.t('settings-language-title')}\n${ctx.t('settings-language-current', { lang: currentLang })}`,
      { reply_markup: keyboard },
    )
    return
  }

  if (data.startsWith('settings:lang:')) {
    const lang = data.split(':')[2] as 'ar' | 'en'
    await settingsService.setDefaultLanguage(lang)
    await ctx.answerCallbackQuery({ text: ctx.t('settings-language-updated', { lang }), show_alert: true })
    return settingsHandler(ctx)
  }

  if (data === 'settings:info') {
    const info = await settingsService.getSystemInfo()
    const content = ctx.t('settings-system-info-content', {
      version: info.version,
      uptime: info.uptime,
      env: info.env,
      dbStatus: info.dbStatus,
      redisStatus: info.redisStatus,
    })

    const keyboard = new InlineKeyboard().text(ctx.t('button-back-to-sections'), 'settings:main')
    await ctx.editMessageText(`${ctx.t('settings-system-info-title')}\n\n${content}`, { reply_markup: keyboard })
    return
  }

  if (data === 'settings:backup') {
    const keyboard = new InlineKeyboard()
      .text(ctx.t('settings-backup-trigger'), 'settings:backup:create').row()
      .text(ctx.t('settings-backup-history'), 'settings:backup:history').row()
      .text(ctx.t('button-back-to-sections'), 'settings:main')

    await ctx.editMessageText(ctx.t('settings-backup-title'), { reply_markup: keyboard })
    return
  }

  if (data === 'settings:backup:create') {
    await ctx.answerCallbackQuery({ text: ctx.t('settings-backup-creating') })
    const { filename, size } = await backupService.createBackup(userId)
    await ctx.reply(ctx.t('settings-backup-created', { filename, size }))
    return settingsHandler(ctx)
  }

  if (data === 'settings:backup:history') {
    const history = await backupService.getBackupHistory()
    if (history.length === 0) {
      await ctx.answerCallbackQuery({ text: ctx.t('settings-backup-history-empty') })
      return
    }

    const keyboard = new InlineKeyboard()
    for (const backup of history) {
      keyboard.text(`📥 ${backup.filename} (${backup.size})`, `settings:backup:restore:${backup.filename}`).row()
    }
    keyboard.text(ctx.t('button-back-to-sections'), 'settings:backup')

    await ctx.editMessageText(ctx.t('settings-backup-history'), { reply_markup: keyboard })
    return
  }

  if (data.startsWith('settings:backup:restore:')) {
    const filename = data.replace('settings:backup:restore:', '')
    ctx.session.pendingRestore = filename

    const keyword = ctx.t('settings-backup-restore-confirm-keyword')
    await ctx.reply(ctx.t('settings-backup-restore-confirm', { keyword }), {
      reply_markup: { force_reply: true },
    })
    await ctx.answerCallbackQuery()
    return
  }

  if (data === 'settings:notifications') {
    const activeTypes = await settingsService.getActiveNotificationTypes()

    // Create notification menu with individual toggle buttons
    const { menuContent, keyboard } = await generateNotificationsMenu(ctx, activeTypes)

    await ctx.editMessageText(menuContent, { reply_markup: keyboard, parse_mode: 'HTML' })
    return
  }

  if (data.startsWith('settings:notif:')) {
    await handleNotificationAction(ctx, data)
    return
  }

  if (data === 'settings:main') {
    return settingsHandler(ctx)
  }
}

/**
 * Handle backup restore confirmation from text input.
 */
export async function settingsBackupRestoreTextHandler(ctx: BotContext) {
  if (!ctx.session.pendingRestore || !ctx.message?.text)
    return

  const filename = ctx.session.pendingRestore
  const input = ctx.message.text.trim()
  const keyword = ctx.t('settings-backup-restore-confirm-keyword')
  const userId = BigInt(ctx.from!.id)

  if (input === keyword) {
    try {
      await ctx.reply(ctx.t('settings-backup-restoring'))
      await backupService.restoreFromBackup(filename, userId)
      await ctx.reply(ctx.t('settings-backup-restore-success'))
      // In a real environment, you might want to restart process here or clear sessions
      ctx.session.pendingRestore = undefined
    }
    catch (error) {
      logger.error('Restore failed:', error)
      await ctx.reply(ctx.t('settings-backup-restore-fail'))
      ctx.session.pendingRestore = undefined
    }
  }
  else {
    await ctx.reply(ctx.t('settings-backup-restore-fail'))
    ctx.session.pendingRestore = undefined
  }
}

/**
 * Handle notification-related callback actions
 */
async function handleNotificationAction(ctx: BotContext, data: string) {
  const parts = data.split(':')
  const action = parts[2] // 'toggle', 'enable', 'disable', 'reset'
  const type = parts[3] // 'all', 'join-request-new', etc.

  // Handle quick control actions
  if (action === 'enable' && type === 'all') {
    // Enable all notifications
    for (const t of NOTIFICATION_TYPES) {
      await redis.sadd(ACTIVE_NOTIFICATIONS_KEY, t)
    }
    await ctx.answerCallbackQuery({ text: ctx.t('notif-toggle-all'), show_alert: true })
  }
  else if (action === 'disable' && type === 'all') {
    // Disable all notifications
    for (const t of NOTIFICATION_TYPES) {
      await redis.srem(ACTIVE_NOTIFICATIONS_KEY, t)
    }
    await ctx.answerCallbackQuery({ text: ctx.t('notif-disable-all'), show_alert: true })
  }
  else if (action === 'reset' && type === 'defaults') {
    // Reset to defaults (all enabled)
    await redis.del(ACTIVE_NOTIFICATIONS_KEY)
    // Add default types (all except maintenance notifications by default)
    const defaultTypes = ['JOIN_REQUEST_NEW', 'JOIN_REQUEST_APPROVED', 'JOIN_REQUEST_REJECTED', 'USER_DEACTIVATED']
    for (const t of defaultTypes) {
      await redis.sadd(ACTIVE_NOTIFICATIONS_KEY, t)
    }
    await ctx.answerCallbackQuery({ text: ctx.t('notif-reset-defaults'), show_alert: true })
  }
  else if (action === 'toggle') {
    // Handle individual notification toggle
    await handleIndividualNotificationToggle(ctx, type)
  }

  // Refresh the notifications menu
  const activeTypes = await settingsService.getActiveNotificationTypes()
  const { menuContent, keyboard } = await generateNotificationsMenu(ctx, activeTypes)
  await ctx.editMessageText(menuContent, { reply_markup: keyboard, parse_mode: 'HTML' })
}

/**
 * Handle individual notification toggle
 */
async function handleIndividualNotificationToggle(ctx: BotContext, type: string) {
  // Convert kebab-case back to UPPER_SNAKE_CASE
  const notificationType = type.toUpperCase().replace(/-/g, '_')

  const wasActive = await redis.sismember(ACTIVE_NOTIFICATIONS_KEY, notificationType)
  const i18nKey = NOTIFICATION_TYPE_I18N[notificationType]

  // Toggle notification
  await settingsService.toggleNotificationType(notificationType)

  // Get label for feedback
  const label = i18nKey ? ctx.t(i18nKey) : notificationType

  // Send immediate feedback
  const feedbackMessage = wasActive
    ? ctx.t('notif-status-toggle-disabled', { type: label })
    : ctx.t('notif-status-toggle-enabled', { type: label })

  await ctx.answerCallbackQuery({
    text: feedbackMessage,
    show_alert: false,
    cache_time: 3,
  })
}

/**
 * Generate enhanced notifications menu with individual toggle buttons
 */
async function generateNotificationsMenu(
  ctx: BotContext,
  activeTypes: string[],
): Promise<{ menuContent: string, keyboard: InlineKeyboard }> {
  const activeCount = activeTypes.length
  const totalCount = NOTIFICATION_TYPES.length
  const percentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0

  let menuContent = `<b>${ctx.t('settings-notifications-title')}</b>\n\n`
  menuContent += `<b>${ctx.t('notif-summary-title')}</b>\n`
  menuContent += `${ctx.t('notif-summary-total')}: ${totalCount} | ${ctx.t('notif-summary-active')}: ${activeCount} | ${ctx.t('notif-summary-inactive')}: ${totalCount - activeCount} | ${ctx.t('notif-summary-percentage')}: ${percentage}%\n\n`
  menuContent += `<b>━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n`

  const keyboard = new InlineKeyboard()

  // Create toggle button for each notification type
  for (const type of NOTIFICATION_TYPES) {
    const isActive = activeTypes.includes(type)
    const statusIcon = isActive ? '🟢' : '🔴'
    const statusText = isActive ? ctx.t('notif-status-active') : ctx.t('notif-status-inactive')
    const label = ctx.t(NOTIFICATION_TYPE_I18N[type])
    const kebabCaseType = type.toLowerCase().replace(/_/g, '-')

    // Add to message content
    menuContent += `${statusIcon} ${label} (${statusText})\n`

    // Add toggle button
    const buttonText = isActive ? '🔇' : '🔔'
    keyboard.text(`${buttonText} ${label}`, `settings:notif:toggle:${kebabCaseType}`).row()
  }

  menuContent += `\n<b>━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n`
  menuContent += `${ctx.t('notif-quick-controls')}`

  // Add quick control buttons
  keyboard.text(ctx.t('notif-toggle-all'), 'settings:notif:enable:all').row()
  keyboard.text(ctx.t('notif-disable-all'), 'settings:notif:disable:all').row()
  keyboard.text(ctx.t('notif-reset-defaults'), 'settings:notif:reset:defaults').row()
  keyboard.text(ctx.t('button-back-to-sections'), 'settings:main')

  return { menuContent, keyboard }
}
