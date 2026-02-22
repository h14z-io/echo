'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Download, X, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { renderMermaid, svgToBlob } from '@/lib/mermaid-theme'

interface DiagramPreviewProps {
  mermaidCode: string
  name: string
  onClose: () => void
}

export default function DiagramPreview({ mermaidCode, name, onClose }: DiagramPreviewProps) {
  const { t } = useI18n()
  const [svgContent, setSvgContent] = useState('')
  const [renderError, setRenderError] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    renderMermaid(mermaidCode).then((result) => {
      if (result.svg) {
        setSvgContent(result.svg)
        setRenderError(false)
      } else {
        setRenderError(true)
      }
    })
  }, [mermaidCode])

  const copyCode = () => {
    navigator.clipboard.writeText(mermaidCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadImage = async () => {
    if (!svgContent) return
    try {
      const blob = await svgToBlob(svgContent, containerRef.current || undefined)
      const link = document.createElement('a')
      link.download = `${name.replace(/[^a-z0-9]/gi, '-')}.png`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="text-sm text-zinc-300 truncate pr-4">{name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={copyCode}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title={t('insights.copyMermaidCode')}
            >
              <Copy size={14} />
            </button>
            <button
              onClick={downloadImage}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title={t('insights.downloadImage')}
            >
              <Download size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {copied && (
          <div className="px-3 py-1 bg-accent-600/20 text-accent-400 text-xs text-center">
            {t('common.copied')}
          </div>
        )}

        {/* Diagram */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-6 flex justify-center items-start"
        >
          {renderError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-zinc-400">{t('insights.diagramRenderError')}</p>
              <pre className="text-xs text-zinc-600 bg-zinc-800 rounded-lg p-3 max-w-full overflow-x-auto whitespace-pre-wrap text-left">
                {mermaidCode}
              </pre>
            </div>
          ) : svgContent ? (
            <div
              className="[&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <Loader2 size={20} className="animate-spin text-zinc-600 my-16" />
          )}
        </div>
      </motion.div>
    </div>
  )
}
