import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

describe('module:list CLI', () => {
  beforeEach(() => {
    const modulesDir = path.join(process.cwd(), 'modules')
    if (fs.existsSync(modulesDir)) {
      const folders = fs.readdirSync(modulesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      for (const folder of folders) {
        fs.rmSync(path.join(modulesDir, folder), { recursive: true, force: true })
      }
    }
  })

  it('runs successfully even when no modules exist', () => {
    const output = execSync(`npx tsx scripts/module-list.ts`, { encoding: 'utf-8' })
    expect(output).toContain('No modules found in modules/ directory.')
  })
})
