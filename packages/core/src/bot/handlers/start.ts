import { customAlphabet } from 'nanoid'
import { prisma } from '../../database/prisma'
import { env } from '../../config/env'
import logger from '../../utils/logger'
import { BotContext } from '../../types/context'

const generateNickname = (firstName: string) => {
  const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4)
  return `${firstName}-${nanoid()}`
}

export const startHandler = async (ctx: BotContext) => {
  const telegramId = BigInt(ctx.from?.id || 0)
  if (telegramId === 0n) return

  try {
    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (existingUser) {
      // Return existing user welcome
      return ctx.reply(ctx.t('welcome_back', { name: existingUser.fullName }))
    }

    // 2. Check for Bootstrap Lock (FR-014)
    // Only evaluate INITIAL_SUPER_ADMIN_ID if there are 0 SUPER_ADMINs in DB
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    })

    if (superAdminCount === 0 && env.INITIAL_SUPER_ADMIN_ID === Number(telegramId)) {
      // This is the first Super Admin bootstrap
      const fullName = ctx.from?.first_name || 'Super Admin'
      const nickname = generateNickname(fullName)

      const superAdmin = await prisma.user.create({
        data: {
          telegramId,
          fullName,
          nickname,
          role: 'SUPER_ADMIN',
          telegramUsername: ctx.from?.username,
          isActive: true,
          language: ctx.from?.language_code || 'ar',
        },
      })

      logger.info(`Super Admin bootstrapped: ${superAdmin.fullName} (${telegramId})`)
      
      // Log audit action
      await prisma.auditLog.create({
        data: {
          userId: telegramId,
          action: 'USER_BOOTSTRAP',
          targetType: 'User',
          targetId: superAdmin.id,
          details: { role: 'SUPER_ADMIN' },
        },
      })

      return ctx.reply(ctx.t('welcome_super_admin', { name: fullName }))
    }

    // 3. Regular new user flow (Join Request)
    // For now, just show welcome message as Visitor
    return ctx.reply(ctx.t('welcome_visitor'))
  } catch (error) {
    logger.error('Error in /start handler:', error)
    return ctx.reply(ctx.t('error_generic'))
  }
}
