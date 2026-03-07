import { AuditAction, type JoinRequest } from '@prisma/client'
import { prisma } from '../database/prisma'
import { env } from '../config/env'
import logger from '../utils/logger'

export interface CreateJoinRequestParams {
  telegramId: bigint
  telegramUsername?: string
  fullName: string
  nickname?: string
  phone: string
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
}

export type CreateOrBootstrapResult =
  | { type: 'bootstrap' }
  | { type: 'join-request', requestId: string }

export const joinRequestService = {
  /**
   * Check if a user has a pending join request
   */
  async hasPendingRequest(telegramId: bigint): Promise<boolean> {
    const count = await prisma.joinRequest.count({
      where: {
        telegramId,
        status: 'PENDING',
      },
    })
    return count > 0
  },

  /**
   * Create a new join request
   */
  async create(params: CreateJoinRequestParams): Promise<JoinRequest> {
    const request = await prisma.joinRequest.create({
      data: {
        telegramId: params.telegramId,
        fullName: params.fullName,
        nickname: params.nickname,
        phone: params.phone,
        nationalId: params.nationalId,
        status: 'PENDING',
      },
    })

    logger.info({ requestId: request.id, userId: params.telegramId.toString() }, 'Join request created')
    return request
  },

  /**
   * Create a join request OR bootstrap as Super Admin (FR-014)
   * Checks if bootstrap is eligible (0 SUPER_ADMINs + matching INITIAL_SUPER_ADMIN_ID)
   * If bootstrap: creates SUPER_ADMIN user and audit log
   * Otherwise: creates PENDING join request
   */
  async createOrBootstrap(params: CreateJoinRequestParams): Promise<CreateOrBootstrapResult> {
    // Check bootstrap eligibility
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    })

    const initialSuperAdminId = env.INITIAL_SUPER_ADMIN_ID
      ? BigInt(env.INITIAL_SUPER_ADMIN_ID)
      : null

    // Bootstrap eligible: 0 SUPER_ADMINs AND telegramId matches INITIAL_SUPER_ADMIN_ID
    if (superAdminCount === 0 && initialSuperAdminId !== null && initialSuperAdminId === params.telegramId) {
      // Create Super Admin user
      const superAdmin = await prisma.user.create({
        data: {
          telegramId: params.telegramId,
          telegramUsername: params.telegramUsername,
          fullName: params.fullName,
          nickname: params.nickname,
          phone: params.phone,
          nationalId: params.nationalId,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      })

      logger.info(`Super Admin bootstrapped: ${superAdmin.fullName} (${params.telegramId})`)

      // Create audit log for bootstrap
      await prisma.auditLog.create({
        data: {
          userId: params.telegramId,
          action: AuditAction.USER_BOOTSTRAP,
          targetType: 'User',
          targetId: superAdmin.id,
          details: { role: 'SUPER_ADMIN' },
        },
      })

      return { type: 'bootstrap' }
    }

    // Not bootstrap eligible - create join request
    const request = await prisma.joinRequest.create({
      data: {
        telegramId: params.telegramId,
        fullName: params.fullName,
        nickname: params.nickname,
        phone: params.phone,
        nationalId: params.nationalId,
        status: 'PENDING',
      },
    })

    logger.info({ requestId: request.id, userId: params.telegramId.toString() }, 'Join request created')

    return { type: 'join-request', requestId: request.id }
  },
}
