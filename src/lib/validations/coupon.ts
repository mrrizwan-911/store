import { z } from 'zod'

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').toUpperCase(),
  orderValue: z.number().min(0, 'Order value must be positive'),
})

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive("Discount must be positive"),
  minOrderValue: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENTAGE' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ['discountValue'],
    });
  }
});

export type CouponInput = z.infer<typeof couponSchema>;
