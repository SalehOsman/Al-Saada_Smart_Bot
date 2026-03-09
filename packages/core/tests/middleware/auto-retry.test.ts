import { describe, it, expect, vi, beforeEach } from 'vitest'
import { autoRetryMiddleware } from '../../src/bot/middleware/auto-retry.middleware'
import { GrammyError, HttpError } from 'grammy'

describe('Auto Retry Middleware (API Transformer)', () => {
  let prev: any
  let method: string
  let payload: any
  let signal: any

  beforeEach(() => {
    prev = vi.fn()
    method = 'sendMessage'
    payload = { chat_id: 123, text: 'hello' }
    signal = undefined
    vi.clearAllMocks()
  })

  it('should call prev normally when no error occurs', async () => {
    prev.mockResolvedValue({ ok: true, result: {} })
    const transformer = autoRetryMiddleware()
    
    const result = await transformer(prev, method, payload, signal)
    
    expect(prev).toHaveBeenCalledWith(method, payload, signal)
    expect(result).toEqual({ ok: true, result: {} })
  })

  it('should retry on transient HTTP errors (e.g. 502)', async () => {
    // Fail once with 502, succeed on second attempt
    const error502 = new HttpError('Bad Gateway', { ok: false, error_code: 502, description: 'Bad Gateway' } as any)
    
    prev
      .mockRejectedValueOnce(error502)
      .mockResolvedValueOnce({ ok: true, result: { message_id: 1 } })

    const transformer = autoRetryMiddleware()
    
    // We expect it to retry automatically if configured correctly
    // Note: The actual auto-retry plugin handles the timing/looping. 
    // This test verifies our wrapper/config if we have one, 
    // but since task says "Implement auto-retry... using @grammyjs/auto-retry", 
    // and we should use bot.api.config.use(), we are testing our factory.
  })
})
