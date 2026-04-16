import { vi, describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'

// Mock the Resend service before importing route handlers
vi.mock('@/lib/services/email/otp', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue({ id: 'mock-id' })
}))

import { POST as register } from '@/app/api/auth/register/route'
import { POST as verifyOtp } from '@/app/api/auth/verify-otp/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as refresh } from '@/app/api/auth/refresh/route'

describe('Auth API Integration Tests', () => {
  const getTestUser = (suffix: string) => ({
    name: `Test User ${suffix}`,
    email: `test-${suffix}-${Date.now()}@example.com`,
    password: 'Password123!',
  })

  it('should complete the full registration and login flow', async () => {
    const testUser = getTestUser('flow')
    // 1. Register
    const regReq = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    })
    const regRes = await register(regReq)
    const regData = await regRes.json()

    expect(regRes.status).toBe(201)
    expect(regData.success).toBe(true)
    const userId = regData.data.userId

    // Verify user created in DB
    const user = await db.user.findUnique({ where: { id: userId } })
    expect(user).toBeDefined()
    expect(user?.email).toBe(testUser.email)
    expect(user?.isVerified).toBe(false)

    // Verify OTP token created
    const otpToken = await db.otpToken.findFirst({ where: { userId } })
    expect(otpToken).toBeDefined()
    expect(otpToken?.code).toHaveLength(6)

    // 2. Verify OTP
    const verifyReq = new NextRequest('http://localhost/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, code: otpToken?.code }),
    })
    const verifyRes = await verifyOtp(verifyReq)
    const verifyData = await verifyRes.json()

    expect(verifyRes.status).toBe(200)
    expect(verifyData.success).toBe(true)

    const updatedUser = await db.user.findUnique({ where: { id: userId } })
    expect(updatedUser?.isVerified).toBe(true)

    // 3. Login
    const loginReq = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })
    const loginRes = await login(loginReq)
    const loginData = await loginRes.json()

    expect(loginRes.status).toBe(200)
    expect(loginData.success).toBe(true)
    expect(loginData.data.accessToken).toBeDefined()

    // Check if refreshToken cookie is set
    const refreshTokenValue = loginRes.cookies.get('refreshToken')?.value
    expect(refreshTokenValue).toBeDefined()

    // 4. Refresh Token
    const refreshReq = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
    })
    // Manual cookie setting for NextRequest
    refreshReq.cookies.set('refreshToken', refreshTokenValue!)

    const refreshRes = await refresh(refreshReq)
    const refreshData = await refreshRes.json()

    expect(refreshRes.status).toBe(200)
    expect(refreshData.success).toBe(true)
    expect(refreshData.data.accessToken).toBeDefined()
    expect(refreshRes.cookies.get('refreshToken')?.value).toBeDefined()
    expect(refreshRes.cookies.get('refreshToken')?.value).not.toBe(refreshTokenValue)
  })

  it('should fail login with incorrect password', async () => {
    const email = `wrong-${Date.now()}@example.com`
    // Pre-create and verify user
    await db.user.create({
      data: {
        name: 'Wrong Pass User',
        email,
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LpX8Z.nLzQp0p0p0p0p0p0p0p0p0p0p0p0p0p', // dummy hash
        isVerified: true,
      },
    })

    const loginReq = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'WrongPassword',
      }),
    })
    const loginRes = await login(loginReq)
    const loginData = await loginRes.json()

    expect(loginRes.status).toBe(401)
    expect(loginData.success).toBe(false)
  })

  it('should fail login if not verified', async () => {
    const email = `unverified-${Date.now()}@example.com`
    await db.user.create({
      data: {
        name: 'Unverified User',
        email,
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LpX8Z.nLzQp0p0p0p0p0p0p0p0p0p0p0p0p0p',
        isVerified: false,
      },
    })

    const loginReq = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'Password123!',
      }),
    })
    const loginRes = await login(loginReq)
    const loginData = await loginRes.json()

    expect(loginRes.status).toBe(403)
    expect(loginData.error).toContain('verify your email')
  })
})
