import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confirm } from '../src/confirmation.js'

describe('confirm() helper', () => {
  const mockCtx = {
    t: vi.fn((key: string) => key),
    reply: vi.fn(),
    callbackQuery: { data: '' },
    answerCallbackQuery: vi.fn(),
  } as any

  const mockConversation = {
    waitForCallbackQuery: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays summary and returns true on confirm', async () => {
    mockConversation.waitForCallbackQuery.mockResolvedValue({
      data: 'confirm',
      match: 'confirm',
      answerCallbackQuery: vi.fn(),
    })

    const result = await confirm(mockConversation, mockCtx, {
      data: { amount: 100 },
      labels: { amount: 'label-amount' },
      editableFields: ['amount'],
      reAsk: vi.fn(),
    })

    expect(mockCtx.reply).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('returns false on cancel', async () => {
    mockConversation.waitForCallbackQuery.mockResolvedValue({
      data: 'cancel',
      match: 'cancel',
      answerCallbackQuery: vi.fn(),
    })

    const result = await confirm(mockConversation, mockCtx, {
      data: { amount: 100 },
      labels: { amount: 'label-amount' },
      editableFields: ['amount'],
      reAsk: vi.fn(),
    })

    expect(result).toBe(false)
  })

  it('calls reAsk when an edit button is clicked', async () => {
    const reAskSpy = vi.fn()

    // First call returns edit:amount, second call returns confirm
    mockConversation.waitForCallbackQuery
      .mockResolvedValueOnce({
        data: 'edit:amount',
        match: 'edit:amount',
        answerCallbackQuery: vi.fn(),
      })
      .mockResolvedValueOnce({
        data: 'confirm',
        match: 'confirm',
        answerCallbackQuery: vi.fn(),
      })

    await confirm(mockConversation, mockCtx, {
      data: { amount: 100 },
      labels: { amount: 'label-amount' },
      editableFields: ['amount'],
      reAsk: reAskSpy,
    })

    expect(reAskSpy).toHaveBeenCalledWith('amount')
  })
})
