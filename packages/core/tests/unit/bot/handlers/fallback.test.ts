import { describe, expect, it, vi } from 'vitest'
import { fallbackHandler } from '../../../../src/bot/handlers/fallback'

describe('fallbackHandler', () => {
  it('should reply with unsupported message error', async () => {
    const ctx = {
      reply: vi.fn(),
      t: vi.fn().mockReturnValue('Unsupported message'),
    } as any

    await fallbackHandler(ctx)

    expect(ctx.t).toHaveBeenCalledWith('errors-unsupported-message')
    expect(ctx.reply).toHaveBeenCalledWith('Unsupported message')
  })
})
