'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/db'
import { useI18n } from '@/lib/i18n'
import NoteCard from '@/components/NoteCard'
import type { Folder, VoiceNote } from '@/types'

export default function FolderDetailPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const folderId = params.id as string

  const [folder, setFolder] = useState<Folder | null>(null)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchData = useCallback(async () => {
    const f = await db.folders.get(folderId)
    if (!f) {
      router.push('/folders')
      return
    }
    setFolder(f)
    setEditName(f.name)
    const folderNotes = await db.notes.getByFolder(folderId)
    setNotes(folderNotes.sort((a, b) => b.createdAt - a.createdAt))
  }, [folderId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRename = async () => {
    if (!folder || !editName.trim()) return
    await db.folders.put({ ...folder, name: editName.trim() })
    setFolder({ ...folder, name: editName.trim() })
    setEditing(false)
  }

  const handleDelete = async () => {
    await db.folders.delete(folderId)
    router.push('/folders')
  }

  if (!folder) return null

  return (
    <div className="px-4 pt-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/folders')}
            aria-label="Go back"
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </button>

          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setEditing(false)
              }}
              onBlur={handleRename}
              autoFocus
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-zinc-50 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none min-w-0"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              <h1 className="text-xl font-semibold text-zinc-50 truncate">
                {folder.name}
              </h1>
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical size={18} className="text-zinc-400" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-10 shadow-xl"
              >
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setEditing(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Pencil size={14} />
                  {t('folders.editName')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteConfirm(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 size={14} />
                  {t('folders.deleteFolder')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notes list */}
      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-sm text-zinc-500">{t('folders.noNotes')}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {t('folders.addFromDetail')}
            </p>
          </motion.div>
        ) : (
          notes.map((note, index) => (
            <NoteCard key={note.id} note={note} index={index} />
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <h2 className="text-base font-semibold text-zinc-50">
                {t('folders.deleteFolder')}?
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                {t('folders.confirmDelete')}
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
