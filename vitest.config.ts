import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@': resolve(__dirname, './src'),
    },
    setupFiles: ['./tests/setup.ts'],
  },
  // Separate projects for unit and integration tests to keep setup clean
  projects: [
    {
      test: {
        name: 'unit',
        include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
        environment: 'jsdom',
      },
    },
    {
      test: {
        name: 'integration',
        include: ['tests/integration/**/*.test.{ts,tsx}'],
        setupFiles: ['./tests/setup.ts', './tests/integration/setup.ts'],
        environment: 'jsdom',
      },
    },
  ],
})
