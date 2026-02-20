import { customAlphabet } from 'nanoid'
import { egyptianPhoneNumber } from '@al-saada/validators'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import type { BotContext } from '../../types/context'

interface JoinRequestData {
  fullName: string
  nickname?: string
  phone: string
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
  confirmed: boolean
}

// Extract birth date and gender from Egyptian National ID
function extractNationalIdInfo(id: string): { birthDate: Date, gender: 'MALE' | 'FEMALE' } {
  const yearPrefix = id.startsWith('2') ? '19' : '20'
  const year = Number.parseInt(yearPrefix + id.substring(1, 3), 10)
  const month = Number.parseInt(id.substring(3, 5), 10) - 1 // Month is 0-indexed
  const day = Number.parseInt(id.substring(5, 7), 10)
  const genderCode = Number.parseInt(id.substring(9, 10), 10)

  // Gender is determined by odd/even of the 10th digit
  const gender = genderCode % 2 === 0 ? 'MALE' : 'FEMALE'

  const birthDate = new Date(year, month, day)

  return { birthDate, gender }
}

export async function joinConversation(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext) {
  const telegramId = BigInt(ctx.from?.id || 0)
  if (telegramId === 0n) {
    await ctx.reply(ctx.t('error_invalid_telegram_id'))
    return
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (existingUser) {
      await ctx.reply(ctx.t('user_already_exists'))
      return
    }

    // Check if there's already a pending join request
    const pendingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId: telegramId,
        status: 'PENDING',
      },
    })

    if (pendingRequest) {
      await ctx.reply(ctx.t('join_request_pending'))
      return
    }

    // Start the join request conversation flow
    await ctx.reply(ctx.t('join_request_start'))

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

    // Extract info from National ID
    const { birthDate, gender } = extractNationalIdInfo(joinData.nationalId)
    joinData.birthDate = birthDate
    joinData.gender = gender

    // Step 5: Confirmation
    await showJoinRequestConfirmation(conversation, ctx, joinData)

    // Wait for user confirmation
    const confirmation = await conversation.waitFrom(ctx.from, async (ctx) => {
      return ctx.message?.text
    })

    if (confirmation?.toLowerCase() === ctx.t('button_confirm')) {
      // Save join request to database
      await saveJoinRequest(ctx, telegramId, joinData)
      await ctx.reply(ctx.t('join_request_saved'))
    }
    else {
      await ctx.reply(ctx.t('join_request_cancelled'))
    }

    // Notify admins about new join request
    await notifyAdmins(ctx, joinData)

    await ctx.reply(ctx.t('join_request_complete'))
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
  await ctx.reply(ctx.t('ask_full_name'))

  return await conversation.waitFrom(ctx.from, async (ctx) => {
    const text = ctx.message?.text?.trim()
    if (!text)
      return

    // Validate Arabic name (Unicode support)
    const arabicNameRegex = /^[\p{L}\s\u0660-\u0669.,'-]+$/u
    if (!arabicNameRegex.test(text)) {
      await ctx.reply(ctx.t('error_invalid_arabic_name'))
      return
    }

    if (text.length < 2) {
      await ctx.reply(ctx.t('error_name_too_short'))
      return
    }

    return text
  })
}

/**
 * Ask for optional nickname
 */
async function askForNickname(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext, firstName: string): Promise<string | undefined> {
  await ctx.reply(ctx.t('ask_nickname'))
  await ctx.reply(ctx.t('nickname_info'))

  const nickname = await conversation.waitFrom(ctx.from, async (ctx) => {
    const text = ctx.message?.text?.trim()
    if (!text)
      return

    // User provided a nickname
    return text
  })

  // If no nickname provided, auto-generate from first name + nanoid
  if (!nickname || nickname === '/skip') {
    const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4)
    return `${firstName.split(' ')[0]}-${nanoid()}`
  }

  return nickname
}

/**
 * Ask for Egyptian phone number with validation
 */
async function askForPhoneNumber(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext): Promise<string> {
  await ctx.reply(ctx.t('ask_phone_number'))
  await ctx.reply(ctx.t('phone_info'))

  return await conversation.waitFrom(ctx.from, async (ctx) => {
    const text = ctx.message?.text?.trim()
    if (!text)
      return

    // Validate using @al-saada/validators
    const validation = egyptianPhoneNumber().safeParse(text)
    if (!validation.success) {
      await ctx.reply(ctx.t('error_invalid_phone'))
      return
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: validation.data },
    })

    if (existingUser) {
      await ctx.reply(ctx.t('error_phone_exists'))
      return
    }

    return validation.data
  })
}

/**
 * Ask for Egyptian National ID with validation
 */
async function askForNationalId(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext): Promise<string> {
  await ctx.reply(ctx.t('ask_national_id'))
  await ctx.reply(ctx.t('national_id_info'))

  return await conversation.waitFrom(ctx.from, async (ctx) => {
    const text = ctx.message?.text?.trim()
    if (!text)
      return

    // Validate format (simple check for now - full validation in component)
    if (!/^[23]\d{13}$/.test(text)) {
      await ctx.reply(ctx.t('error_invalid_national_id'))
      return
    }

    // Check if National ID already exists
    const existingUser = await prisma.user.findUnique({
      where: { nationalId: text },
    })

    if (existingUser) {
      await ctx.reply(ctx.t('error_national_id_exists'))
      return
    }

    return text
  })
}

/**
 * Show join request confirmation with extracted info
 */
async function showJoinRequestConfirmation(conversation: Conversation<ConversationFlavor & BotContext>, ctx: BotContext, data: JoinRequestData) {
  const confirmationText = ctx.t('join_request_confirm', {
    name: data.fullName,
    nickname: data.nickname || 'غير محدد',
    phone: data.phone,
    nationalId: data.nationalId,
    birthDate: data.birthDate?.toLocaleDateString('ar-EG') || 'غير محدد',
    gender: data.gender === 'MALE' ? 'ذكر' : 'أنثى',
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
 * Save join request to database
 */
async function saveJoinRequest(ctx: BotContext, telegramId: bigint, data: JoinRequestData) {
  await prisma.joinRequest.create({
    data: {
      userId: telegramId,
      name: data.fullName,
      nickname: data.nickname,
      phone: data.phone,
      nationalId: data.nationalId,
      status: 'PENDING',
    },
  })
}

/**
 * Notify admins about new join request
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
