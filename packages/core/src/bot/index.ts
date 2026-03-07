import { Bot } from 'grammy'
import { hydrate } from '@grammyjs/hydrate'
import { conversations, createConversation } from '@grammyjs/conversations'
import { Hono } from 'hono'
import { env } from '../config/env'
import logger from '../utils/logger'
import type { BotContext } from '../types/context'
import { redis } from '../cache/redis'
import { healthRouter } from '../server/health'
import { rbacService } from '../services/rbac'
import { i18n } from './i18n'
import { lazySessionMiddleware, sessionMiddleware } from './middlewares/session'
import { auditMiddleware } from './middlewares/audit'
import { sanitizeMiddleware } from './middlewares/sanitize'
import { errorHandler } from './middlewares/error'
import { startHandler } from './handlers/start'
import { menuHandler } from './handlers/menu'
import { userActionsHandler, usersHandler } from './handlers/users'
import { approvalsHandler } from './handlers/approvals'
import { fallbackHandler } from './handlers/fallback'
import { joinConversation } from './conversations/join'

import { editSectionActionHandler, sectionSetParentHandler, sectionsCallbackHandler } from './handlers/sections'

// RBAC and user status check (T111, T029)
import { rbacMiddleware } from './middlewares/rbac'

// Maintenance mode check (FR-023)
import { maintenanceMiddleware } from './middlewares/maintenance'

// Layer 2: Draft auto-save and command interrupt (T010, T011)
import { draftMiddleware } from './middleware/draft'

// /maintenance command (Super Admin only)
import { maintenanceHandler } from './handlers/maintenance'

// /settings command (Super Admin only)
import { settingsActionsHandler, settingsHandler } from './handlers/settings'

// /audit command (Super Admin only)
import { auditActionsHandler, auditHandler } from './handlers/audit'

// --- Layer 2: Module Entry Point (US5) ---

// Create grammy bot instance using BOT_TOKEN from environment
export const bot = new Bot<BotContext>(env.BOT_TOKEN)

// --- Middlewares ---

// Error handling middleware
bot.catch(errorHandler)

// Hydration plugin for easier message manipulation
bot.use(hydrate())

// Session middleware with Redis storage
bot.use(sessionMiddleware)

// Audit logging helper middleware
bot.use(auditMiddleware)

// Lazy session tracking (USER_LOGIN audit)
bot.use(lazySessionMiddleware)
bot.use(rbacMiddleware)
bot.use(maintenanceMiddleware)

// i18n middleware for bilingual support
bot.use(i18n)
bot.use(draftMiddleware)

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

// /sections command (Super Admin only)
bot.command('sections', async (ctx) => {
  const { showMainSectionsMenu } = await import('./menus/sections')
  return showMainSectionsMenu(ctx)
})
bot.command('maintenance', maintenanceHandler)
bot.command('settings', settingsHandler)
bot.command('audit', auditHandler)

// Main menu buttons router (routes callback data to commands)
bot.callbackQuery(/^menu-(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const target = ctx.match[1]

  if (target === 'sections') {
    const { showMainSectionsMenu } = await import('./menus/sections')
    return showMainSectionsMenu(ctx)
  }
  if (target === 'users')
    return usersHandler(ctx)
  if (target === 'maintenance')
    return maintenanceHandler(ctx)
  if (target === 'settings')
    return settingsHandler(ctx)
  if (target === 'audit')
    return auditHandler(ctx)
})

// Handle "back to main menu" from any sub-menu
bot.callbackQuery('menu:main', async (ctx) => {
  await ctx.answerCallbackQuery()
  const { menuHandler } = await import('./handlers/menu')
  return menuHandler(ctx)
})

// Handle "submit join request" button (shown after cancellation)
bot.callbackQuery('start_join', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.conversation.enter('join')
})

// User management callback queries
bot.callbackQuery(/^(user|users):/, userActionsHandler)

// Join request approval/rejection callback queries
bot.callbackQuery(/^(approve|reject):/, approvalsHandler)

// Section management callback queries
bot.callbackQuery(/^section:/, sectionsCallbackHandler)

// Settings callback queries
bot.callbackQuery(/^settings:/, settingsActionsHandler)

// Audit callback queries
bot.callbackQuery(/^audit:/, auditActionsHandler)

// Section edit actions
bot.callbackQuery(/^section:edit:/, editSectionActionHandler)

// Section parent selection
bot.callbackQuery(/^section:set_parent:/, sectionSetParentHandler)

// Section create/update text handler
bot.on('message:text', async (ctx) => {
  const { sectionCreateTextHandler } = await import('./handlers/sections')
  const { settingsBackupRestoreTextHandler } = await import('./handlers/settings')

  // Try backup restore handler first if there's a pending restore
  if (ctx.session.pendingRestore) {
    return settingsBackupRestoreTextHandler(ctx)
  }

  await sectionCreateTextHandler(ctx)
})
bot.callbackQuery(/^mod:(.+)$/, async (ctx) => {
  const moduleSlug = ctx.match[1]
  const userId = BigInt(ctx.from.id)
  const role = ctx.session.role as any || 'VISITOR'

  // 1. Check permissions (create flow by default for now)
  const canCreate = await rbacService.canPerformAction(userId, role, moduleSlug, 'create')
  if (!canCreate) {
    await ctx.answerCallbackQuery({
      text: ctx.t('module-kit-unauthorized-action'),
      show_alert: true,
    })
    return
  }

  await ctx.answerCallbackQuery()

  // 2. Check for existing draft (US3)
  const redisKey = `draft:${userId}:${moduleSlug}`
  const draft = await redis.get(redisKey)

  if (draft) {
    await ctx.reply(ctx.t('module-kit-draft-found'), {
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('module-kit-draft-resume-btn'), callback_data: `dr:res:${moduleSlug}` },
          { text: ctx.t('module-kit-draft-fresh-btn'), callback_data: `dr:frsh:${moduleSlug}` },
        ]],
      },
    })
    return
  }

  // 3. Set session context and enter conversation
  ctx.session.currentModule = moduleSlug
  await ctx.conversation.enter(`${moduleSlug}-add`)
})

// --- Layer 2: Draft Recovery Callbacks (US3) ---
bot.callbackQuery(/^dr:(res|frsh):(.+)$/, async (ctx) => {
  const action = ctx.match[1]
  const moduleSlug = ctx.match[2]
  const userId = BigInt(ctx.from.id)
  const redisKey = `draft:${userId}:${moduleSlug}`

  await ctx.answerCallbackQuery()
  // Clear buttons by editing message with empty keyboard
  await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } })

  if (action === 'frsh') {
    const draftData = await redis.get(redisKey)

    if (!draftData) {
      await ctx.reply(ctx.t('module-kit-draft-expired'))
      ctx.session.currentModule = moduleSlug
      await ctx.conversation.enter(`${moduleSlug}-add`)
      return
    }

    const { data, conversations } = JSON.parse(draftData)

    // Restore session data and conversation state
    Object.assign(ctx.session, data)
    // grammY conversations state is in ctx.session.conversations
    const sessionWithConversations = ctx.session as any
    if (conversations) {
      sessionWithConversations.conversations = conversations
    }

    ctx.session.currentModule = moduleSlug
    await ctx.conversation.enter(`${moduleSlug}-add`)
    return
  }

  if (action === 'res') {
    const draftData = await redis.get(redisKey)

    if (!draftData) {
      await ctx.reply(ctx.t('module-kit-draft-expired'))
      ctx.session.currentModule = moduleSlug
      await ctx.conversation.enter(`${moduleSlug}-add`)
      return
    }

    const { data, conversations } = JSON.parse(draftData)

    // Restore session data and conversation state
    Object.assign(ctx.session, data)
    // grammY conversations state is in ctx.session.conversations
    const sessionWithConversations = ctx.session as any
    if (conversations) {
      sessionWithConversations.conversations = conversations
    }

    ctx.session.currentModule = moduleSlug
    await ctx.conversation.enter(`${moduleSlug}-add`)
  }
})

// Fallback for all other unsupported messages (T112)
bot.on('message', fallbackHandler)

// Create Hono app instance for webhook server
export const app = new Hono()

// Health check endpoint
app.route('/', healthRouter)

// Setup webhook route to receive updates from Telegram
app.post('/webhook', async (c) => {
  try {
    // Get update body from request
    const update = await c.req.json()

    // Process update with bot
    await bot.handleUpdate(update)

    // Return success response
    return c.json({ ok: true })
  }
  catch (error) {
    logger.error('Error processing webhook:', error)
    return c.json({ ok: false, error: 'Webhook processing failed' }, 500)
  }
})
