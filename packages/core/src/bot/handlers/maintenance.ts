import type { BotContext } from '../../types/context'
import { maintenanceService } from '../../services/maintenance'

/**
 * Handler for the /maintenance command (Super Admin only).
 * Toggles maintenance mode and responds with the new status.
 * Implements FR-022.
 */
export async function maintenanceHandler(ctx: BotContext) {
  // Only Super Admins can toggle maintenance mode (FR-022, FR-015)
  // This is redundant with RBAC middleware but added for safety
  if (ctx.session.role !== 'SUPER_ADMIN') {
    return ctx.reply(ctx.t('errors-unauthorized'))
  }

  const userId = BigInt(ctx.from!.id)
  const isEnabled = await maintenanceService.toggleMaintenance(userId)

  // Respond with the new status via i18n
  const statusKey = isEnabled ? 'maintenance-status-on' : 'maintenance-status-off'
  return ctx.reply(ctx.t(statusKey))
}
