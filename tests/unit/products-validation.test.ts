import { describe, it, expect } from 'vitest'
import { productFilterSchema, reviewSchema } from '@/lib/validations/products'

describe('productFilterSchema', () => {
  it('should validate valid input with all parameters', () => {
    const input = {
      page: '1',
      limit: '10',
      category: 'electronics',
      minPrice: '100',
      maxPrice: '1000',
      size: 'XL',
      color: 'blue',
      sort: 'price_asc',
      search: 'laptop',
      featured: 'true'
    }
    const result = productFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        page: 1,
        limit: 10,
        category: 'electronics',
        minPrice: 100,
        maxPrice: 1000,
        size: 'XL',
        color: 'blue',
        sort: 'price_asc',
        search: 'laptop',
        featured: true
      })
    }
  })

  it('should transform string params to numbers', () => {
    const input = {
      page: '5',
      limit: '20',
      minPrice: '50',
      maxPrice: '500'
    }
    const result = productFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(5)
      expect(result.data.limit).toBe(20)
      expect(result.data.minPrice).toBe(50)
      expect(result.data.maxPrice).toBe(500)
    }
  })

  it('should transform featured "true" string to boolean true', () => {
    const input = { featured: 'true' }
    const result = productFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.featured).toBe(true)
    }
  })

  it('should transform featured other strings to boolean false', () => {
    const input = { featured: 'false' }
    const result = productFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.featured).toBe(false)
    }
  })

  it('should handle optional parameters', () => {
    const input = {}
    const result = productFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({})
  })
})

describe('reviewSchema', () => {
  it('should validate valid input', () => {
    const input = {
      rating: 5,
      title: 'Great product',
      body: 'I really loved this item, it fits perfectly!'
    }
    const result = reviewSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(input)
  })

  it('should validate rating range (1-5) and integer', () => {
    expect(reviewSchema.safeParse({ rating: 1, body: 'a'.repeat(10) }).success).toBe(true)
    expect(reviewSchema.safeParse({ rating: 5, body: 'a'.repeat(10) }).success).toBe(true)
    expect(reviewSchema.safeParse({ rating: 0, body: 'a'.repeat(10) }).success).toBe(false)
    expect(reviewSchema.safeParse({ rating: 6, body: 'a'.repeat(10) }).success).toBe(false)
    expect(reviewSchema.safeParse({ rating: 4.5, body: 'a'.repeat(10) }).success).toBe(false)
  })

  it('should enforce title length constraints', () => {
    expect(reviewSchema.safeParse({ rating: 5, title: 'a'.repeat(100), body: 'a'.repeat(10) }).success).toBe(true)
    expect(reviewSchema.safeParse({ rating: 5, title: 'a'.repeat(101), body: 'a'.repeat(10) }).success).toBe(false)
  })

  it('should validate body length constraints', () => {
    // min 10
    expect(reviewSchema.safeParse({ rating: 5, body: 'Short' }).success).toBe(false)
    expect(reviewSchema.safeParse({ rating: 5, body: 'Long enough' }).success).toBe(true)
    // max 2000
    expect(reviewSchema.safeParse({ rating: 5, body: 'a'.repeat(2001) }).success).toBe(false)
    expect(reviewSchema.safeParse({ rating: 5, body: 'a'.repeat(2000) }).success).toBe(true)
  })

  it('should handle optional title', () => {
    const input = {
      rating: 4,
      body: 'No title review here, just body.'
    }
    const result = reviewSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data.title).toBeUndefined()
  })
})
