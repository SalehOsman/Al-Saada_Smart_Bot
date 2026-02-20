import { Bot } from 'grammy'
import { hydrate } from '@grammyjs/hydrate'
import { conversations } from '@grammyjs/conversations'
import { Hono } from 'hono'
import { env } from '../config/env'
import logger from '../utils/logger'
import type { BotContext } from '../types/context'
import { i18n } from './i18n'
import { sessionMiddleware } from './middlewares/session'
import { errorHandler } from './middlewares/error'
import { startHandler } from './handlers/start'
import { menuHandler } from './handlers/menu'
import { joinConversation } from './conversations/join'

// Create grammy bot instance using BOT_TOKEN from environment
export const bot = new Bot<BotContext>(env.BOT_TOKEN)

// --- Middlewares ---

// Error handling middleware
bot.catch(errorHandler)

// Hydration plugin for easier message manipulation
bot.use(hydrate())

// Session middleware with Redis storage
bot.use(sessionMiddleware)

// i18n middleware for bilingual support
bot.use(i18n)

// Conversations plugin for multi-step flows
bot.use(conversations())

// --- Handlers ---

// /start command
bot.command('start', startHandler)

// /menu command
bot.command('menu', menuHandler)

// Register join conversation
bot.conversation('join', joinConversation)

// Create Hono app instance for webhook server
export const app = new Hono()

// Setup webhook route to receive updates from Telegram
app.post('/webhook', async (c) => {
  try {
    // Get the update body from the request
    const update = await c.req.json()

    // Process the update with the bot
    await bot.handleUpdate(update)

    // Return success response
    return c.json({ ok: true })
  }
  catch (error) {
    logger.error('Error processing webhook:', error)
    return c.json({ ok: false, error: 'Webhook processing failed' }, 500)
  }
})
