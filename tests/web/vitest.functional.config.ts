import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    include: ['src/services/bff/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../apps/web/src'),
    },
  },
})
