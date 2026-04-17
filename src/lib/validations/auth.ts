import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
}).refine(data => data.name || data.full_name || data.fullName, {
  message: "Name or full_name is required",
  path: ["name"]
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const otpSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpInput = z.infer<typeof otpSchema>
