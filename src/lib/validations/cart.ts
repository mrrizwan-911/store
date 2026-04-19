import { z } from 'zod'

export const addItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
})

export const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(10),
})

export const syncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1).max(10),
    })
  )
})
