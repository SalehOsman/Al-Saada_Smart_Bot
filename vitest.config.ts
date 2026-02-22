import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    },
  },
})
