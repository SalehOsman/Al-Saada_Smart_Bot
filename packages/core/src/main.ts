import process from 'node:process'
import { serve } from '@hono/node-server'
import { bot, app } from './bot/index'
import { env } from './config/env'
import logger from './utils/logger'

async function main() {
  logger.info('Starting Al-Saada Smart Bot...')

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
    await bot.start()
  }
}

main().catch((error) => {
  logger.error('Fatal error during startup:', error)
  process.exit(1)
})