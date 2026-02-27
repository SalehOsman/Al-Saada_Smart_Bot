import { Bot } from 'grammy'
import { hydrate } from '@grammyjs/hydrate'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Hono } from 'hono'
import { env } from '../config/env'
import logger from '../utils/logger'
import type { BotContext } from '../types/context'
import { i18n } from './i18n'
import { sessionMiddleware, lazySessionMiddleware } from './middlewares/session'
import { sanitizeMiddleware } from './middlewares/sanitize'
import { errorHandler } from './middlewares/error'
import { startHandler } from './handlers/start'
import { menuHandler } from './handlers/menu'
import { usersHandler, userActionsHandler } from './handlers/users'
import { approvalsHandler } from './handlers/approvals'
import { fallbackHandler } from './handlers/fallback'
import { joinConversation } from './conversations/join'
import { healthRouter } from '../server/health'

// Create grammy bot instance using BOT_TOKEN from environment
export const bot = new Bot<BotContext>(env.BOT_TOKEN)

// --- Middlewares ---

// Error handling middleware
bot.catch(errorHandler)

// Hydration plugin for easier message manipulation
bot.use(hydrate())

// Session middleware with Redis storage
bot.use(sessionMiddleware)

// Lazy session tracking (USER_LOGIN audit)
bot.use(lazySessionMiddleware)

// RBAC and user status check (T111, T029)
import { rbacMiddleware } from './middlewares/rbac'
bot.use(rbacMiddleware)

// i18n middleware for bilingual support
bot.use(i18n)

// Conversations plugin for multi-step flows
bot.use(conversations())

// Sanitize all incoming text messages (FR-033)
bot.use(sanitizeMiddleware)

// Register join conversation (must be registered before any handlers)
bot.use(createConversation(joinConversation, 'join'))

// --- Handlers ---

// /start command
bot.command('start', startHandler)

// /menu command
bot.command('menu', menuHandler)

// /users command (Super Admin only)
bot.command('users', usersHandler)

// Handle "submit join request" button (shown after cancellation)
bot.callbackQuery('start_join', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.conversation.enter('join')
})

// User management callback queries
bot.callbackQuery(/^user:/, userActionsHandler)

// Join request approval/rejection callback queries
bot.callbackQuery(/^(approve|reject):/, approvalsHandler)

// Fallback for all other unsupported messages (T112)
bot.on('message', fallbackHandler)

// Create Hono app instance for webhook server
export const app = new Hono()

// Health check endpoint
app.route('/', healthRouter)

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
