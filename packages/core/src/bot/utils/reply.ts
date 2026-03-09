/**
 * @file reply.ts
 * @module bot/utils/reply
 *
 * Unified response helpers for the telegram bot.
 */

import type { InlineKeyboardMarkup } from 'grammy/types'
import type { BotContext } from '../../types/context'

/**
 * Helper to seamlessly transition between menus by either editing an existing message
 * (if triggered via callback query) or sending a new one (if triggered via command).
 *
 * This prevent chat clutter by updating the current interface instead of sending
 * repetitive messages during menu navigation.
 *
 * @param ctx - The bot context
 * @param text - The message text (HTML supported)
 * @param replyMarkup - Optional inline keyboard markup
 *
 * @example
 * await replyOrEdit(ctx, ctx.t('menu-main'), mainKeyboard)
 */
export async function replyOrEdit(
  ctx: BotContext,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
) {
  const isCallback = !!ctx.callbackQuery

  if (isCallback) {
    try {
      return await ctx.editMessageText(text, {
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      })
    }
    catch (err: any) {
      // Message is not modified, perfectly fine. Just answer the callback.
      if (err.description?.includes('message is not modified')) {
        return
      }
      throw err
    }
  }

  return await ctx.reply(text, {
    reply_markup: replyMarkup,
    parse_mode: 'HTML',
  })
}
