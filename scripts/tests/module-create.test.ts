import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_SLUG = 'test-module';
const MODULE_PATH = path.join(process.cwd(), 'modules', TEST_SLUG);
const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${TEST_SLUG}.prisma`);

describe('module:create CLI', () => {
  beforeEach(() => {
    // Cleanup if exists
    if (fs.existsSync(MODULE_PATH)) {
      fs.rmSync(MODULE_PATH, { recursive: true, force: true });
    }
    if (fs.existsSync(SCHEMA_PATH)) {
      fs.unlinkSync(SCHEMA_PATH);
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(MODULE_PATH)) {
      fs.rmSync(MODULE_PATH, { recursive: true, force: true });
    }
    if (fs.existsSync(SCHEMA_PATH)) {
      fs.unlinkSync(SCHEMA_PATH);
    }
  });

  it('fails when slug is invalid', () => {
    expect(() => {
      execSync(`npx tsx scripts/module-create.ts Invalid_Slug`, { stdio: 'pipe' });
    }).toThrow();
  });

  it('fails when no slug is provided', () => {
    expect(() => {
      execSync(`npx tsx scripts/module-create.ts`, { stdio: 'pipe' });
    }).toThrow();
  });

  // Note: Testing interactive prompts via execSync is limited.
  // We'll focus on checking if the script exits correctly when non-interactive or provided with arguments.
  // Full integration test with prompts might require a more advanced setup or mocking inquirer.
});
