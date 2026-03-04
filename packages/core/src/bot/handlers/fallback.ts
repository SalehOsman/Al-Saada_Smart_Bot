import type { BotContext } from '../../types/context'

/**
 * Fallback handler for unsupported message types or unrecognized commands.
 * Provides guidance to the user via i18n key errors-unsupported-message (FR-033).
 */
export async function fallbackHandler(ctx: BotContext) {
  // Only reply if this is not a text message that might have been handled by other handlers
  // though grammY's command handlers and other 'bot.on' should have caught it first.
  await ctx.reply(ctx.t('errors-unsupported-message'))
}
