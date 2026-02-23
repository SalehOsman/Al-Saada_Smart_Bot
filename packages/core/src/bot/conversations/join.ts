import { customAlphabet } from 'nanoid'
import { egyptianNationalId, egyptianPhoneNumber, extractEgyptianNationalIdInfo } from '@al-saada/validators'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import type { BotContext } from '../../types/context'
import { joinRequestService } from '../../services/join-requests'

interface JoinRequestData {
  fullName: string
  nickname?: string
  phone: string
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
  confirmed: boolean
}

export async function joinConversation(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext) {
  const telegramId = BigInt(ctx.from?.id || 0)
  if (telegramId === 0n) {
    await ctx.reply(ctx.t('error_invalid_telegram_id'))
    return
  }

  try {
    // Start the join request conversation flow
    await ctx.reply(ctx.t('join_welcome'))

    const joinData: JoinRequestData = {
      fullName: '',
      phone: '',
      nationalId: '',
      confirmed: false,
    }

    // Step 1: Full Arabic Name (with compound name support)
    joinData.fullName = await askForFullName(conversation, ctx)
    if (!joinData.fullName) {
      await ctx.reply(ctx.t('error_required_field'))
      return
    }

    // Step 2: Optional Nickname
    joinData.nickname = await askForNickname(conversation, ctx, joinData.fullName)

    // Step 3: Phone Number validation
    joinData.phone = await askForPhoneNumber(conversation, ctx)
    if (!joinData.phone) {
      await ctx.reply(ctx.t('error_required_field'))
      return
    }

    // Step 4: Egyptian National ID validation
    joinData.nationalId = await askForNationalId(conversation, ctx)
    if (!joinData.nationalId) {
      await ctx.reply(ctx.t('error_required_field'))
      return
    }

    // Extract info from National ID using shared validator logic
    const { birthDate, gender } = extractEgyptianNationalIdInfo(joinData.nationalId)
    joinData.birthDate = birthDate
    joinData.gender = gender

    // Step 5: Confirmation
    await showJoinRequestConfirmation(conversation, ctx, joinData)

    // Wait for user confirmation (callback query)
    const confirmation = await conversation.waitForCallbackQuery(['confirm_join', 'cancel_join'])
    if (confirmation.match === 'confirm_join') {
      // Use createOrBootstrap to handle both bootstrap and join request cases
      const result = await joinRequestService.createOrBootstrap({
        telegramId,
        fullName: joinData.fullName,
        nickname: joinData.nickname,
        phone: joinData.phone,
        nationalId: joinData.nationalId,
        birthDate: joinData.birthDate,
        gender: joinData.gender,
      })

      if (result.type === 'bootstrap') {
        // Bootstrap successful - show super admin welcome
        await ctx.editMessageText(ctx.t('welcome_super_admin_new'))
      }
      else {
        // Join request created - show request received message
        const requestCode = result.requestId.substring(0, 8).toUpperCase()
        await ctx.editMessageText(ctx.t('join_request_received', {
          requestCode,
          date: new Date().toLocaleDateString('ar-EG'),
        }))

        // Notify admins about new join request
        // TODO: T053/T054 — Replace with notificationService.queue() when BullMQ is ready. Currently writes directly to DB.
        await notifyAdmins(ctx, joinData)
      }
    }
    else {
      await ctx.editMessageText(ctx.t('join_cancelled'))
    }
  }
  catch (error) {
    logger.error('Error in join conversation:', error)
    await ctx.reply(ctx.t('error_generic'))
  }
}

/**
 * Ask for full Arabic name with compound name support
 */
async function askForFullName(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext): Promise<string> {
  while (true) {
    await ctx.reply(ctx.t('join_step_name'))
    const nextCtx = await conversation.waitFor('message:text')
    const text = nextCtx.message?.text?.trim()

    if (!text) {
      await ctx.reply(ctx.t('error_required_field'))
      continue
    }

    // Validate Arabic name (Unicode support)
    const arabicNameRegex = /^[\p{sc=Arabic}\s.,'-]+$/u
    if (!arabicNameRegex.test(text)) {
      await ctx.reply(ctx.t('error_invalid_arabic_name'))
      continue
    }

    if (text.length < 2) {
      await ctx.reply(ctx.t('error_name_too_short'))
      continue
    }

    return text
  }
}

/**
 * Ask for optional nickname
 */
async function askForNickname(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext, firstName: string): Promise<string | undefined> {
  await ctx.reply(ctx.t('join_step_nickname'))

  const nextCtx = await conversation.waitFor('message:text')
  const text = nextCtx.message?.text?.trim()

  // If no nickname provided or user skips, auto-generate from first name + nanoid
  if (!text || text === '/skip') {
    const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4)
    return `${firstName.split(' ')[0]}-${nanoid()}`
  }

  return text
}

/**
 * Ask for Egyptian phone number with validation
 */
async function askForPhoneNumber(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext): Promise<string> {
  while (true) {
    await ctx.reply(ctx.t('join_step_phone'))
    const nextCtx = await conversation.waitFor('message:text')
    const text = nextCtx.message?.text?.trim()

    if (!text) {
      await ctx.reply(ctx.t('error_required_field'))
      continue
    }

    // Validate using @al-saada/validators
    const validation = egyptianPhoneNumber().safeParse(text)
    if (!validation.success) {
      await ctx.reply(ctx.t('error_invalid_phone'))
      continue
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: validation.data },
    })

    if (existingUser) {
      await ctx.reply(ctx.t('error_phone_exists'))
      continue
    }

    return validation.data
  }
}

/**
 * Ask for Egyptian National ID with validation
 */
async function askForNationalId(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext): Promise<string> {
  while (true) {
    await ctx.reply(ctx.t('join_step_national_id'))
    const nextCtx = await conversation.waitFor('message:text')
    const text = nextCtx.message?.text?.trim()

    if (!text) {
      await ctx.reply(ctx.t('error_required_field'))
      continue
    }

    const validation = egyptianNationalId().safeParse(text)
    if (!validation.success) {
      await ctx.reply(ctx.t('error_invalid_national_id'))
      continue
    }

    // Check if National ID already exists
    const existingUser = await prisma.user.findUnique({
      where: { nationalId: validation.data },
    })

    if (existingUser) {
      await ctx.reply(ctx.t('error_national_id_exists'))
      continue
    }

    return validation.data
  }
}

/**
 * Show join request confirmation with extracted info
 */
async function showJoinRequestConfirmation(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext, data: JoinRequestData) {
  // Format birthDate as DD/MM/YYYY
  const formattedBirthDate = data.birthDate
    ? `${String(data.birthDate.getDate()).padStart(2, '0')}/${String(data.birthDate.getMonth() + 1).padStart(2, '0')}/${data.birthDate.getFullYear()}`
    : 'غير محدد'

  // Format gender in Arabic
  const formattedGender = data.gender === 'MALE' ? 'ذكر' : 'أنثى'

  const confirmationText = ctx.t('join_confirm', {
    fullName: data.fullName,
    nickname: data.nickname || 'غير محدد',
    phone: data.phone,
    nationalId: data.nationalId,
    birthDate: formattedBirthDate,
    gender: formattedGender,
  })

  const keyboard = [
    [
      { text: ctx.t('button_confirm'), callback_data: 'confirm_join' },
      { text: ctx.t('button_cancel'), callback_data: 'cancel_join' },
    ],
  ]

  await ctx.reply(confirmationText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
}

/**
 * Notify admins about new join request
 * TODO: T053/T054 — Replace with notificationService.queue() when BullMQ is ready. Currently writes directly to DB.
 */
async function notifyAdmins(ctx: BotContext, data: JoinRequestData) {
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN'] },
      isActive: true,
    },
  })

  if (admins.length === 0) {
    logger.warn('No active admins found to notify about join request')
    return
  }

  // Create notification for each admin
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.telegramId,
        type: 'JOIN_REQUEST',
        title: ctx.t('notification_join_request_title'),
        message: ctx.t('notification_join_request_message', {
          name: data.fullName,
          phone: data.phone,
        }),
        isRead: false,
      },
    })
  }

  logger.info(`Notified ${admins.length} admins about new join request from ${data.fullName}`)
}
