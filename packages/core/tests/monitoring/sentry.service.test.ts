import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/node'
import { SentryService } from '../../src/bot/monitoring/sentry.service'
import { env } from '../../src/config/env'

vi.mock('@sentry/node')
vi.mock('../../src/config/env', () => ({
  env: {
    SENTRY_DSN: 'https://test-dsn@sentry.io/123',
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
  }
}))

describe('SentryService', () => {
  let sentryService: SentryService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env for each test
    vi.mocked(env).SENTRY_DSN = 'https://test-dsn@sentry.io/123'
    sentryService = new SentryService()
  })

  it('should initialize Sentry when DSN is provided', () => {
    sentryService.init()
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://test-dsn@sentry.io/123',
      environment: 'test',
    }))
  })

  it('should not initialize Sentry when DSN is missing', () => {
    // Override env for this test
    vi.mocked(env).SENTRY_DSN = undefined
    
    sentryService.init()
    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('should capture exceptions when enabled', () => {
    sentryService.init()
    const error = new Error('Test error')
    sentryService.captureException(error)
    expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object))
  })

  it('should not capture exceptions when disabled', () => {
    vi.mocked(env).SENTRY_DSN = undefined
    sentryService.init()
    
    const error = new Error('Test error')
    sentryService.captureException(error)
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('should filter PII in beforeSend hook', () => {
    sentryService.init()
    
    // Get the beforeSend function from the init call
    const initCall = vi.mocked(Sentry.init).mock.calls[0][0]
    const beforeSend = initCall?.beforeSend
    
    expect(beforeSend).toBeDefined()
    
    if (beforeSend) {
      const event: Sentry.Event = {
        message: 'Error with phone 01234567890',
        extra: {
          phone: '01234567890',
          nationalId: '29001011234567',
          safeField: 'safe'
        }
      }
      
      const filteredEvent = beforeSend(event, { event_id: 'test' })
      
      expect(filteredEvent?.message).toContain('0123*******')
      expect(filteredEvent?.extra?.phone).toBe('0123*******')
      expect(filteredEvent?.extra?.nationalId).toBe('290***********')
      expect(filteredEvent?.extra?.safeField).toBe('safe')
    }
  })
})
