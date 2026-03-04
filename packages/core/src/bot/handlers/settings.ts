import { InlineKeyboard } from 'grammy'
import type { BotContext } from '../../types/context'
import { settingsService } from '../../services/settings'
import { backupService } from '../../services/backup'
import { maintenanceService } from '../../services/maintenance'
import logger from '../../utils/logger'

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

  return ctx.reply(ctx.t('settings-menu-welcome'), { reply_markup: keyboard })
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
    const allTypes = [
      'JOIN_REQUEST_NEW',
      'JOIN_REQUEST_APPROVED',
      'JOIN_REQUEST_REJECTED',
      'USER_DEACTIVATED',
      'MAINTENANCE_ON',
      'MAINTENANCE_OFF',
    ]

    const typeToI18nKey: Record<string, string> = {
      JOIN_REQUEST_NEW: 'notif-type-join-request-new',
      JOIN_REQUEST_APPROVED: 'notif-type-join-request-approved',
      JOIN_REQUEST_REJECTED: 'notif-type-join-request-rejected',
      USER_DEACTIVATED: 'notif-type-user-deactivated',
      MAINTENANCE_ON: 'notif-type-maintenance-on',
      MAINTENANCE_OFF: 'notif-type-maintenance-off',
    }

    const keyboard = new InlineKeyboard()
    for (const type of allTypes) {
      const isMuted = !activeTypes.includes(type)
      const icon = isMuted ? '🔇' : '🔔'
      const label = ctx.t(typeToI18nKey[type])
      keyboard.text(`${icon} ${label}`, `settings:notif:toggle:${type}`).row()
    }
    keyboard.text(ctx.t('button-back-to-sections'), 'settings:main')

    await ctx.editMessageText(ctx.t('settings-notifications-title'), { reply_markup: keyboard })
    return
  }

  if (data.startsWith('settings:notif:toggle:')) {
    const type = data.split(':')[3]
    await settingsService.toggleNotificationType(type)
    await ctx.answerCallbackQuery({ text: ctx.t('settings-notifications-updated') })
    // Refresh the notifications menu
    return settingsActionsHandler(Object.assign(ctx, { callbackQuery: { data: 'settings:notifications' } }))
  }

  if (data === 'settings:main') {
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } })
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
      // In a real environment, you might want to restart the process here or clear sessions
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
