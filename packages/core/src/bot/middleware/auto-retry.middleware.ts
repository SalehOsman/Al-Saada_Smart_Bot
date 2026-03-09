import { autoRetry } from '@grammyjs/auto-retry'

/**
 * Auto-retry middleware to handle transient Telegram API failures.
 * Configured as an API transformer.
 * Retries on: ETIMEDOUT, ECONNRESET, 429, 502, 503, 504.
 */
export function autoRetryMiddleware() {
  return autoRetry({
    maxRetryAttempts: 3,
    maxDelaySeconds: 30,
  })
}
