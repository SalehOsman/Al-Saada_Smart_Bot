import { afterEach, describe, expect, it, vi } from 'vitest'

describe('environment Variable Validation', () => {
  const baseEnv = {
    BOT_TOKEN: 'valid-token',
    DATABASE_URL: 'valid-db-url',
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('should pass with valid environment variables', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', '123')
    const { env } = await import('../../../src/config/env')
    expect(env.INITIAL_SUPER_ADMIN_ID).toBe(123)
  })

  it('should fail if BOT_TOKEN is not set', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', '')
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should fail if DATABASE_URL is not set', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', '')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should allow INITIAL_SUPER_ADMIN_ID to be unset', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    delete process.env.INITIAL_SUPER_ADMIN_ID
    const { env } = await import('../../../src/config/env')
    expect(env.INITIAL_SUPER_ADMIN_ID).toBeUndefined()
  })

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a number', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', 'abc')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a positive number', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', '0')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })
})