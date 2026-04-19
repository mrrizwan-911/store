import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { uploadToCloudinary } from '@/lib/services/storage/cloudinary'
import { logger } from '@/lib/utils/logger'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const product = await db.product.findUnique({
      where: { id: (await context.params).id },
      include: { images: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const isPrimary = formData.get('isPrimary') === 'true'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, publicId } = await uploadToCloudinary(buffer, 'products')

    if (isPrimary) {
      // Unset previous primary images
      await db.productImage.updateMany({
        where: { productId: (await context.params).id, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    // Auto-set primary if it's the first image
    const setPrimary = product.images.length === 0 || isPrimary

    const productImage = await db.productImage.create({
      data: {
        productId: (await context.params).id,
        url,
        isPrimary: setPrimary,
        sortOrder: product.images.length,
      },
    })

    logger.info('Uploaded product image', { productId: (await context.params).id, imageId: productImage.id })

    return NextResponse.json({ success: true, data: productImage })
  } catch (error: any) {
    logger.error('Failed to upload product image', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 })
  }
}
