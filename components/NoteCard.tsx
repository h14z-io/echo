'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, FolderOpen, Lightbulb, Trash2 } from 'lucide-react'
import { cn, formatDuration, formatTimestamp, getTagColor } from '@/lib/utils'
import type { VoiceNote } from '@/types'

interface NoteCardProps {
  note: VoiceNote
  compact?: boolean
  index?: number
  onAction?: (action: 'folder' | 'insight' | 'delete', note: VoiceNote) => void
}

export default function NoteCard({ note, compact = false, index = 0, onAction }: NoteCardProps) {
  const summaryFirstLine = note.summary?.split('\n')[0] ?? null
  const visibleTags = note.tags.slice(0, 3)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleAction = (action: 'folder' | 'insight' | 'delete') => {
    setMenuOpen(false)
    onAction?.(action, note)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileTap={onAction ? undefined : { scale: 0.98 }}
      whileHover={onAction ? undefined : { scale: 1.01 }}
    >
      <div
        className={cn(
          'relative bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-200',
          compact ? 'p-3' : 'p-4'
        )}
      >
        <Link href={`/notes/${note.id}`} className="block">
          <div className={onAction ? 'pr-8' : ''}>
            <p className="text-sm font-medium text-zinc-50 truncate">
              {note.title || note.defaultTitle}
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-zinc-800 rounded-full px-2 py-0.5 text-[10px] text-zinc-400">
                {formatDuration(note.duration)}
              </span>
              <span className="text-xs text-zinc-500">
                {formatTimestamp(note.createdAt)}
              </span>
            </div>

            {!compact && summaryFirstLine && (
              <p className="text-xs text-zinc-400 mt-2 truncate">
                {summaryFirstLine}
              </p>
            )}

            {visibleTags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {visibleTags.map((tag) => {
                  const color = getTagColor(tag)
                  return (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </Link>

        {/* Context menu button */}
        {onAction && (
          <div ref={menuRef} className="absolute top-3 right-2">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl"
                >
                  <button
                    onClick={() => handleAction('folder')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <FolderOpen size={15} className="text-sky-400" />
                    Folder
                  </button>
                  <button
                    onClick={() => handleAction('insight')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <Lightbulb size={15} className="text-amber-400" />
                    Insight
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
