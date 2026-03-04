import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const TEST_SLUG = 'integration-test-module';
const MODULE_PATH = path.join(process.cwd(), 'modules', TEST_SLUG);
const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${TEST_SLUG}.prisma`);
const prisma = new PrismaClient();

describe('module:create CLI Integration', () => {
  beforeEach(async () => {
    // Cleanup
    if (fs.existsSync(MODULE_PATH)) fs.rmSync(MODULE_PATH, { recursive: true, force: true });
    if (fs.existsSync(SCHEMA_PATH)) fs.unlinkSync(SCHEMA_PATH);

    // Ensure section exists
    await prisma.section.upsert({
      where: { slug: 'operations' },
      update: {},
      create: {
        slug: 'operations',
        name: 'العمليات',
        nameEn: 'Operations',
        icon: '⚙️'
      }
    });
  });

  afterEach(async () => {
    // Cleanup
    if (fs.existsSync(MODULE_PATH)) fs.rmSync(MODULE_PATH, { recursive: true, force: true });
    if (fs.existsSync(SCHEMA_PATH)) fs.unlinkSync(SCHEMA_PATH);
  });

  it.skip('scaffolds a complete module including package.json with correct content (non-interactive)', async () => {
    // TODO: enable when test DB user has upsert access on test_db.public (User 'test' was denied access)
    // Run in non-interactive mode
    const command = `npx tsx scripts/module-create.ts ${TEST_SLUG} --non-interactive --name="Test Arabic" --nameEn="Test English" --sectionSlug="operations" --icon="📦"`;

    try {
      execSync(command, { stdio: 'pipe', env: { ...process.env, NODE_ENV: 'test' } });
    } catch (error: any) {
      console.error('CLI Command failed:', error.stdout?.toString() || error.message);
      throw error;
    }

    // Verify folder structure
    expect(fs.existsSync(MODULE_PATH)).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'add.conversation.ts'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'schema.prisma'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'locales', 'ar.ftl'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'locales', 'en.ftl'))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_PATH, 'tests', 'flow.test.ts'))).toBe(true);
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);

    // Verify package.json content (D1 Fix)
    const packageJson = JSON.parse(fs.readFileSync(path.join(MODULE_PATH, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe(`@al-saada/module-${TEST_SLUG}`);
    expect(packageJson.version).toBe('0.0.1');
    expect(packageJson.private).toBe(true);
    expect(packageJson.type).toBe('module');
    expect(packageJson.dependencies['@al-saada/module-kit']).toBe('workspace:*');
  });
});
