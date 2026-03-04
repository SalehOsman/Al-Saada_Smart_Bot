import type { NextFunction } from 'grammy'
import type { BotContext } from '../../types/context'
import { maintenanceService } from '../../services/maintenance'
import logger from '../../utils/logger'

/**
 * Middleware to block access for non-Super Admins when maintenance mode is ON.
 * Implements FR-023.
 */
export async function maintenanceMiddleware(ctx: BotContext, next: NextFunction) {
  // Always allow Super Admins (Story 4 Acceptance 3)
  if (ctx.session?.role === 'SUPER_ADMIN') {
    return next()
  }

  // Check maintenance status
  const isMaintenance = await maintenanceService.isMaintenanceMode()

  if (isMaintenance) {
    logger.debug({ userId: ctx.from?.id }, 'Blocking request due to maintenance mode')

    // Respond via i18n key maintenance-active-message (Story 4 Acceptance 2)
    return ctx.reply(ctx.t('maintenance-active-message'))
  }

  return next()
}
