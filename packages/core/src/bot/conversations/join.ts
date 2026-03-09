/**
 * @file join.ts
 * @module bot/conversations/join
 *
 * Join request conversation flow.
 *
 * Handles two cases transparently via `joinRequestService.createOrBootstrap()`:
 * 1. Bootstrap — first user matching INITIAL_SUPER_ADMIN_ID becomes Super Admin
 * 2. Join Request — regular users submit a request pending admin approval
 *
 * Steps:
 *   1. Full Arabic name
 *   2. Nickname (optional — auto-generated from name if skipped)
 *   3. Egyptian phone number
 *   4. Egyptian National ID (auto-extracts birth date + gender)
 *   5. Confirmation screen
 *
 * UX: All flow messages are deleted before the final result message appears.
 */

import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { BotContext } from '../../types/context'
import { joinRequestService } from '../../services/join-requests'
import {
  createMessageTracker,
  deleteTrackedMessages,
  sendCancelled,
  waitForConfirm,
  waitForSkippable,
  waitForTextOrCancel,
} from '../utils/conversation'
import {
  askForArabicName,
  askForNationalId,
  askForPhone,
  generateNickname,
} from '../utils/user-inputs'
import {
  formatArabicDate,
  formatGender,
  notifyAdmins,
} from '../utils/formatters'

/**
 * The join request conversation flow.
 * Guides users through submitting a request or performs initial system bootstrap (FR-001).
 *
 * @param conversation - The grammY conversation handle
 * @param ctx - The bot context
 */
export async function joinConversation(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
) {
  const telegramId = BigInt(ctx.from?.id || 0)
  const telegramUsername = ctx.from?.username

  if (telegramId === 0n) {
    await ctx.reply(ctx.t('error-invalid-telegram-id'))
    return
  }

  const tracker = createMessageTracker()
  const wait = (prompt: string) => waitForTextOrCancel(conversation, ctx, prompt, { tracker })

  async function cancel() {
    await deleteTrackedMessages(ctx, tracker)
    await sendCancelled(ctx, ctx.t('join-cancelled'), {
      retryLabel: ctx.t('button-submit-join-request'),
      retryData: 'start_join',
    })
  }

  try {
    const welcome = await ctx.reply(ctx.t('join-welcome'))
    tracker.ids.push(welcome.message_id)

    // ── Step 1: Full Name ────────────────────────────────────────────────
    const fullName = await askForArabicName(ctx, wait)
    if (!fullName) {
      await cancel()
      return
    }

    // ── Step 2: Nickname (optional) ──────────────────────────────────────
    const nickResult = await waitForSkippable(
      conversation,
      ctx,
      ctx.t('join-step-nickname'),
      ctx.t('button-skip-nickname'),
      { tracker, skipData: 'skip_nickname' },
    )
    if (nickResult === null) {
      await cancel()
      return
    }
    const nickname = nickResult === '__skip__'
      ? generateNickname(fullName)
      : (nickResult || generateNickname(fullName))

    // ── Step 3: Phone ────────────────────────────────────────────────────
    const phone = await askForPhone(ctx, wait)
    if (!phone) {
      await cancel()
      return
    }

    // ── Step 4: National ID ──────────────────────────────────────────────
    const idInfo = await askForNationalId(ctx, wait)
    if (!idInfo) {
      await cancel()
      return
    }
    const { nationalId, birthDate, gender } = idInfo

    // ── Step 5: Confirmation ─────────────────────────────────────────────
    const confirmText = ctx.t('join-confirm', {
      fullName,
      nickname: nickname || ctx.t('value-unknown'),
      phone,
      nationalId,
      birthDate: birthDate ? formatArabicDate(birthDate) : ctx.t('value-unknown'),
      gender: ctx.t(formatGender(gender)),
    })

    const confirmed = await waitForConfirm(conversation, ctx, confirmText, {
      tracker,
      confirmData: 'confirm_join',
      cancelData: 'cancel_join',
    })

    // ── Cleanup: delete all flow messages ────────────────────────────────
    await deleteTrackedMessages(ctx, tracker)

    if (!confirmed) {
      await sendCancelled(ctx, ctx.t('join-cancelled'), {
        retryLabel: ctx.t('button-submit-join-request'),
        retryData: 'start_join',
      })
      return
    }

    // ── Submit ────────────────────────────────────────────────────────────
    const result = await joinRequestService.createOrBootstrap({
      telegramId,
      telegramUsername,
      fullName,
      nickname,
      phone,
      nationalId,
      birthDate,
      gender,
    })

    if (result.type === 'bootstrap') {
      await ctx.reply(ctx.t('welcome-super-admin-new'))
    }
    else {
      const requestCode = result.requestId.substring(0, 8).toUpperCase()
      await ctx.reply(ctx.t('join-request-received', {
        requestCode,
        date: new Date().toLocaleDateString('ar-EG'),
      }))
      const displayName = nickname || fullName
      await notifyAdmins({
        type: 'JOIN_REQUEST_NEW',
        params: { userName: displayName, requestCode: result.requestId },
      })
    }
  }
  catch (error) {
    await deleteTrackedMessages(ctx, tracker)
    throw error
  }
}
