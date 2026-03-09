/**
 * @file sentry.service.ts
 * @module bot/monitoring/sentry.service
 *
 * Centralized error tracking service using Sentry.
 */

import * as Sentry from '@sentry/node'
import { env } from '../../config/env'
import logger from '../../utils/logger'
import { filterPIIObject } from '../utils/pii-filter'

/**
 * Service to manage Sentry initialization and exception capturing.
 * Integrated with PII filtering (FR-003) to ensure sensitive data is redacted before being sent.
 */
export class SentryService {
  private isEnabled: boolean = false

  /**
   * Initialize Sentry if DSN is provided
   */
  init() {
    const dsn = env.SENTRY_DSN

    if (!dsn) {
      logger.info('Sentry DSN not provided. Error monitoring is disabled.')
      return
    }

    try {
      Sentry.init({
        dsn,
        environment: env.NODE_ENV,
        // FR-003: PII filtering
        beforeSend: (event) => {
          return filterPIIObject(event)
        },
        // Security: Don't automatically send default PII
        sendDefaultPii: false,
      })

      this.isEnabled = true
      logger.info('Sentry monitoring initialized successfully.')
    }
    catch (error) {
      logger.error({ err: error }, 'Failed to initialize Sentry monitoring')
    }
  }

  /**
   * Capture an exception to Sentry
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled)
      return

    Sentry.captureException(error, {
      extra: context,
    })
  }

  /**
   * Capture a message to Sentry
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (!this.isEnabled)
      return

    Sentry.captureMessage(message, level)
  }
}

export const sentryService = new SentryService()
