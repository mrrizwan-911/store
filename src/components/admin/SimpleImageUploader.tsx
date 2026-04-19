'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Star } from 'lucide-react'
import Image from 'next/image'

interface SimpleImageUploaderProps {
  imageUrl: string
  onUploadSuccess: (url: string) => void
}

export function SimpleImageUploader({ imageUrl, onUploadSuccess }: SimpleImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      setError(null)
      try {
        const file = acceptedFiles[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`/api/admin/upload`, {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed')
        }

        onUploadSuccess(data.data.url)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setUploading(false)
      }
    },
    [onUploadSuccess]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-[#E5E5E5] p-8 text-center cursor-pointer transition-colors bg-[#FAFAFA] ${
          isDragActive ? 'border-[#000000] bg-gray-50' : 'hover:border-[#000000]'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-8 w-8 text-[#A3A3A3] mb-2" />
        <p className="text-sm text-[#000000]">
          {isDragActive ? 'Drop image here...' : 'Drag image here or click to upload'}
        </p>
        <p className="text-xs text-[#737373] mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
      </div>

      {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      {uploading && <p className="text-sm text-[#000000] animate-pulse">Uploading...</p>}

      {imageUrl && (
        <div className="relative border border-[#E5E5E5] aspect-square w-48 mx-auto">
          <Image src={imageUrl} alt="Uploaded image" fill className="object-cover" />
        </div>
      )}
    </div>
  )
}
