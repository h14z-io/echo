'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, MoreVertical, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Folder } from '@/types'

interface FolderCardProps {
  folder: Folder
  noteCount: number
  index?: number
  onDelete?: (folder: Folder) => void
}

export default function FolderCard({ folder, noteCount, index = 0, onDelete }: FolderCardProps) {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-200 border-l-4"
        style={{ borderLeftColor: folder.color }}
      >
        <Link href={`/folders/${folder.id}`} className="block">
          <div className={onDelete ? 'pr-8' : ''}>
            <div className="flex items-center gap-3">
              <FolderOpen size={18} style={{ color: folder.color }} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-50 truncate">
                  {folder.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                </p>
              </div>
            </div>
          </div>
        </Link>

        {onDelete && (
          <div ref={menuRef} className="absolute top-3 right-2">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); setConfirmDelete(false) }}
              aria-label="Folder options"
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
                  {confirmDelete ? (
                    <div className="px-3 py-2 space-y-2">
                      <p className="text-xs text-zinc-400">{t('folders.deleteConfirm')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setMenuOpen(false); setConfirmDelete(false); onDelete(folder) }}
                          className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                        >
                          {t('noteDetail.delete')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 rounded-lg bg-zinc-800 px-2 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                    >
                      <Trash2 size={15} />
                      {t('noteDetail.delete')}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
