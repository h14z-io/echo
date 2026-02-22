'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  ImagePlus,
  X,
  Loader2,
  Sparkles,
  FileCode2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { createImageURL } from '@/lib/image'
import { renderMermaid } from '@/lib/mermaid-theme'
import DiagramPreview from '@/components/DiagramPreview'
import type { InsightImage } from '@/types'

interface InsightAssetsProps {
  images: InsightImage[]
  onAddFiles: (files: File[]) => Promise<void>
  onRemove: (imageId: string) => void
  onGenerateDiagram: () => void
  generatingDiagram: boolean
  hasContent: boolean
}

export default function InsightAssets({
  images,
  onAddFiles,
  onRemove,
  onGenerateDiagram,
  generatingDiagram,
  hasContent,
}: InsightAssetsProps) {
  const { t } = useI18n()
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [diagramSvgs, setDiagramSvgs] = useState<Map<string, string>>(new Map())
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewDiagram, setPreviewDiagram] = useState<InsightImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Create object URLs for regular images, render SVGs for diagrams
  useEffect(() => {
    const newUrls = new Map<string, string>()
    for (const img of images) {
      if (img.mermaidCode) continue
      const existing = imageUrls.get(img.id)
      if (existing) {
        newUrls.set(img.id, existing)
      } else {
        newUrls.set(img.id, createImageURL(img.blob))
      }
    }
    for (const [id, url] of imageUrls) {
      if (!newUrls.has(id)) {
        URL.revokeObjectURL(url)
      }
    }
    setImageUrls(newUrls)

    // Render diagrams
    for (const img of images) {
      if (img.mermaidCode && !diagramSvgs.has(img.id)) {
        renderMermaid(img.mermaidCode).then((result) => {
          if (result.svg) {
            setDiagramSvgs((prev) => new Map(prev).set(img.id, result.svg!))
          }
        })
      }
    }

    return () => {
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
        await onAddFiles(imageFiles)
      }
    } catch (err) {
      console.error('Image upload failed:', err)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const regularImages = images.filter((img) => !img.mermaidCode)
  const diagrams = images.filter((img) => img.mermaidCode)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-accent-500 uppercase tracking-wider">
          {t('insights.assets')} ({images.length})
        </h2>
        <div className="flex items-center gap-2">
          {hasContent && (
            <button
              onClick={onGenerateDiagram}
              disabled={generatingDiagram}
              className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} />
              {t('insights.generateDiagram')}
            </button>
          )}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <Camera size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <ImagePlus size={14} />
          </button>
        </div>
      </div>

      {/* Hidden inputs */}
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

      {/* Upload / Diagram generation loading */}
      {(uploading || generatingDiagram) && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={16} className="animate-spin text-accent-500" />
          <span className="text-xs text-zinc-400">
            {generatingDiagram ? t('insights.generatingDiagram') : t('insights.compressing')}
          </span>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && !generatingDiagram && (
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-xl py-5 text-xs text-zinc-500 transition-colors flex flex-col items-center gap-1.5"
          >
            <ImagePlus size={18} />
            {t('insights.uploadImages')}
          </button>
          {hasContent && (
            <button
              onClick={onGenerateDiagram}
              disabled={generatingDiagram}
              className="flex-1 bg-zinc-900 border border-dashed border-accent-600/30 hover:border-accent-600/50 rounded-xl py-5 text-xs text-accent-400 transition-colors flex flex-col items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {t('insights.generateDiagram')}
            </button>
          )}
        </div>
      )}

      {/* Assets Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {images.map((img, index) => {
              const isDiagram = !!img.mermaidCode
              const url = imageUrls.get(img.id)
              const svg = diagramSvgs.get(img.id)

              return (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden group cursor-pointer',
                    isDiagram
                      ? 'bg-zinc-900 border border-zinc-800'
                      : 'bg-zinc-800'
                  )}
                  onClick={() => {
                    if (isDiagram) {
                      setPreviewDiagram(img)
                    } else if (url) {
                      setPreviewImage(url)
                    }
                  }}
                >
                  {isDiagram ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-hidden">
                      {svg ? (
                        <div
                          className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto scale-[0.6] origin-center"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      ) : (
                        <FileCode2 size={20} className="text-accent-400" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/90 to-transparent pt-4 pb-1.5 px-2">
                        <span className="text-[10px] text-accent-400 font-medium">
                          {img.mermaidCode!.split('\n')[0].split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  ) : url ? (
                    <img
                      src={url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}

                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(img.id) }}
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

      {/* Diagram Preview Modal */}
      {previewDiagram && previewDiagram.mermaidCode && (
        <DiagramPreview
          mermaidCode={previewDiagram.mermaidCode}
          name={previewDiagram.name}
          onClose={() => setPreviewDiagram(null)}
        />
      )}
    </div>
  )
}
