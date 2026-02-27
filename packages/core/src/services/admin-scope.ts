import { prisma } from '../database/prisma'
import logger from '../utils/logger'

export const adminScopeService = {
  /**
   * Get all scopes assigned to a user
   */
  async getScopes(userId: bigint) {
    return prisma.adminScope.findMany({
      where: { userId },
      include: {
        section: true,
        module: true,
      },
    })
  },

  /**
   * Assign a new scope to an admin user
   */
  async assignScope(params: {
    userId: bigint
    sectionId: string
    moduleId?: string
    createdBy: bigint
  }) {
    const scope = await prisma.adminScope.upsert({
      where: {
        userId_sectionId_moduleId: {
          userId: params.userId,
          sectionId: params.sectionId,
          moduleId: params.moduleId || null,
        },
      },
      update: {},
      create: {
        userId: params.userId,
        sectionId: params.sectionId,
        moduleId: params.moduleId,
        createdBy: params.createdBy,
      },
    })

    logger.info(
      { userId: params.userId.toString(), sectionId: params.sectionId, moduleId: params.moduleId },
      'Admin scope assigned'
    )

    return scope
  },

  /**
   * Revoke a scope from an admin user
   */
  async revokeScope(params: {
    userId: bigint
    sectionId: string
    moduleId?: string
  }) {
    await prisma.adminScope.delete({
      where: {
        userId_sectionId_moduleId: {
          userId: params.userId,
          sectionId: params.sectionId,
          moduleId: params.moduleId || null,
        },
      },
    })

    logger.info(
      { userId: params.userId.toString(), sectionId: params.sectionId, moduleId: params.moduleId },
      'Admin scope revoked'
    )
  },
}
