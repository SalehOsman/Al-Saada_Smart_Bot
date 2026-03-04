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
import { redis } from '../cache/redis'
import {
  showMainSectionsMenu,
  showSectionModules,
  showSubSectionsMenu,
  updateNavigationBreadcrumb,
  handleBackNavigation,
} from './menus/sections'
import { sectionsCallbackHandler, sectionCreateTextHandler, editSectionActionHandler, sectionSetParentHandler } from './handlers/sections'

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

// Maintenance mode check (FR-023)
import { maintenanceMiddleware } from './middlewares/maintenance'
bot.use(maintenanceMiddleware)

// i18n middleware for bilingual support
bot.use(i18n)

// Layer 2: Draft auto-save and command interrupt (T010, T011)
import { draftMiddleware } from './middleware/draft'
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

// /maintenance command (Super Admin only)
import { maintenanceHandler } from './handlers/maintenance'
bot.command('maintenance', maintenanceHandler)

// /settings command (Super Admin only)
import { settingsHandler, settingsActionsHandler } from './handlers/settings'
bot.command('settings', settingsHandler)

// Handle "submit join request" button (shown after cancellation)
bot.callbackQuery('start_join', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.conversation.enter('join')
})

// User management callback queries
bot.callbackQuery(/^user:/, userActionsHandler)

// Join request approval/rejection callback queries
bot.callbackQuery(/^(approve|reject):/, approvalsHandler)

// Section management callback queries
bot.callbackQuery(/^section:/, sectionsCallbackHandler)

// Settings callback queries
bot.callbackQuery(/^settings:/, settingsActionsHandler)

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

// --- Layer 2: Module Entry Point (US5) ---
import { rbacService } from '../services/rbac'
bot.callbackQuery(/^mod:(.+)$/, async (ctx) => {
  const moduleSlug = ctx.match[1]
  const userId = BigInt(ctx.from.id)
  const role = ctx.session.role as any || 'VISITOR'

  // 1. Check permissions (create flow by default for now)
  const canCreate = await rbacService.canPerformAction(userId, role, moduleSlug, 'create')
  if (!canCreate) {
    await ctx.answerCallbackQuery({
      text: ctx.t('module-kit-unauthorized-action'),
      show_alert: true
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
          { text: ctx.t('module-kit-draft-fresh-btn'), callback_data: `dr:frsh:${moduleSlug}` }
        ]]
      }
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
    return
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
  } catch (error) {
    logger.error('Error processing webhook:', error)
    return c.json({ ok: false, error: 'Webhook processing failed' }, 500)
  }
})
