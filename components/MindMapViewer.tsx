'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { MindMapVersion } from '@/types'

interface MindMapViewerProps {
  versions: MindMapVersion[]
  generating: boolean
  onGenerate: () => void
  hasContent: boolean
}

export default function MindMapViewer({
  versions,
  generating,
  onGenerate,
  hasContent,
}: MindMapViewerProps) {
  const { t } = useI18n()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showVersions, setShowVersions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [svgContent, setSvgContent] = useState('')
  const [renderError, setRenderError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentVersion = versions.length > 0 ? versions[versions.length - 1 - selectedIndex] : null

  const renderMermaid = useCallback(async (code: string) => {
    try {
      setRenderError(false)
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#a21caf',
          primaryTextColor: '#fafafa',
          primaryBorderColor: '#3f3f46',
          lineColor: '#71717a',
          secondaryColor: '#27272a',
          tertiaryColor: '#18181b',
          fontSize: '14px',
        },
      })
      const { svg } = await mermaid.render('mindmap-' + Date.now(), code)
      setSvgContent(svg)
    } catch (err) {
      console.error('Mermaid render error:', err)
      setRenderError(true)
      setSvgContent('')
    }
  }, [])

  useEffect(() => {
    if (currentVersion) {
      renderMermaid(currentVersion.mermaidCode)
    }
  }, [currentVersion, renderMermaid])

  const copyCode = () => {
    if (!currentVersion) return
    navigator.clipboard.writeText(currentVersion.mermaidCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadImage = async () => {
    if (!svgContent || !containerRef.current) return

    const svgEl = containerRef.current.querySelector('svg')
    if (!svgEl) return

    const canvas = document.createElement('canvas')
    const bbox = svgEl.getBoundingClientRect()
    const scale = 2
    canvas.width = bbox.width * scale
    canvas.height = bbox.height * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(scale, scale)
    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, bbox.width, bbox.height)

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, bbox.width, bbox.height)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = `mindmap-v${versions.length - selectedIndex}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = url
  }

  if (versions.length === 0 && !generating) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-accent-500 uppercase tracking-wider">
          {t('insights.mindMap')}
        </h2>
        {hasContent ? (
          <button
            onClick={onGenerate}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl py-4 text-sm text-zinc-400 transition-colors flex items-center justify-center gap-2"
          >
            <Network size={16} />
            {t('insights.generateMindMap')}
          </button>
        ) : (
          <p className="text-center text-sm text-zinc-500 py-4">
            {t('insights.addContentForMindMap')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-accent-500 uppercase tracking-wider">
          {t('insights.mindMap')}
        </h2>
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              <Network size={14} />
              {t('insights.newVersion')}
            </button>
          )}
        </div>
      </div>

      {generating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-accent-500" />
          <span className="text-sm text-zinc-400">{t('insights.generatingMindMap')}</span>
        </div>
      )}

      {currentVersion && !generating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Clock size={12} />
              v{versions.length - selectedIndex}
              <span className="text-zinc-600">
                ({new Date(currentVersion.createdAt).toLocaleDateString()})
              </span>
              {versions.length > 1 && (
                showVersions ? <ChevronUp size={12} /> : <ChevronDown size={12} />
              )}
            </button>
            <div className="flex items-center gap-1">
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
            </div>
          </div>

          {/* Copied feedback */}
          {copied && (
            <div className="px-3 py-1 bg-accent-600/20 text-accent-400 text-xs text-center">
              {t('common.copied')}
            </div>
          )}

          {/* Version list dropdown */}
          {showVersions && versions.length > 1 && (
            <div className="border-b border-zinc-800 max-h-32 overflow-y-auto">
              {versions.slice().reverse().map((version, i) => (
                <button
                  key={version.id}
                  onClick={() => { setSelectedIndex(i); setShowVersions(false) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors',
                    i === selectedIndex
                      ? 'bg-accent-600/10 text-accent-400'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  )}
                >
                  <span>v{versions.length - i}</span>
                  <span
                    className="text-zinc-600"
                    title={`${version.noteIds.length} notes, ${version.imageIds.length} images`}
                  >
                    {new Date(version.createdAt).toLocaleDateString()} - {version.noteIds.length}n / {version.imageIds.length}img
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Mermaid render */}
          <div
            ref={containerRef}
            className="p-4 overflow-x-auto flex justify-center min-h-[200px]"
          >
            {renderError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-zinc-400">{t('insights.mindMapRenderError')}</p>
                <pre className="mt-2 text-xs text-zinc-600 bg-zinc-800 rounded-lg p-3 max-w-full overflow-x-auto whitespace-pre-wrap">
                  {currentVersion.mermaidCode}
                </pre>
              </div>
            ) : svgContent ? (
              <div
                className="[&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <Loader2 size={20} className="animate-spin text-zinc-600 my-8" />
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
