import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { uploadToCloudinary } from '@/lib/services/storage/cloudinary'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await uploadToCloudinary(buffer, 'outfits')

    logger.info('Uploaded generic image', { url })

    return NextResponse.json({ success: true, data: { url } })
  } catch (error: any) {
    logger.error('Failed to upload image', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 })
  }
}
