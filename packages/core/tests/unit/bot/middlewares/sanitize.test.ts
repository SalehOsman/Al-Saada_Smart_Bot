import { describe, expect, it, vi } from 'vitest'
import { sanitizeMiddleware } from '../../../../src/bot/middlewares/sanitize'

describe('sanitizeMiddleware', () => {
  it('should sanitize ctx.message.text', async () => {
    const ctx = {
      message: {
        text: '<script>alert(1)</script>',
      },
    } as any
    const next = vi.fn()

    await sanitizeMiddleware(ctx, next)

    expect(ctx.message.text).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(next).toHaveBeenCalled()
  })

  it('should do nothing if ctx.message.text is missing', async () => {
    const ctx = {
      message: {},
    } as any
    const next = vi.fn()

    await sanitizeMiddleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })
})
