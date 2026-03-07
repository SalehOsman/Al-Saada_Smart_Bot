import type { InlineKeyboardMarkup } from 'grammy/types'
import type { BotContext } from '../../types/context'

/**
 * Helper to seamlessly transition between menus.
 *
 * If the user clicked an inline button (callbackQuery exists),
 * it edits the current message to prevent chat clutter.
 * If the user typed a command (like /menu), it sends a new message.
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
