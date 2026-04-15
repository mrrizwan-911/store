import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { logger } from '@/lib/utils/logger'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })

  const client = new PrismaClient({
    adapter,
    // In dev: capture query events so the logger can pretty-print full SQL + params
    // In prod: errors only — no query noise
    log: logger.isDev
      ? [
          { level: 'query', emit: 'event' },
          { level: 'warn',  emit: 'event' },
          { level: 'error', emit: 'event' },
        ]
      : [{ level: 'error', emit: 'event' }],
  })

  if (logger.isDev) {
    // Log every SQL query with duration and full parameter values
    client.$on('query', (e) => {
      logger.query(`${e.query}`, {
        params: e.params,
        duration: `${e.duration}ms`,
        target: e.target,
      })
    })

    client.$on('warn', (e) => {
      logger.warn(`Prisma: ${e.message}`, { target: e.target })
    })
  }

  client.$on('error', (e) => {
    logger.error(`Prisma error`, undefined, { message: e.message, target: e.target })
  })

  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Prevent multiple instances during hot reload in development
if (process.env.APP_ENV !== 'production') globalForPrisma.prisma = db

