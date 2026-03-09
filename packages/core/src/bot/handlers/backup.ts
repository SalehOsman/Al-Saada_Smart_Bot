import { InlineKeyboard } from 'grammy'
import type { BotContext } from '../../types/context'
import { backupService } from '../services/backup.service'
import logger from '../../utils/logger'

/**
 * Handle /backup command (Super Admin only).
 */
export async function backupHandler(ctx: BotContext) {
  if (ctx.session.role !== 'SUPER_ADMIN') {
    return ctx.reply(ctx.t('errors-unauthorized'))
  }

  try {
    const sent = await ctx.reply(ctx.t('settings-backup-creating'))
    const backup = await backupService.createBackup('manual', ctx.from!.id.toString())

    await ctx.api.editMessageText(
      ctx.chat!.id,
      sent.message_id,
      ctx.t('settings-backup-created', {
        filename: backup.fileName,
        size: `${(Number(backup.fileSize) / (1024 * 1024)).toFixed(2)} MB`,
      }),
    )
  }
  catch (error) {
    logger.error({ err: error }, 'Manual backup failed')
    await ctx.reply(ctx.t('settings-backup-fail'))
  }
}

/**
 * Handle /backups command (Super Admin only).
 */
export async function backupsHandler(ctx: BotContext) {
  if (ctx.session.role !== 'SUPER_ADMIN') {
    return ctx.reply(ctx.t('errors-unauthorized'))
  }

  const backups = await backupService.listBackups()
  if (backups.length === 0) {
    return ctx.reply(ctx.t('settings-backup-history-empty'))
  }

  const keyboard = new InlineKeyboard()
  for (const backup of backups.slice(0, 10)) {
    const size = `${(Number(backup.fileSize) / (1024 * 1024)).toFixed(2)} MB`
    keyboard.text(`📥 ${backup.fileName} (${size})`, `backup:restore_init:${backup.id}`).row()
  }

  return ctx.reply(ctx.t('settings-backup-history'), { reply_markup: keyboard })
}

/**
 * Handle backup restoration callback.
 */
export async function backupActionsHandler(ctx: BotContext) {
  const data = ctx.callbackQuery?.data
  if (!data || ctx.session.role !== 'SUPER_ADMIN')
    return

  if (data.startsWith('backup:restore_init:')) {
    const backupId = data.replace('backup:restore_init:', '')
    const backup = await backupService.getBackup(backupId)

    if (!backup) {
      return ctx.answerCallbackQuery({ text: 'Backup not found', show_alert: true })
    }

    ctx.session.pendingRestore = backupId
    const keyword = ctx.t('settings-backup-restore-confirm-keyword')

    await ctx.reply(ctx.t('settings-backup-restore-confirm', { keyword }), {
      reply_markup: { force_reply: true },
    })
    await ctx.answerCallbackQuery()
  }
}

/**
 * Handle restore confirmation text (two-step approval).
 */
export async function backupRestoreTextHandler(ctx: BotContext) {
  if (!ctx.session.pendingRestore || !ctx.message?.text)
    return

  const backupId = ctx.session.pendingRestore
  const input = ctx.message.text.trim()
  const keyword = ctx.t('settings-backup-restore-confirm-keyword')
  const userId = ctx.from!.id.toString()

  if (input === keyword) {
    try {
      await ctx.reply(ctx.t('settings-backup-restoring'))
      await backupService.restoreBackup(backupId, userId)
      await ctx.reply(ctx.t('settings-backup-restore-success'))
    }
    catch (error) {
      logger.error({ err: error, backupId }, 'Restore failed')
      await ctx.reply(ctx.t('settings-backup-restore-fail'))
    }
  }
  else {
    await ctx.reply(ctx.t('settings-backup-restore-fail'))
  }

  ctx.session.pendingRestore = undefined
}
