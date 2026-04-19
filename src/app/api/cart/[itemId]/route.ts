import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { updateItemSchema } from '@/lib/validations/cart'
import { logger } from '@/lib/utils/logger'

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = verifyAccessToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart update attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateItemSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Invalid cart update data', { issues: parsed.error.issues })
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { quantity } = parsed.data
  const { itemId } = await context.params

  const cart = await db.cart.findUnique({ where: { userId } })
  if (!cart) {
    return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 })
  }

  const item = await db.cartItem.findUnique({
    where: { id: itemId, cartId: cart.id },
    include: { product: { include: { variants: true } } }
  })

  if (!item) {
    return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 })
  }

  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: itemId } })
  } else {
    // Check stock
    if (item.variantId) {
      const variant = item.product.variants.find(v => v.id === item.variantId)
      if (variant && variant.stock < quantity) {
        return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 409 })
      }
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })
  }

  // Calculate new subtotal and count
  const updatedCart = await db.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: { select: { basePrice: true, salePrice: true } },
          variant: { select: { price: true } }
        }
      }
    }
  })

  let subtotal = 0
  let itemCount = 0
  if (updatedCart) {
    subtotal = updatedCart.items.reduce((sum, i) => {
      const unitPrice = Number(i.variant?.price ?? i.product.salePrice ?? i.product.basePrice)
      return sum + unitPrice * i.quantity
    }, 0)
    itemCount = updatedCart.items.reduce((s, i) => s + i.quantity, 0)
  }

  return NextResponse.json({ success: true, data: { subtotal, itemCount } })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart delete attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cart = await db.cart.findUnique({ where: { userId } })
  if (!cart) {
    return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 })
  }

  const item = await db.cartItem.findUnique({
    where: { id: (await context.params).itemId, cartId: cart.id },
  })

  if (!item) {
    return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 })
  }

  await db.cartItem.delete({ where: { id: (await context.params).itemId } })

  return NextResponse.json({ success: true })
}
