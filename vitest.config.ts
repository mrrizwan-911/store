import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

export default defineConfig(({ mode }) => {
  // Manually load env files to ensure they are available
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
  let env = {} as any

  for (const file of envFiles) {
    const path = resolve(__dirname, file)
    if (fs.existsSync(path)) {
      const config = dotenv.parse(fs.readFileSync(path))
      env = { ...env, ...config }
    }
  }

  // Ensure DATABASE_URL is set correctly for tests (prefer DIRECT_URL if DATABASE_URL is prisma-accelerator)
  const dbUrl = env.DATABASE_URL || ''
  if (dbUrl.startsWith('prisma+postgres://') && env.DIRECT_URL) {
    env.DATABASE_URL = env.DIRECT_URL
  }

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      alias: {
        '@': resolve(__dirname, './src'),
      },
      setupFiles: ['./tests/setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      testTimeout: 60000,
      hookTimeout: 60000,
      env: {
        ...env,
        RESEND_API_KEY: env.RESEND_API_KEY || 're_test_123',
        APP_ENV: 'development',
      },
    },
    projects: [
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        name: 'integration',
        test: {
          include: ['tests/integration/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup.ts', './tests/integration/setup.ts'],
          environment: 'jsdom',
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
          env: {
            ...env,
            RESEND_API_KEY: env.RESEND_API_KEY || 're_test_123',
            APP_ENV: 'development',
          },
        },
      },
    ],
  }
})
