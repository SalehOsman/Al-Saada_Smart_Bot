import path from 'node:path'
import { defineConfig } from 'vitest/config'

const resolve = {
  alias: {
    '@core': path.resolve(__dirname, './packages/core/src'),
    '@module-kit': path.resolve(__dirname, './packages/module-kit/src'),
  },
}

export default defineConfig({
  resolve,
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    includeSource: ['packages/core/src/**/*'],
    exclude: [
      '**/node_modules/**',
      '.opencode/**',
      '.claude/**',
      'dist/**',
      'modules/**',
    ],
    setupFiles: ['./packages/core/tests/setup.ts'],
    // Use projects to apply different timeouts to specific files
    projects: [
      {
        resolve,
        test: {
          name: 'scripts',
          include: ['scripts/tests/**/*.test.ts'],
          testTimeout: 30000,
          environment: 'node',
        },
      },
      {
        resolve,
        test: {
          name: 'core',
          include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
          environment: 'node',
          setupFiles: ['./packages/core/tests/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'packages/core/tests/',
        'packages/core/src/bot/handlers/**',
        'packages/core/src/bot/conversations/**',
      ],
      // Phase 1: baseline thresholds — reflects current test coverage
      // TODO: raise to 50% after join flow tests, then 80% after full suite
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
  },
})
