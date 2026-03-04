import { redis } from '../cache/redis'
import { auditService } from './audit-logs.ts'
import { AuditAction } from '@prisma/client'
import logger from '../utils/logger'

const MAINTENANCE_KEY = 'system:maintenance:status'
const MAINTENANCE_PUB_SUB_CHANNEL = 'system:maintenance:updates'

/**
 * Service to manage system maintenance mode.
 * Implements FR-022, FR-036, and NFR-002.
 */
export const maintenanceService = {
  /**
   * Check if maintenance mode is active.
   * Uses Redis for shared state across instances.
   */
  async isMaintenanceMode(): Promise<boolean> {
    const status = await redis.get(MAINTENANCE_KEY)
    return status === 'on'
  },

  /**
   * Set maintenance mode status.
   * Propagates changes via Redis pub/sub for all instances.
   */
  async setMaintenanceMode(enabled: boolean, userId: bigint): Promise<void> {
    const status = enabled ? 'on' : 'off'
    await redis.set(MAINTENANCE_KEY, status)
    
    // Propagate change (NFR-002)
    await redis.publish(MAINTENANCE_PUB_SUB_CHANNEL, status)
    
    // Audit the action (FR-026)
    await auditService.log({
      userId,
      action: enabled ? AuditAction.MAINTENANCE_ON : AuditAction.MAINTENANCE_OFF,
      targetType: 'SYSTEM',
      details: {
        timestamp: new Date().toISOString()
      }
    })
    
    logger.info(`Maintenance mode turned ${status} by user ${userId}`)
  },

  /**
   * Toggle maintenance mode status.
   */
  async toggleMaintenance(userId: bigint): Promise<boolean> {
    const currentStatus = await this.isMaintenanceMode()
    const newStatus = !currentStatus
    await this.setMaintenanceMode(newStatus, userId)
    return newStatus
  },

  /**
   * Subscribe to maintenance mode updates.
   * Used for real-time propagation across instances.
   */
  subscribeToUpdates(callback: (enabled: boolean) => void): void {
    const sub = redis.duplicate()
    sub.subscribe(MAINTENANCE_PUB_SUB_CHANNEL)
    sub.on('message', (channel, message) => {
      if (channel === MAINTENANCE_PUB_SUB_CHANNEL) {
        callback(message === 'on')
      }
    })
  }
}
