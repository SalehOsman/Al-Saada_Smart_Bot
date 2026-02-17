import pino from 'pino'
import pretty from 'pino-pretty'
import { env } from '../config/env'

// Create Pino logger instance with configuration based on environment
const logger = pino({
  level: env.LOG_LEVEL.toLowerCase(),
  // Enable pretty printing in development mode
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      messageFormat: '{msg}', // Clean format for Arabic text
    },
  } : undefined,
  // Ensure UTF-8 encoding for Arabic text
  formatters: {
    level(label) {
      return { level: label }
    },
    log(object) {
      // Ensure proper UTF-8 encoding for Arabic characters
      return object
    },
  },
})

// Export logger as default
export default logger