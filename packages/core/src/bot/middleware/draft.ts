import type { Middleware } from 'grammy'
import type { BotContext } from '../../types/context'
import { redis } from '../../cache/redis'
import { moduleLoader } from '../module-loader'
import logger from '../../utils/logger'

/**
 * Draft Middleware (Layer 2)
 *
 * 1. Intercepts all inputs during an active module conversation.
 * 2. Saves conversation state to Redis (auto-save).
 * 3. Handles command interrupts (/cancel, /start, /menu, /help).
 */
export const draftMiddleware: Middleware<BotContext> = async (ctx, next) => {
  // Only process if user is in an active module conversation
  const moduleSlug = ctx.session.currentModule
  if (!moduleSlug) {
    return next()
  }

  const userId = ctx.from?.id
  if (!userId) {
    return next()
  }

  // Detect command interrupts
  const text = ctx.message?.text
  if (text?.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase()

    if (['/cancel', '/start', '/menu'].includes(command)) {
      logger.info(`User ${userId} interrupted module ${moduleSlug} with ${command}. Preserving draft.`)

      // Exit conversation gracefully (handled by @grammyjs/conversations naturally if we don't call next())
      // But we must clear currentModule from session so next message doesn't trigger this again
      ctx.session.currentModule = null

      if (command === '/cancel') {
        await ctx.reply(ctx.t('module-kit-cancelled'))
      }

      // We DON'T call next() for the conversation, but we DO let the command handler take over
      // Actually, we want the command handler (/start, /menu) to run.
      return next()
    }

    if (command === '/help') {
      const step = ctx.session.currentStep || 'default'
      const helpKey = `${moduleSlug}-help-${step}`
      const defaultHelpKey = `module-kit-help-default`

      // Try module-specific step help, then default module help, then system help
      let helpMessage = ctx.t(helpKey)
      if (helpMessage === helpKey) {
        helpMessage = ctx.t(defaultHelpKey)
      }

      await ctx.reply(helpMessage)
      return // Do NOT call next(), stay in conversation
    }
  }

  // Auto-save: Before processing the next step, we can't easily capture the *future* state.
  // @grammyjs/conversations saves state to its own session.
  // We want to mirror/backup this state to Redis for "Resume" functionality (US3).
  // This middleware runs BEFORE the conversation handler.

  await next()

  // After next(): if we are still in a module, update the Redis draft
  if (ctx.session.currentModule === moduleSlug) {
    const loadedModule = moduleLoader.getModule(moduleSlug)
    const ttlHours = loadedModule?.config.draftTtlHours || 24
    const redisKey = `draft:${userId}:${moduleSlug}`

    try {
      // Capture the conversation state from the session
      // @grammyjs/conversations stores state in ctx.session.conversations[name]
      const conversationState = (ctx.session as any).conversations

      if (conversationState) {
        await redis.setex(redisKey, ttlHours * 3600, JSON.stringify({
          data: ctx.session, // Includes currentModule, currentSection, and any module-specific data
          conversations: conversationState,
          updatedAt: Date.now(),
        }))
      }
    }
    catch (err) {
      logger.error(`Failed to auto-save draft for user ${userId}, module ${moduleSlug}:`, err)
    }
  }
}
