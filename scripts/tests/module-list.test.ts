import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('module:list CLI', () => {
  it('runs successfully even when no modules exist', () => {
    const output = execSync(`npx tsx scripts/module-list.ts`, { encoding: 'utf-8' });
    expect(output).toContain('No modules found in modules/ directory.');
  });
});
