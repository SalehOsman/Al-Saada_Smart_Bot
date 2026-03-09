/**
 * @file start.ts
 * @module bot/handlers/start
 *
 * Handler for the /start command.
 */

import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import type { BotContext } from '../../types/context'
import { menuHandler } from './menu'

/**
 * Main entry point for the bot.
 * - If user exists: Shows the main menu.
 * - If user has a pending request: Shows a "pending" status message.
 * - If new user: Starts the onboarding (join) conversation.
 *
 * @param ctx - The bot context
 */
export async function startHandler(ctx: BotContext) {
  const telegramId = BigInt(ctx.from?.id || 0)
  if (telegramId === 0n)
    return

  try {
    // 1. Check if user exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (existingUser) {
      // User found - show menu
      return menuHandler(ctx)
    }

    // 2. Check for pending join request
    const pendingRequest = await prisma.joinRequest.findFirst({
      where: {
        telegramId,
        status: 'PENDING',
      },
    })

    if (pendingRequest) {
      // User has pending request - show pending message
      return ctx.reply(ctx.t('join-request-already-pending', {
        date: pendingRequest.createdAt.toLocaleDateString('ar-EG'),
      }))
    }

    // 3. No user and no pending request - start join conversation
    await ctx.conversation.enter('join')
  }
  catch (error) {
    logger.error({ err: error }, `Error in /start handler: ${String(error)}`)
    return ctx.reply(ctx.t('error-generic'))
  }
}
