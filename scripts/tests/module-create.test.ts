import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const TEST_SLUG = 'test-module'
const MODULE_PATH = path.join(process.cwd(), 'modules', TEST_SLUG)
const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${TEST_SLUG}.prisma`)

describe('module:create CLI', () => {
  beforeEach(() => {
    // Cleanup if exists
    if (fs.existsSync(MODULE_PATH)) {
      fs.rmSync(MODULE_PATH, { recursive: true, force: true })
    }
    if (fs.existsSync(SCHEMA_PATH)) {
      fs.unlinkSync(SCHEMA_PATH)
    }
  })

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(MODULE_PATH)) {
      fs.rmSync(MODULE_PATH, { recursive: true, force: true })
    }
    if (fs.existsSync(SCHEMA_PATH)) {
      fs.unlinkSync(SCHEMA_PATH)
    }
  })

  it('fails when slug is invalid', () => {
    const result = spawnSync('npx', ['tsx', 'scripts/module-create.ts', 'Invalid_Slug', '--non-interactive'], {
      encoding: 'utf8',
      shell: true,
    })

    // Check either non-zero exit code OR error message in stderr/stdout
    const failed = result.status !== 0 || result.stderr.includes('Error') || result.stdout.includes('Error')
    expect(failed).toBe(true)
  })

  it('fails when no slug is provided', () => {
    const result = spawnSync('npx', ['tsx', 'scripts/module-create.ts', '--non-interactive'], {
      encoding: 'utf8',
      shell: true,
    })

    const failed = result.status !== 0 || result.stderr.includes('Error') || result.stdout.includes('Error')
    expect(failed).toBe(true)
  })

  // Note: Testing interactive prompts via execSync is limited.
  // We'll focus on checking if the script exits correctly when non-interactive or provided with arguments.
})
