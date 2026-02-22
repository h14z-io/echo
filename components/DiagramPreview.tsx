'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Download, X, Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { renderMermaid, svgToBlob } from '@/lib/mermaid-theme'

interface DiagramPreviewProps {
  mermaidCode: string
  name: string
  onClose: () => void
}

const MIN_SCALE = 0.1
const MAX_SCALE = 10
const ZOOM_STEP = 0.3

export default function DiagramPreview({ mermaidCode, name, onClose }: DiagramPreviewProps) {
  const { t } = useI18n()
  const toast = useToast()
  const [svgContent, setSvgContent] = useState('')
  const [renderError, setRenderError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Pan & zoom state
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const translateStart = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef<number | null>(null)

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

  // Fit diagram to container on first render and fullscreen toggle
  useEffect(() => {
    if (!svgContent || !containerRef.current) return
    // Temporarily reset to scale=1 so we can measure natural SVG size
    setScale(1)
    setTranslate({ x: 0, y: 0 })
    const timer = setTimeout(() => {
      const container = containerRef.current
      const svg = container?.querySelector('svg')
      if (!container || !svg) return
      // Use the SVG's intrinsic dimensions (viewBox or width/height attributes)
      const viewBox = svg.getAttribute('viewBox')
      let svgW: number
      let svgH: number
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number)
        svgW = parts[2] || svg.getBoundingClientRect().width
        svgH = parts[3] || svg.getBoundingClientRect().height
      } else {
        svgW = svg.getBoundingClientRect().width
        svgH = svg.getBoundingClientRect().height
      }
      const containerW = container.clientWidth - 32
      const containerH = container.clientHeight - 32
      if (svgW > 0 && svgH > 0) {
        const fitScale = Math.min(containerW / svgW, containerH / svgH)
        setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale)))
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [svgContent, isFullscreen])

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))

  const zoomIn = () => setScale((s) => clampScale(s + ZOOM_STEP))
  const zoomOut = () => setScale((s) => clampScale(s - ZOOM_STEP))
  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }) }

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale((s) => clampScale(s + delta))
  }, [])

  // Mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    translateStart.current = { ...translate }
  }, [translate])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setTranslate({
      x: translateStart.current.x + (e.clientX - panStart.current.x),
      y: translateStart.current.y + (e.clientY - panStart.current.y),
    })
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Touch pan & pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true)
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      translateStart.current = { ...translate }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [translate])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setTranslate({
        x: translateStart.current.x + (e.touches[0].clientX - panStart.current.x),
        y: translateStart.current.y + (e.touches[0].clientY - panStart.current.y),
      })
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = (dist - lastPinchDist.current) * 0.005
      lastPinchDist.current = dist
      setScale((s) => clampScale(s + delta))
    }
  }, [isPanning])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
    lastPinchDist.current = null
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(mermaidCode)
    toast.success(t('common.copied'))
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

  const scalePercent = Math.round(scale * 100)

  const toggleFullscreen = () => {
    setIsFullscreen((f) => !f)
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col',
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-3xl max-h-[90vh] rounded-xl'
        )}
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
              onClick={toggleFullscreen}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title={isFullscreen ? t('insights.exitFullscreen') : t('insights.fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Diagram with pan & zoom */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderError ? (
            <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
              <p className="text-sm text-zinc-400">{t('insights.diagramRenderError')}</p>
              <pre className="text-xs text-zinc-600 bg-zinc-800 rounded-lg p-3 max-w-full overflow-x-auto whitespace-pre-wrap text-left">
                {mermaidCode}
              </pre>
            </div>
          ) : svgContent ? (
            <div
              ref={contentRef}
              className="w-full h-full flex items-center justify-center p-6"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <div
                className="[&_svg]:max-w-none [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-zinc-600" />
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        {svgContent && !renderError && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-zinc-800">
            <button
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors tabular-nums min-w-[3.5rem] text-center"
            >
              {scalePercent}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors ml-1"
              aria-label="Reset zoom"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
