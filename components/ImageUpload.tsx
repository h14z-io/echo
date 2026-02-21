'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { compressImage, createImageURL } from '@/lib/image'
import type { InsightImage } from '@/types'

interface ImageUploadProps {
  images: InsightImage[]
  onAdd: (files: File[]) => Promise<void>
  onRemove: (imageId: string) => void
}

export default function ImageUpload({ images, onAdd, onRemove }: ImageUploadProps) {
  const { t } = useI18n()
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Create object URLs for images
  useEffect(() => {
    const newUrls = new Map<string, string>()
    for (const img of images) {
      const existing = imageUrls.get(img.id)
      if (existing) {
        newUrls.set(img.id, existing)
      } else {
        newUrls.set(img.id, createImageURL(img.blob))
      }
    }
    // Revoke URLs for removed images
    for (const [id, url] of imageUrls) {
      if (!newUrls.has(id)) {
        URL.revokeObjectURL(url)
      }
    }
    setImageUrls(newUrls)

    return () => {
      // Cleanup all URLs on unmount
      for (const url of newUrls.values()) {
        URL.revokeObjectURL(url)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        await onAdd(imageFiles)
      }
    } catch (err) {
      console.error('Image upload failed:', err)
    }
    setUploading(false)
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-accent-500 uppercase tracking-wider">
          {t('insights.images')} ({images.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <Camera size={14} />
            {t('insights.camera')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <ImagePlus size={14} />
            {t('insights.addImages')}
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {uploading && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={16} className="animate-spin text-accent-500" />
          <span className="text-xs text-zinc-400">{t('insights.compressing')}</span>
        </div>
      )}

      {images.length === 0 && !uploading ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-xl py-6 text-sm text-zinc-500 transition-colors flex flex-col items-center gap-2"
        >
          <ImagePlus size={20} />
          {t('insights.uploadImages')}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {images.map((img, index) => {
              const url = imageUrls.get(img.id)
              return (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden group"
                >
                  {url && (
                    <img
                      src={url}
                      alt={img.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(url)}
                    />
                  )}
                  <button
                    onClick={() => onRemove(img.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-full max-h-full"
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
