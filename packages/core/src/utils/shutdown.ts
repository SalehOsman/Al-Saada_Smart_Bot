import process from 'node:process'
import type { Bot } from 'grammy'
import { disconnect as disconnectRedis } from '../cache/redis'
import { disconnect as disconnectPrisma } from '../database/prisma'
import { closeQueue } from '../services/queue'
import { closeWorker } from '../workers/notification'
import type { BotContext } from '../types/context'
import logger from './logger'

export async function handleGracefulShutdown(bot: Bot<BotContext>): Promise<void> {
  logger.info('Starting graceful shutdown process...')

  // Function to handle cleanup and exit
  const cleanup = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`)

    try {
      // Stop accepting new updates
      await bot.stop()
      logger.info('Bot stopped accepting new updates')

      // Stop processing jobs
      await closeWorker()
      await closeQueue()
      logger.info('Notification infrastructure stopped')

      // Disconnect from services
      await disconnectRedis()
      await disconnectPrisma()
      logger.info('All services disconnected')

      // Exit process
      process.exit(0)
    }
    catch (error) {
      logger.error('Error during shutdown:', error)
      process.exit(1)
    }
  }

  // Listen for SIGINT (Ctrl+C)
  process.on('SIGINT', () => cleanup('SIGINT'))

  // Listen for SIGTERM (termination signal)
  process.on('SIGTERM', () => cleanup('SIGTERM'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error)
    process.exit(1)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason)
    process.exit(1)
  })
}
