import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { addItemSchema } from '@/lib/validations/cart'
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

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart fetch attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, basePrice: true, salePrice: true,
                       images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: { select: { id: true, size: true, color: true, price: true } },
        },
      },
    },
  })

  if (!cart) {
    return NextResponse.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } })
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = Number(item.variant?.price ?? item.product.salePrice ?? item.product.basePrice)
    return sum + unitPrice * item.quantity
  }, 0)

  return NextResponse.json({
    success: true,
    data: { ...cart, subtotal, itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) },
  })
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart add attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = addItemSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Invalid cart item data', { issues: parsed.error.issues })
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { productId, variantId, quantity } = parsed.data
  logger.request('Adding item to cart', { userId, productId, variantId, quantity })

  const product = await db.product.findUnique({
    where: { id: productId, isActive: true },
    include: { variants: variantId ? { where: { id: variantId } } : false },
  })

  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
  }

  if (variantId && product.variants) {
    const variant = product.variants[0]
    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 })
    }
    if (variant.stock < quantity) {
      return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 409 })
    }
  }

  const cart = await db.cart.upsert({
    where: { userId },
    update: { lastActiveAt: new Date() },
    create: { userId },
  })

  const existing = await db.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId: variantId as any
      }
    },
  })

  if (existing) {
    const newQuantity = existing.quantity + quantity
    if (variantId && product.variants) {
       const variant = product.variants[0]
       if (variant && variant.stock < newQuantity) {
          return NextResponse.json({ success: false, error: 'Not enough stock for total quantity' }, { status: 409 })
       }
    }

    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    })
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    })
  }

  const itemCount = await db.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  })

  return NextResponse.json({ success: true, data: { itemCount: itemCount._sum.quantity ?? 0 } })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart clear attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cart = await db.cart.findUnique({ where: { userId } })
  if (cart) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  logger.info('Cart cleared', { userId })
  return NextResponse.json({ success: true, data: { itemCount: 0, subtotal: 0, items: [] } })
}
