import { PrismaClient } from '@prisma/client'
import logger from '../utils/logger'

// Create Prisma client singleton
let prismaInstance: PrismaClient | null = null

// Function to get or create Prisma instance
function getPrismaInstance(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    })
    
    logger.info('Prisma client initialized')
  }
  
  return prismaInstance
}

// Export the Prisma singleton instance
export const prisma = getPrismaInstance()

// Function for graceful shutdown
export async function disconnect(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    logger.info('Prisma client disconnected for graceful shutdown')
  }
}