import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['../../apps/mobile/src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 5,
        functions: 15,
        branches: 15,
        statements: 5,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../apps/mobile/src'),
    },
  },
})
