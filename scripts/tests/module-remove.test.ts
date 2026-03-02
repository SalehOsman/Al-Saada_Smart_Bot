import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('module:remove CLI', () => {
  it('fails when no slug is provided', () => {
    expect(() => {
      execSync(`npx tsx scripts/module-remove.ts`, { stdio: 'pipe' });
    }).toThrow();
  });

  it('fails when slug does not exist', () => {
    expect(() => {
      execSync(`npx tsx scripts/module-remove.ts non-existent-slug`, { stdio: 'pipe' });
    }).toThrow();
  });
});
