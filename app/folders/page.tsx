'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import FolderCard from '@/components/FolderCard'
import type { Folder } from '@/types'

const PRESET_COLORS = [
  '#BB2649',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
]

export default function FoldersPage() {
  const { t } = useI18n()
  const [folders, setFolders] = useState<Folder[]>([])
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({})
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const fetchData = useCallback(async () => {
    const allFolders = await db.folders.getAll()
    const allNotes = await db.notes.getAll()
    const counts: Record<string, number> = {}
    allFolders.forEach((f) => {
      counts[f.id] = allNotes.filter((n) => n.folderId === f.id).length
    })
    setFolders(allFolders.sort((a, b) => b.createdAt - a.createdAt))
    setNoteCounts(counts)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = useCallback(async (folder: Folder) => {
    await db.folders.delete(folder.id)
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return

    const folder: Folder = {
      id: generateId(),
      name: trimmed,
      color: newColor,
      createdAt: Date.now(),
    }
    await db.folders.put(folder)
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setShowModal(false)
    fetchData()
  }

  return (
    <div className="px-4 pt-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-50">{t('folders.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          aria-label="Create folder"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <Plus size={18} className="text-zinc-300" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {folders.map((folder, index) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            noteCount={noteCounts[folder.id] ?? 0}
            index={index}
            onDelete={handleDelete}
          />
        ))}

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: folders.length * 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="w-full border border-dashed border-zinc-700 rounded-xl p-4 text-sm text-zinc-500 hover:text-zinc-400 hover:border-zinc-600 transition-colors"
        >
          {t('folders.createNew')}
        </motion.button>
      </div>

      {/* Create folder modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-50">
                  {t('folders.newFolder')}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>

              <input
                type="text"
                placeholder={t('folders.folderName')}
                aria-label={t('folders.folderName')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none"
              />

              <div className="flex items-center gap-3 mt-4">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      outline: newColor === color ? '2px solid white' : 'none',
                      outlineOffset: '2px',
                      transform: newColor === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="w-full mt-5 bg-accent-600 hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {t('folders.createFolder')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
