import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validate } from '../src/validation.js';

describe('validate() helper', () => {
  const mockCtx = {
    t: vi.fn((key: string) => key),
    reply: vi.fn(),
  } as any;

  const mockConversation = {
    waitFor: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts user and returns valid input', async () => {
    mockConversation.waitFor.mockResolvedValue({
      message: { text: 'valid input' },
    });

    const result = await validate(mockConversation, mockCtx, {
      field: 'test',
      promptKey: 'prompt',
      errorKey: 'error',
      validator: (val) => val === 'valid input',
    });

    expect(mockCtx.t).toHaveBeenCalledWith('prompt');
    expect(mockCtx.reply).toHaveBeenCalledWith('prompt');
    expect(result).toBe('valid input');
  });

  it('retries on invalid input and then returns valid input', async () => {
    mockConversation.waitFor
      .mockResolvedValueOnce({ message: { text: 'invalid' } })
      .mockResolvedValueOnce({ message: { text: 'valid' } });

    const result = await validate(mockConversation, mockCtx, {
      field: 'test',
      promptKey: 'prompt',
      errorKey: 'error',
      validator: (val) => val === 'valid',
    });

    expect(mockCtx.t).toHaveBeenCalledWith('error');
    expect(result).toBe('valid');
  });

  it('returns undefined and notifies user after max retries', async () => {
    mockConversation.waitFor.mockResolvedValue({ message: { text: 'invalid' } });

    const result = await validate(mockConversation, mockCtx, {
      field: 'test',
      promptKey: 'prompt',
      errorKey: 'error',
      validator: () => false,
      maxRetries: 2,
    });

    expect(result).toBeUndefined();
    expect(mockCtx.t).toHaveBeenCalledWith('module-kit-max-retries-exceeded');
  });

  it('applies formatter to valid input', async () => {
    mockConversation.waitFor.mockResolvedValue({ message: { text: '123' } });

    const result = await validate(mockConversation, mockCtx, {
      field: 'test',
      promptKey: 'prompt',
      errorKey: 'error',
      validator: () => true,
      formatter: (val) => parseInt(val, 10),
    });

    expect(result).toBe(123);
  });
});
