import { prisma } from '../database/prisma'
import { AuditAction } from '@prisma/client'
import logger from '../utils/logger'

export interface AuditLogData {
  userId: bigint
  action: AuditAction
  targetType?: string
  targetId?: string
  details?: Record<string, any>
}

/**
 * Service for system-wide audit logging.
 * Implements FR-026 and FR-027 (redaction).
 */
export const auditService = {
  /**
   * Logs an action to the AuditLog table.
   * Ensures sensitive data is redacted before saving.
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      // Redaction logic (FR-027)
      const redactedDetails = data.details ? { ...data.details } : undefined
      if (redactedDetails) {
        const sensitiveFields = ['nationalId', 'phone', 'password', 'token', 'apiKey']
        for (const field of sensitiveFields) {
          if (field in redactedDetails) {
            redactedDetails[field] = '[REDACTED]'
          }
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          details: redactedDetails || {},
        },
      })
    }
    catch (error) {
      // Fail silently for the user but log the error
      logger.error({ err: error, action: data.action, userId: String(data.userId) }, 'Audit logging failed')
    }
  },
}
