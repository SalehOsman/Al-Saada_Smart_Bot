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
    } catch (error) {
      // Fail silently for the user but log the error
      logger.error({ err: error, action: data.action, userId: String(data.userId) }, 'Audit logging failed')
    }
  },

  /**
   * Retrieves paginated audit logs with optional filters.
   */
  async getAuditLogs(options: {
    page?: number
    limit?: number
    userId?: bigint
    action?: AuditAction
    fromDate?: Date
    toDate?: Date
  }) {
    const page = options.page || 1
    const limit = options.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (options.userId) where.userId = options.userId
    if (options.action) where.action = options.action
    if (options.fromDate || options.toDate) {
      where.createdAt = {}
      if (options.fromDate) where.createdAt.gte = options.fromDate
      if (options.toDate) where.createdAt.lte = options.toDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  /**
   * Convenience wrapper to get logs for a specific user.
   */
  async getAuditLogsByUser(userId: bigint, page = 1, limit = 20) {
    return this.getAuditLogs({ userId, page, limit })
  },

  /**
   * Convenience wrapper to get logs for a specific action.
   */
  async getAuditLogsByAction(action: AuditAction, page = 1, limit = 20) {
    return this.getAuditLogs({ action, page, limit })
  },

  /**
   * Returns total audit log count for admin dashboard.
   */
  async getAuditLogCount() {
    return prisma.auditLog.count()
  },
}
