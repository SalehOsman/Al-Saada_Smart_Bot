import { prisma } from '../../database/prisma'
import { queueNotification } from '../../services/notifications'
import { NotificationType } from '../../types/notification'
import type { BotContext } from '../../types/context'
import logger from '../../utils/logger'
import { Role, Status } from '@prisma/client'

/**
 * Handle join request approval/rejection callback queries (US2, T033, T102)
 */
export async function approvalsHandler(ctx: BotContext) {
  const query = ctx.callbackQuery?.data
  if (!query) return

  const [action, requestId] = query.split(':')
  if (action !== 'approve' && action !== 'reject') return

  const adminId = BigInt(ctx.from?.id || 0)

  try {
    // T102: Atomic status check and update
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.joinRequest.findUnique({
        where: { id: requestId },
      })

      if (!request || request.status !== Status.PENDING) {
        return { error: 'already-handled' }
      }

      if (action === 'approve') {
        // 1. Create/Update User record
        await tx.user.upsert({
          where: { telegramId: request.telegramId },
          update: {
            fullName: request.fullName,
            nickname: request.nickname,
            phone: request.phone,
            nationalId: request.nationalId,
            role: Role.EMPLOYEE,
            isActive: true,
          },
          create: {
            telegramId: request.telegramId,
            fullName: request.fullName,
            nickname: request.nickname,
            phone: request.phone,
            nationalId: request.nationalId,
            role: Role.EMPLOYEE,
            isActive: true,
          },
        })

        // 2. Update JoinRequest status
        return tx.joinRequest.update({
          where: { id: requestId },
          data: {
            status: Status.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        })
      }
      else {
        // action === 'reject'
        return tx.joinRequest.update({
          where: { id: requestId },
          data: {
            status: Status.REJECTED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        })
      }
    })

    if ('error' in result && result.error === 'already-handled') {
      await ctx.answerCallbackQuery(ctx.t('errors-join-request-already-handled'))
      return ctx.editMessageText(ctx.t('errors-join-request-already-handled'))
    }

    // On success: notify user
    if (action === 'approve') {
      await queueNotification({
        targetUserId: result.telegramId,
        type: 'JOIN_REQUEST_APPROVED',
        params: {
          role: ctx.t('role-employee'),
          approvedBy: ctx.from?.first_name || ctx.t('value-unknown'),
          date: new Date().toLocaleDateString('ar-EG'),
        },
      })
      await ctx.answerCallbackQuery(ctx.t('join-request-approved-success'))
      await ctx.editMessageText(ctx.t('join-request-approved-msg', { name: result.fullName }))
    }
    else {
      await queueNotification({
        targetUserId: result.telegramId,
        type: 'JOIN_REQUEST_REJECTED',
        params: {
          rejectedBy: ctx.from?.first_name || ctx.t('value-unknown'),
          date: new Date().toLocaleDateString('ar-EG'),
        },
      })
      await ctx.answerCallbackQuery(ctx.t('join-request-rejected-success'))
      await ctx.editMessageText(ctx.t('join-request-rejected-msg', { name: result.fullName }))
    }

    logger.info(
      { action, requestId, userId: result.telegramId.toString(), adminId: adminId.toString() },
      'Join request handled'
    )
  }
  catch (error) {
    logger.error({ err: error, requestId }, 'Error in approvalsHandler')
    await ctx.answerCallbackQuery(ctx.t('error-generic'))
  }
}
