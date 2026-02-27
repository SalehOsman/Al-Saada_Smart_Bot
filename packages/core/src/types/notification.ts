import { NotificationType } from '@prisma/client'

export { NotificationType }

export interface NotificationJobData {
  targetUserId: bigint
  type: NotificationType
  params?: Record<string, string>
}

export interface NotificationResult {
  success: boolean
  notificationId: string
  error?: string
}
