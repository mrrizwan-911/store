import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/lib/db/client'

// Mock the Resend service in @/lib/services/email/otp to avoid sending real emails
vi.mock('@/lib/services/email/otp', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue({ id: 'mock-id' })
}))

beforeEach(async () => {
  // Clear all database tables (except _prisma_migrations) using $executeRawUnsafe with TRUNCATE TABLE ... CASCADE
  // Use $queryRaw to get the list of tables dynamically from pg_tables
  const tables: { tablename: string }[] = await db.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations';
  `

  for (const { tablename } of tables) {
    try {
      await db.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`)
    } catch (error) {
      // In case of error (like if a table is actually a view or some other issue), log it but don't fail everything
      console.error(`Failed to truncate table ${tablename}:`, error)
    }
  }
})
