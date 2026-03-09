import { prisma } from '@core/database/prisma'
import { auditService } from '@core/services/audit-logs'
import { queueNotification } from '@core/services/notifications'
import { redis } from '@core/cache/redis'
import logger from '@core/utils/logger'
import { moduleLoader } from '@core/bot/module-loader'
import type { BotContext, SaveOptions } from './types.js'
import { maskPII } from './pii-masker.js'

/**
 * Encapsulated persistence with automatic auditing and notifications.
 */
export async function save(
  ctx: BotContext,
  options: SaveOptions,
): Promise<void> {
  const { moduleSlug, action, audit } = options
  const userId = ctx.from?.id

  if (!userId) {
    throw new Error('User ID not found in context')
  }

  try {
    // 1. Execute database action with max 1 retry (BL-002)
    try {
      await action(prisma)
    }
    catch (firstError) {
      logger.warn(`First save attempt failed for module ${moduleSlug}, retrying once...`, firstError)
      try {
        await action(prisma)
      }
      catch (retryError) {
        logger.error(`Persistent save failure for module ${moduleSlug} after retry:`, retryError)
        await ctx.reply(ctx.t('module-kit-save-failed-persistent'))
        // Preserve draft by not deleting it from Redis (delete is skipped)
        throw retryError
      }
    }

    // 2. Audit logging (masked)
    const maskedDetails = maskPII(audit.details || {})
    await auditService.log({
      userId: BigInt(userId),
      action: audit.action,
      targetType: audit.targetType,
      details: maskedDetails,
    })

    // 3. Admin notifications (unmasked)
    await notifyScopedAdmins(moduleSlug, {
      type: 'MODULE_OPERATION',
      params: {
        moduleSlug,
        action: audit.action,
        userId: String(userId),
        ...serializeParams(audit.details || {}),
      },
    })

    // 4. Delete Redis draft
    const redisKey = `draft:${userId}:${moduleSlug}`
    await redis.del(redisKey)
  }
  catch (error: any) {
    // If it's the retryError we already handled and threw, just re-throw
    if (error.message && error.message.includes('Persistent save failure')) {
      throw error
    }

    logger.error(`Failed to complete save sequence for module ${moduleSlug}:`, error)
    // Only reply if we haven't already replied in the retry catch
    if (!ctx.callbackQuery) { // Heuristic to check if we might have already replied
      // Actually, it's safer to check if the error was already handled
    }

    // Fallback error message if not handled by retry block
    if (!error.message?.includes('Persistent save failure')) {
      await ctx.reply(ctx.t('module-kit-save-failed'))
    }
    throw error
  }
}

/**
 * Resolves module -> section -> admins and notifies them.
 */
async function notifyScopedAdmins(moduleSlug: string, payload: { type: any, params: any }) {
  try {
    const loadedModule = moduleLoader.getModule(moduleSlug)
    if (!loadedModule) {
      logger.warn(`notifyScopedAdmins: Module ${moduleSlug} not found in loader`)
      return
    }

    const sectionSlug = loadedModule.config.sectionSlug // Issue E1: Direct usage

    // Resolve sectionSlug -> Section.id
    const section = await prisma.section.findUnique({
      where: { slug: sectionSlug },
      select: { id: true },
    })

    if (!section) {
      logger.warn(`notifyScopedAdmins: Section ${sectionSlug} not found for module ${moduleSlug}`)
      return
    }

    // Resolve moduleSlug -> Module.id
    const moduleRecord = await prisma.module.findUnique({
      where: { slug: moduleSlug },
      select: { id: true },
    })

    // Find ADMINs with scope for this section (section-wide OR module-specific)
    const adminScopes = await prisma.adminScope.findMany({
      where: {
        sectionId: section.id,
        OR: [
          { moduleId: null },
          { moduleId: moduleRecord?.id },
        ],
      },
      select: { userId: true },
    })

    // Fetch all SUPER_ADMINs
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { telegramId: true },
    })

    const adminIds = new Set<bigint>()
    adminScopes.forEach(a => adminIds.add(a.userId))
    superAdmins.forEach(a => adminIds.add(a.telegramId))

    // Queue notifications
    for (const adminId of adminIds) {
      await queueNotification({
        targetUserId: adminId,
        type: payload.type,
        params: payload.params,
      })
    }
  }
  catch (error) {
    logger.error(`notifyScopedAdmins failed for module ${moduleSlug}:`, error)
  }
}

/**
 * Simplifies complex objects for notification params.
 */
function serializeParams(details: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {}
  for (const key in details) {
    const val = details[key]
    params[key] = typeof val === 'object' ? JSON.stringify(val) : String(val)
  }
  return params
}
