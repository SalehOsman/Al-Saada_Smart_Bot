import process from 'node:process'
import { serve } from '@hono/node-server'
import { app, bot } from './bot/index'
import { env } from './config/env'
import logger from './utils/logger'
import { handleGracefulShutdown } from './utils/shutdown'
import './workers/notification' // Start the notification worker
import { startNotificationCleanup } from './cron/notification-cleanup'
import { startBackupSchedule } from './cron/backup-schedule'

async function main() {
  logger.info('Starting Al-Saada Smart Bot...')

  // Start cron jobs
  startNotificationCleanup()
  startBackupSchedule()

  // Register graceful shutdown handler
  await handleGracefulShutdown(bot)

  if (env.WEBHOOK_URL) {
    await bot.api.setWebhook(env.WEBHOOK_URL)
    logger.info(`Webhook set to: ${env.WEBHOOK_URL}`)
    serve(
      { fetch: app.fetch, port: env.PORT },
      (info) => { logger.info(`Server listening on port ${info.port}`) },
    )
  }
  else {
    logger.info('No WEBHOOK_URL set — starting in long polling mode')

    // Catch polling errors specifically
    bot.catch((err) => {
      logger.error({ err }, '🚨 ERROR IN GRAMMY POLLING / UPDATE PIPELINE')
    })

    await bot.start({
      onStart: (botInfo) => {
        logger.info(`Bot @${botInfo.username} started successfully`)
      },
      drop_pending_updates: true, // Drop old updates that might be stuck
    })
  }
}

main().catch((error) => {
  logger.error('Fatal error during startup:', error)
  process.exit(1)
})
