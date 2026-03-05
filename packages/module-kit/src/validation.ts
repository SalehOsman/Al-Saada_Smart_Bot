import type { Conversation } from '@grammyjs/conversations'
import type { BotContext, ValidateOptions } from './types.js'

/**
 * Standardized prompt + validation + retry loop.
 */
export async function validate<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ValidateOptions<T>,
): Promise<any> {
  const { promptKey, errorKey, validator, formatter, maxRetries = 3 } = options
  let attempts = 0

  while (attempts < maxRetries) {
    if (attempts === 0) {
      await ctx.reply(ctx.t(promptKey))
    }
    else {
      await ctx.reply(ctx.t(errorKey))
    }

    // Wait for text input
    const { message } = await conversation.waitFor('message:text')
    const text = message.text || ''

    // Detect command interrupts
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].toLowerCase()
      if (['/cancel', '/start', '/menu'].includes(command)) {
        // These commands are handled by draftMiddleware which clears currentModule
        // We exit here to let the conversation end.
        return undefined
      }
    }

    // Run validator
    try {
      const isValid = await validator(text)
      if (isValid) {
        return formatter ? formatter(text) : text
      }
    }
    catch {
      // Validator threw, treat as invalid
    }

    attempts++
  }

  // Max retries exceeded
  await ctx.reply(ctx.t('module-kit-max-retries-exceeded'))
  return undefined
}
