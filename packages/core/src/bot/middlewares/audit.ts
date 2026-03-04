import type { NextFunction } from 'grammy'
import type { AuditAction } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { auditService } from '../../services/audit-logs'

/**
 * Middleware that adds an audit helper to the context.
 * Allows easy logging of actions from anywhere in the bot.
 */
export async function auditMiddleware(ctx: BotContext, next: NextFunction) {
  ctx.audit = async (action: AuditAction, targetType?: string, targetId?: string, metadata?: Record<string, any>) => {
    if (!ctx.from)
      return

    await auditService.log({
      userId: BigInt(ctx.from.id),
      action,
      targetType,
      targetId,
      details: metadata,
    })
  }

  await next()
}
