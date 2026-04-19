import { z } from 'zod'

export const outfitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  season: z.string().optional(),
  occasion: z.string().optional(),
  gender: z.string().optional(),
  productIds: z.array(z.string()).min(2, "Must select at least 2 products").max(5, "Cannot select more than 5 products"),
  isPublished: z.boolean().default(false),
})

export type OutfitInput = z.infer<typeof outfitSchema>
