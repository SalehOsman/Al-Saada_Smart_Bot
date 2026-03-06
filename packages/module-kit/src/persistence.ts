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
    // 1. Execute database action
    await action(prisma)

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
    logger.error(`Failed to save data for module ${moduleSlug}:`, error)
    await ctx.reply(ctx.t('module-kit-save-failed')) // Issue B1
    // Preserve draft by not deleting it from Redis
    throw error // Let the conversation handler handle it if needed
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
