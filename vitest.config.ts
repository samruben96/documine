import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    setupFiles: ['./__tests__/setup.ts'],
    // Resource throttling for machine usability (Story 21.2.5)
    // Prevents machine freeze during test runs by limiting parallelism
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
      },
    },
    maxConcurrency: 5,
    // Timeout increased slightly to accommodate throttled execution
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
      ],
      // Thresholds apply to new code - checked per-file for tested modules
      // Global thresholds disabled until full test coverage is achieved
      thresholds: {
        'src/lib/errors.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/lib/utils/api-response.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/lib/utils/logger.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/lib/utils/storage.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    environmentMatchGlobs: [
      ['__tests__/**/*.tsx', 'happy-dom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
