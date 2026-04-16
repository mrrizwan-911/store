import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000),
})

export type ReviewInput = z.infer<typeof reviewSchema>

export const productFilterSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  featured: z.string().transform(val => val === 'true').optional(),
})

export type ProductFilterParams = z.infer<typeof productFilterSchema>
