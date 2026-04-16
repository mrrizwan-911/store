import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000),
})

export type ReviewInput = z.infer<typeof reviewSchema>

export const productFilterSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().int().positive().optional()),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().int().positive().optional()),
    category: z.string().optional(),
    minPrice: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().min(0).optional()),
    maxPrice: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().min(0).optional()),
    size: z.string().optional(),
    color: z.string().optional(),
    sort: z.string().optional(),
    search: z.string().optional(),
    featured: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined))
      .pipe(z.boolean().optional()),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice
      }
      return true
    },
    {
      message: 'maxPrice must be greater than or equal to minPrice',
      path: ['maxPrice'],
    }
  )

export type ProductFilterParams = z.infer<typeof productFilterSchema>
