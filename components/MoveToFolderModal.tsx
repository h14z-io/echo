'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Plus, X, Loader2 } from 'lucide-react'
import { db } from '@/lib/db'
import { generateId, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { Folder } from '@/types'

interface MoveToFolderModalProps {
  noteId: string
  currentFolderId: string | null
  onClose: () => void
  onMoved: (folderId: string | null) => void
}

export default function MoveToFolderModal({
  noteId,
  currentFolderId,
  onClose,
  onMoved,
}: MoveToFolderModalProps) {
  const { t } = useI18n()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    db.folders.getAll().then((f) => {
      setFolders(f.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })
  }, [])

  const moveToFolder = async (folderId: string | null) => {
    const note = await db.notes.get(noteId)
    if (!note) return
    const updated = { ...note, folderId, updatedAt: Date.now() }
    await db.notes.put(updated)
    onMoved(folderId)
    onClose()
  }

  const createAndMove = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const folder: Folder = {
      id: generateId(),
      name,
      color: '#BB2649',
      createdAt: Date.now(),
    }
    await db.folders.put(folder)
    await moveToFolder(folder.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-20" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="folder-modal-title"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl mx-4"
        style={{ maxHeight: '60vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 id="folder-modal-title" className="text-lg font-semibold text-zinc-50">{t('noteDetail.selectFolder')}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(60vh - 64px)' }}>
          {/* Remove from folder option */}
          {currentFolderId && (
            <button
              onClick={() => moveToFolder(null)}
              className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
              {t('noteDetail.removeFromFolder')}
            </button>
          )}

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => moveToFolder(folder.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm transition-colors',
                    currentFolderId === folder.id
                      ? 'bg-accent-600/10 text-accent-400 border border-accent-600/30'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  )}
                >
                  <FolderOpen size={16} style={{ color: folder.color }} />
                  {folder.name}
                </button>
              ))}

              {/* Create new folder - always visible */}
              {showCreate ? (
                <div className="flex items-center gap-2 px-3 py-2 mt-1">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAndMove()}
                    placeholder={t('folders.folderName')}
                    autoFocus
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 outline-none"
                  />
                  <button
                    onClick={createAndMove}
                    disabled={!newFolderName.trim()}
                    className="bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {t('folders.createFolder')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm text-accent-400 hover:bg-zinc-800 transition-colors mt-1 border border-dashed border-zinc-700"
                >
                  <Plus size={16} />
                  {t('noteDetail.createNewFolder')}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
