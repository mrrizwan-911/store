import dotenv from 'dotenv'
import path from 'path'

// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Set dummy keys for third-party services if they are missing
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_123'
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_min_32_chars_long_12345'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_min_32_chars_long_12345'

import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

// Mock the Resend service in @/lib/services/email/otp to avoid sending real emails
vi.mock('@/lib/services/email/otp', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue({ id: 'mock-id' })
}))

async function truncateDb() {
  // Clear all database tables (except _prisma_migrations) using $executeRawUnsafe with TRUNCATE TABLE ... CASCADE
  const tables: { tablename: string }[] = await db.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations';
  `

  if (tables.length > 0) {
    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ')
    try {
      await db.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`)
    } catch (error) {
      logger.error('Failed to truncate tables', error, { tableNames })
    }
  }
}

beforeAll(async () => {
  await truncateDb()
})

beforeEach(async () => {
  await truncateDb()
})
