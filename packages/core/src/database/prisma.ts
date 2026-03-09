import { PrismaClient } from '@prisma/client'
import logger from '../utils/logger'
import { env } from '../config/env'

// Create Prisma client singleton
let prismaInstance: PrismaClient | null = null

function getPrismaInstance(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ],
    })

    logger.info('Prisma client initialized')
  }

  return prismaInstance
}

/**
 * Prisma singleton instance for database access.
 */
export const prisma = getPrismaInstance()

/**
 * Gracefully disconnects the Prisma client.
 */
export async function disconnect(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    logger.info('Prisma client disconnected')
  }
}
