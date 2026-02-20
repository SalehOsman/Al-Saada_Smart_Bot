import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Environment Variable Validation', () => {
  const baseEnv = {
    BOT_TOKEN: 'valid-token',
    DATABASE_URL: 'valid-db-url',
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should pass with valid environment variables', async () => {
    vi.stubGlobal('process', {
      env: { ...baseEnv, INITIAL_SUPER_ADMIN_ID: '123' },
    });
    const { env } = await import('../../../src/config/env');
    expect(env.INITIAL_SUPER_ADMIN_ID).toBe(123);
  });

  it('should fail if BOT_TOKEN is not set', async () => {
    const { BOT_TOKEN, ...rest } = baseEnv;
    vi.stubGlobal('process', {
      env: { ...rest },
    });
    await expect(import('../../../src/config/env')).rejects.toThrow();
  });

  it('should fail if DATABASE_URL is not set', async () => {
    const { DATABASE_URL, ...rest } = baseEnv;
    vi.stubGlobal('process', {
      env: { ...rest },
    });
    await expect(import('../../../src/config/env')).rejects.toThrow();
  });

  it('should allow INITIAL_SUPER_ADMIN_ID to be unset', async () => {
    vi.stubGlobal('process', {
      env: { ...baseEnv },
    });
    const { env } = await import('../../../src/config/env');
    expect(env.INITIAL_SUPER_ADMIN_ID).toBeUndefined();
  });

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a number', async () => {
    vi.stubGlobal('process', {
      env: { ...baseEnv, INITIAL_SUPER_ADMIN_ID: 'abc' },
    });
    await expect(import('../../../src/config/env')).rejects.toThrow();
  });

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a positive number', async () => {
    vi.stubGlobal('process', {
      env: { ...baseEnv, INITIAL_SUPER_ADMIN_ID: '0' },
    });
    await expect(import('../../../src/config/env')).rejects.toThrow();
  });
});