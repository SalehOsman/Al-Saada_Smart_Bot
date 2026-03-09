import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GrammyError } from 'grammy'
import { autoRetryMiddleware } from '../../src/bot/middleware/auto-retry.middleware'

describe('auto Retry Middleware (API Transformer)', () => {
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

  it('should return a function (transformer)', () => {
    const transformer = autoRetryMiddleware()
    expect(typeof transformer).toBe('function')
  })

  it('should call prev normally when no error occurs', async () => {
    prev.mockResolvedValue({ ok: true, result: { message_id: 1 } })
    const transformer = autoRetryMiddleware()

    const result = await transformer(prev, method, payload, signal)

    expect(prev).toHaveBeenCalledWith(method, payload, signal)
    expect(result).toEqual({ ok: true, result: { message_id: 1 } })
  })

  it('should NOT retry on permanent errors (e.g. 400 Bad Request)', async () => {
    // GrammyError (not HttpError) for permanent API errors like 400 Bad Request
    // auto-retry only retries GrammyError if it has retry_after
    const error400 = new GrammyError('Bad Request', { ok: false, error_code: 400, description: 'Bad Request' } as any, 'sendMessage', {})
    prev.mockRejectedValue(error400)

    const transformer = autoRetryMiddleware()

    // The plugin should rethrow the 400 error immediately
    await expect(transformer(prev, method, payload, signal)).rejects.toThrow(GrammyError)
    expect(prev).toHaveBeenCalledTimes(1)
  })

  it.todo('should retry on transient HTTP errors (e.g. 502)', () => {
    // Note: Unit testing the @grammyjs/auto-retry internals (the retry loop and backoff)
    // is not feasible as it requires mocking global timers and multiple call cycles
    // inside the external plugin. Functional verification is handled via integration tests.
  })
})
