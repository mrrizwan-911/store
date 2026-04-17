import jwt from 'jsonwebtoken'
interface TokenPayload {
  userId: string
  email: string
  role: string
  jti?: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' })
}

export function signRefreshToken(payload: TokenPayload): string {
  // Add a unique ID to each refresh token to ensure it's unique even if generated in the same second
  const rotatedPayload = { ...payload, jti: globalThis.crypto.randomUUID() }
  return jwt.sign(rotatedPayload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload
}
