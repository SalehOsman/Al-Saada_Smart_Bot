import { describe, expect, it, vi } from 'vitest'
import { replyOrEdit } from '../../../../src/bot/utils/reply'

describe('replyOrEdit', () => {
  it('should call reply if not a callback query', async () => {
    const ctx = {
      callbackQuery: undefined,
      reply: vi.fn().mockResolvedValue({ message_id: 1 }),
      editMessageText: vi.fn(),
    } as any

    await replyOrEdit(ctx, 'Hello')

    expect(ctx.reply).toHaveBeenCalledWith('Hello', expect.objectContaining({ parse_mode: 'HTML' }))
    expect(ctx.editMessageText).not.toHaveBeenCalled()
  })

  it('should call editMessageText if a callback query exists', async () => {
    const ctx = {
      callbackQuery: { id: 'cb1' },
      reply: vi.fn(),
      editMessageText: vi.fn().mockResolvedValue({ message_id: 1 }),
    } as any

    await replyOrEdit(ctx, 'Hello')

    expect(ctx.editMessageText).toHaveBeenCalledWith('Hello', expect.objectContaining({ parse_mode: 'HTML' }))
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('should ignore "message is not modified" error', async () => {
    const ctx = {
      callbackQuery: { id: 'cb1' },
      editMessageText: vi.fn().mockRejectedValue({ description: 'message is not modified' }),
    } as any

    await expect(replyOrEdit(ctx, 'Hello')).resolves.not.toThrow()
  })

  it('should rethrow other errors', async () => {
    const ctx = {
      callbackQuery: { id: 'cb1' },
      editMessageText: vi.fn().mockRejectedValue(new Error('other error')),
    } as any

    await expect(replyOrEdit(ctx, 'Hello')).rejects.toThrow('other error')
  })
})
