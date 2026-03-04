import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './packages/core/src'),
      '@module-kit': path.resolve(__dirname, './packages/module-kit/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    includeSource: ['packages/core/src/**/*'],
    exclude: [
      'node_modules/**',
      '.opencode/**',
      '.claude/**',
      'dist/**',
      'modules/**',
    ],
    setupFiles: ['./packages/core/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'packages/core/tests/',
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
