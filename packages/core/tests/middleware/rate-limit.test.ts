import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'
import { rateLimitMiddleware } from '../../src/bot/middleware/rate-limit.middleware'
import { env } from '../../src/config/env'

// Mock env
vi.mock('../../src/config/env', () => ({
  env: {
    RATE_LIMIT_ENABLED: true,
    RATE_LIMIT_REQUESTS_PER_MINUTE: 1,
    RATE_LIMIT_WINDOW_MINUTES: 1,
  },
}))

describe('rate Limit Middleware', () => {
  let ctx: any
  let next: any

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      session: { role: Role.EMPLOYEE },
      t: vi.fn((key, args) => ({ key, args })),
      reply: vi.fn(),
    }
    next = vi.fn()
    vi.clearAllMocks()
  })

  it('should allow requests when within limits', async () => {
    const middleware = rateLimitMiddleware()
    await middleware(ctx, next)
    expect(next).toHaveBeenCalled()
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('should bypass rate limiting for SUPER_ADMIN', async () => {
    ctx.session.role = Role.SUPER_ADMIN
    const middleware = rateLimitMiddleware()

    // Multiple requests
    await middleware(ctx, next)
    await middleware(ctx, next)
    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(3)
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('should block requests when limit exceeded', async () => {
    const middleware = rateLimitMiddleware()

    // First request - allowed
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledTimes(1)

    // Second request - blocked (limit is 1 per minute in mock)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledTimes(1) // Still 1

    expect(ctx.reply).toHaveBeenCalledTimes(1)
    expect(ctx.reply).toHaveBeenCalledWith({
      key: 'error-rate-limit',
      args: { seconds: 60 },
    })
  })

  it('should do nothing if RATE_LIMIT_ENABLED is false', async () => {
    // Modify mock for this test
    vi.mocked(env).RATE_LIMIT_ENABLED = false

    const middleware = rateLimitMiddleware()

    await middleware(ctx, next)
    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(2)

    // Restore
    vi.mocked(env).RATE_LIMIT_ENABLED = true
  })
})
