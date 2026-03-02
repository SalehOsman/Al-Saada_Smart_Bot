import { Conversation } from '@grammyjs/conversations';
import { BotContext, ConfirmOptions } from './types.js';

/**
 * Summary screen with targeted editing support.
 */
export async function confirm<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ConfirmOptions<T>
): Promise<boolean> {
  const { data, labels, editableFields, reAsk } = options;

  while (true) {
    // 1. Build summary message
    let summaryText = `${ctx.t('module-kit-review-title')}\n\n`;
    for (const field in data) {
      const label = labels[field] ? ctx.t(labels[field]) : field;
      summaryText += `*${label}*: ${data[field]}\n`;
    }

    // 2. Build inline keyboard
    const keyboard = [];
    
    // Add edit buttons
    for (const field of editableFields) {
      const label = labels[field] ? ctx.t(labels[field]) : field;
      keyboard.push([{ text: ctx.t('module-kit-edit-field', { field: label }), callback_data: `edit:${String(field)}` }]);
    }

    // Add confirm/cancel buttons
    keyboard.push([
      { text: ctx.t('button-confirm'), callback_data: 'confirm' },
      { text: ctx.t('button-cancel'), callback_data: 'cancel' }
    ]);

    await ctx.reply(summaryText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });

    // 3. Wait for interaction
    const callbackData = [...editableFields.map(f => `edit:${String(f)}`), 'confirm', 'cancel'];
    const response = await conversation.waitForCallbackQuery(callbackData);
    await response.answerCallbackQuery();

    if (response.match === 'confirm') {
      return true;
    }

    if (response.match === 'cancel') {
      return false;
    }

    if (response.match.startsWith('edit:')) {
      const field = response.match.replace('edit:', '') as keyof T;
      await reAsk(field);
      // Loop continues, showing updated summary
    }
  }
}
