/**
 * @file conversation.ts
 * @module bot/utils/conversation
 *
 * Shared conversation utilities used across ALL bot flows.
 *
 * These helpers provide a consistent interface for message tracking, deletion,
 * and user input collection using grammY conversations.
 */

import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { BotContext } from '../../types/context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tracks message IDs sent during a flow for later deletion */
export interface MessageTracker {
  ids: number[]
}

export interface WaitForTextOptions {
  tracker?: MessageTracker
}

export interface WaitForSkippableOptions {
  tracker?: MessageTracker
  skipData?: string
}

export interface WaitForConfirmOptions {
  tracker?: MessageTracker
  confirmData?: string
  cancelData?: string
}

export interface SendCancelledOptions {
  retryLabel?: string
  retryData?: string
}

// ---------------------------------------------------------------------------
// Message Tracking
// ---------------------------------------------------------------------------

/**
 * Creates a fresh message tracker.
 * Pass to wait helpers, then call deleteTrackedMessages at end of flow.
 */
export function createMessageTracker(): MessageTracker {
  return { ids: [] }
}

/**
 * Records a message ID into the tracker.
 */
export function trackMessage(tracker: MessageTracker, messageId: number): void {
  tracker.ids.push(messageId)
}

/**
 * Deletes all messages tracked by the given tracker.
 * Call this before sending the final result to clean up the flow.
 * Silently ignores failures (message already deleted / too old).
 *
 * @example
 * await deleteTrackedMessages(ctx, tracker)
 * await ctx.reply(ctx.t('welcome-super-admin-new'))
 */
export async function deleteTrackedMessages(
  ctx: BotContext,
  tracker: MessageTracker,
): Promise<void> {
  const chatId = ctx.chat?.id
  if (!chatId || tracker.ids.length === 0)
    return
  await Promise.allSettled(
    tracker.ids.map(id => ctx.api.deleteMessage(chatId, id).catch(() => { })),
  )
  tracker.ids = []
}

// ---------------------------------------------------------------------------
// Input Helpers
// ---------------------------------------------------------------------------

/**
 * Sends a prompt with a cancel button and waits for text reply.
 * Returns null if user cancelled, string otherwise.
 *
 * @example
 * const name = await waitForTextOrCancel(conversation, ctx, 'Enter name', { tracker })
 * if (name === null) return // cancelled
 */
export async function waitForTextOrCancel(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  prompt: string,
  options: WaitForTextOptions = {},
): Promise<string | null> {
  const sent = await ctx.reply(prompt, {
    reply_markup: {
      inline_keyboard: [
        [{ text: ctx.t('button-cancel-flow'), callback_data: 'cancel_flow' }],
      ],
    },
  })
  if (options.tracker)
    trackMessage(options.tracker, sent.message_id)

  const response = await conversation.wait()

  if (response.callbackQuery?.data === 'cancel_flow') {
    await response.answerCallbackQuery()
    return null
  }
  if (options.tracker && response.message?.message_id) {
    trackMessage(options.tracker, response.message.message_id)
  }
  return response.message?.text?.trim() ?? ''
}

/**
 * Sends a prompt with skip + cancel buttons. For optional fields.
 * Returns: null (cancelled) | '__skip__' (skipped) | string (user input)
 *
 * @example
 * const result = await waitForSkippable(conversation, ctx, 'Enter nickname', 'Skip', { tracker })
 * if (result === null) return // cancelled
 * const nickname = result === '__skip__' ? generateNickname(fullName) : result
 */
export async function waitForSkippable(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  prompt: string,
  skipLabel: string,
  options: WaitForSkippableOptions = {},
): Promise<string | null> {
  const skipData = options.skipData ?? 'skip_field'
  const sent = await ctx.reply(prompt, {
    reply_markup: {
      inline_keyboard: [[
        { text: skipLabel, callback_data: skipData },
        { text: ctx.t('button-cancel-flow'), callback_data: 'cancel_flow' },
      ]],
    },
  })
  if (options.tracker)
    trackMessage(options.tracker, sent.message_id)

  const response = await conversation.wait()

  if (response.callbackQuery?.data === 'cancel_flow') {
    await response.answerCallbackQuery()
    return null
  }
  if (response.callbackQuery?.data === skipData) {
    await response.answerCallbackQuery()
    return '__skip__'
  }
  if (options.tracker && response.message?.message_id) {
    trackMessage(options.tracker, response.message.message_id)
  }
  return response.message?.text?.trim() ?? ''
}

/**
 * Shows a confirmation message with confirm/cancel buttons.
 * Returns true if confirmed, false if cancelled.
 *
 * @example
 * const confirmed = await waitForConfirm(conversation, ctx, summaryText, { tracker })
 * if (!confirmed) { await sendCancelled(ctx, ...); return }
 */
export async function waitForConfirm(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  text: string,
  options: WaitForConfirmOptions = {},
): Promise<boolean> {
  const confirmData = options.confirmData ?? 'confirm'
  const cancelData = options.cancelData ?? 'cancel'
  const sent = await ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [[
        { text: ctx.t('button-confirm'), callback_data: confirmData },
        { text: ctx.t('button-cancel'), callback_data: cancelData },
      ]],
    },
  })
  if (options.tracker)
    trackMessage(options.tracker, sent.message_id)

  const response = await conversation.waitForCallbackQuery([confirmData, cancelData])
  await response.answerCallbackQuery()
  return response.match === confirmData
}

/**
 * Sends a standardized cancellation message with optional retry button.
 *
 * @example
 * await sendCancelled(ctx, ctx.t('join-cancelled'), {
 *   retryLabel: ctx.t('button-submit-join-request'),
 *   retryData: 'start_join',
 * })
 */
export async function sendCancelled(
  ctx: BotContext,
  message: string,
  options: SendCancelledOptions = {},
): Promise<void> {
  const keyboard = options.retryLabel && options.retryData
    ? { inline_keyboard: [[{ text: options.retryLabel, callback_data: options.retryData }]] }
    : undefined
  await ctx.reply(message, keyboard ? { reply_markup: keyboard } : undefined)
}
