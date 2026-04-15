/**
 * Logger utility — behaviour controlled by APP_ENV in .env
 *
 * APP_ENV=development (default) → logs everything: full JSON payloads,
 *   DB queries, request/response bodies, errors with stack traces
 * APP_ENV=production → logs errors only, no sensitive data, no payloads
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger'
 *   logger.info('User registered', { userId, email })
 *   logger.query('GET /api/products', { filters, took: '42ms' })
 *   logger.error('Payment failed', error, { orderId })
 *   logger.warn('Low stock', { productId, stock: 2 })
 */

const isDev = (process.env.APP_ENV ?? 'development') === 'development'

function timestamp() {
  return new Date().toISOString()
}

function format(level: string, message: string, data?: unknown): string {
  const base = `[${timestamp()}] [${level}] ${message}`
  if (!isDev || data === undefined) return base
  // In dev: pretty-print the full JSON payload so nothing is hidden
  return `${base}\n${JSON.stringify(data, null, 2)}`
}

export const logger = {
  /** General information — shown in both modes */
  info(message: string, data?: unknown) {
    console.info(format('INFO ', message, data))
  },

  /** DB query logs — dev only */
  query(message: string, data?: unknown) {
    if (!isDev) return
    console.log(format('QUERY', message, data))
  },

  /** API request/response — dev only, full JSON */
  request(message: string, data?: unknown) {
    if (!isDev) return
    console.log(format('REQ  ', message, data))
  },

  /** Errors — always logged; stack trace + full data in dev, message only in prod */
  error(message: string, error?: unknown, data?: unknown) {
    if (isDev) {
      console.error(format('ERROR', message, { error, data }))
    } else {
      // In production: log message only — no stack traces, no payloads
      const msg = error instanceof Error ? error.message : String(error ?? '')
      console.error(`[${timestamp()}] [ERROR] ${message}${msg ? ` — ${msg}` : ''}`)
    }
  },

  /** Warnings — always logged */
  warn(message: string, data?: unknown) {
    if (isDev) {
      console.warn(format('WARN ', message, data))
    } else {
      console.warn(`[${timestamp()}] [WARN ] ${message}`)
    }
  },

  /** Auth events (login, logout, token refresh) — dev only */
  auth(message: string, data?: unknown) {
    if (!isDev) return
    console.log(format('AUTH ', message, data))
  },

  /** Payment events — dev only (never log card data — only IDs and amounts) */
  payment(message: string, data?: unknown) {
    if (!isDev) return
    console.log(format('PAY  ', message, data))
  },

  /** Utility: is the app running in development mode */
  isDev,
}
