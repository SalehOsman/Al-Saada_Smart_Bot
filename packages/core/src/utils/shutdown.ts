/**
 * @file shutdown.ts
 * @module core/utils/shutdown
 *
 * Utility for handling process signals and performing a clean shutdown of all services.
 */

import process from 'node:process'
import type { Bot } from 'grammy'
import { disconnect as disconnectRedis } from '../cache/redis'
import { disconnect as disconnectPrisma } from '../database/prisma'
import { closeQueue } from '../services/queue'
import { closeWorker } from '../workers/notification'
import type { BotContext } from '../types/context'
import logger from './logger'

/**
 * Sets up listeners for graceful shutdown signals (SIGINT, SIGTERM) and uncaught errors.
 * Ensures the bot stops accepting updates and all services (Redis, Prisma, Queue) are disconnected (FR-027).
 *
 * @param bot - The grammY bot instance to shut down
 */
export async function handleGracefulShutdown(bot: Bot<BotContext>): Promise<void> {
  logger.info('Starting graceful shutdown process...')

  /**
   * Internal helper to perform cleanup and exit the process.
   * @param signal - The signal that triggered the shutdown
   */
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

  // Handle unhandled promise rejections — log only, do not exit
  process.on('unhandledRejection', (reason, _promise) => {
    logger.error(
      { err: reason instanceof Error ? reason : new Error(String(reason)) },
      'Unhandled promise rejection',
    )
    // Note: We intentionally do NOT call process.exit() here to avoid
    // crashing the bot on transient rejections (e.g., BullMQ initialization)
  })
}
