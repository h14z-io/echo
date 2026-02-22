'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Plus, X, Loader2 } from 'lucide-react'
import { db } from '@/lib/db'
import { generateId, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
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
  const toast = useToast()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    db.folders.getAll().then((f) => {
      setFolders(f.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })
  }, [])

  const moveToFolder = async (folderId: string | null) => {
    if (saving) return
    setSaving(true)
    setSavingId(folderId ?? '__none__')

    try {
      const note = await db.notes.get(noteId)
      if (!note) return
      const updated = { ...note, folderId, updatedAt: Date.now() }
      await db.notes.put(updated)
      if (folderId === null) {
        toast.success(t('noteDetail.removedFromFolder'))
      } else {
        const folder = folders.find(f => f.id === folderId)
        toast.success(t('noteDetail.movedToFolder', { name: folder?.name || '' }))
      }
      onMoved(folderId)
      onClose()
    } catch {
      setSaving(false)
      setSavingId(null)
    }
  }

  const createAndMove = async () => {
    const name = newFolderName.trim()
    if (!name || saving) return
    setSaving(true)
    setSavingId('__new__')

    try {
      const folder: Folder = {
        id: generateId(),
        name,
        color: '#BB2649',
        createdAt: Date.now(),
      }
      await db.folders.put(folder)
      await moveToFolder(folder.id)
    } catch {
      setSaving(false)
      setSavingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-20" onClick={saving ? undefined : onClose}>
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
          <button onClick={onClose} disabled={saving} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(60vh - 64px)' }}>
          {/* Remove from folder option */}
          {currentFolderId && (
            <button
              onClick={() => moveToFolder(null)}
              disabled={saving}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm transition-colors',
                saving ? 'text-zinc-500 cursor-not-allowed' : 'text-zinc-400 hover:bg-zinc-800'
              )}
            >
              {savingId === '__none__' ? (
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              ) : (
                <X size={16} />
              )}
              {t('noteDetail.removeFromFolder')}
            </button>
          )}

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {folders.map((folder) => {
                const isCurrent = currentFolderId === folder.id
                const isSaving = savingId === folder.id
                return (
                  <button
                    key={folder.id}
                    onClick={() => moveToFolder(folder.id)}
                    disabled={saving}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm transition-colors',
                      isCurrent
                        ? 'bg-accent-600/10 text-accent-400 border border-accent-600/30'
                        : saving
                          ? 'text-zinc-500 cursor-not-allowed'
                          : 'text-zinc-300 hover:bg-zinc-800'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin text-accent-400" />
                    ) : (
                      <FolderOpen size={16} style={{ color: folder.color }} />
                    )}
                    {folder.name}
                  </button>
                )
              })}

              {/* Create new folder - always visible */}
              {showCreate ? (
                <div className="flex items-center gap-2 px-3 py-2 mt-1">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAndMove()}
                    placeholder={t('folders.folderName')}
                    disabled={saving}
                    autoFocus
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={createAndMove}
                    disabled={!newFolderName.trim() || saving}
                    className="bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    {savingId === '__new__' && <Loader2 size={14} className="animate-spin" />}
                    {t('folders.createFolder')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  disabled={saving}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm text-accent-400 hover:bg-zinc-800 transition-colors mt-1 border border-dashed border-zinc-700 disabled:opacity-40"
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
