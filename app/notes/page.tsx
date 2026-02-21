'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { db } from '@/lib/db'
import { cn, getTagColor } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import NoteCard from '@/components/NoteCard'
import type { VoiceNote } from '@/types'

const MoveToFolderModal = dynamic(() => import('@/components/MoveToFolderModal'))
const AddToInsightModal = dynamic(() => import('@/components/AddToInsightModal'))

export default function NotesPage() {
  const { t } = useI18n()
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const [actionNote, setActionNote] = useState<VoiceNote | null>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showInsightModal, setShowInsightModal] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch notes based on search query
  useEffect(() => {
    const fetchNotes = async () => {
      const results = debouncedQuery
        ? await db.notes.search(debouncedQuery)
        : await db.notes.getAll()
      setNotes(results.sort((a, b) => b.createdAt - a.createdAt))
    }
    fetchNotes()
  }, [debouncedQuery])

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach((note) => note.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [notes])

  // Toggle a tag filter
  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }, [])

  // Filter notes by active tags (AND logic)
  const filteredNotes = useMemo(() => {
    if (activeTags.size === 0) return notes
    return notes.filter((note) =>
      Array.from(activeTags).every((tag) => note.tags.includes(tag))
    )
  }, [notes, activeTags])

  const handleAction = useCallback((action: 'folder' | 'insight' | 'delete', note: VoiceNote) => {
    if (action === 'folder') {
      setActionNote(note)
      setShowFolderModal(true)
    } else if (action === 'insight') {
      setActionNote(note)
      setShowInsightModal(true)
    } else if (action === 'delete') {
      db.notes.delete(note.id).then(() => {
        setNotes((prev) => prev.filter((n) => n.id !== note.id))
      })
    }
  }, [])

  return (
    <div className="px-4 pt-4 pb-20">
      <h1 className="text-xl font-semibold text-zinc-50">{t('notes.title')}</h1>

      <div className="relative mt-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          placeholder={t('notes.search')}
          aria-label={t('notes.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none transition-colors"
        />
      </div>

      {allTags.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allTags.map((tag) => {
            const isActive = activeTags.has(tag)
            const color = getTagColor(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  isActive && 'bg-accent-600/20 text-accent-400 border border-accent-600/30'
                )}
                style={isActive ? undefined : { backgroundColor: color.bg, color: color.text }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-zinc-500 py-12"
          >
            {t('notes.noNotes')}
          </motion.p>
        ) : (
          filteredNotes.map((note, index) => (
            <NoteCard key={note.id} note={note} index={index} onAction={handleAction} />
          ))
        )}
      </div>

      {/* Modals */}
      {showFolderModal && actionNote && (
        <MoveToFolderModal
          noteId={actionNote.id}
          currentFolderId={actionNote.folderId}
          onClose={() => { setShowFolderModal(false); setActionNote(null) }}
          onMoved={(folderId) => {
            setNotes((prev) => prev.map((n) => n.id === actionNote.id ? { ...n, folderId, updatedAt: Date.now() } : n))
          }}
        />
      )}
      {showInsightModal && actionNote && (
        <AddToInsightModal
          noteId={actionNote.id}
          currentInsightIds={actionNote.insightIds}
          onClose={() => { setShowInsightModal(false); setActionNote(null) }}
          onAdded={(insightId) => {
            setNotes((prev) => prev.map((n) => n.id === actionNote.id ? { ...n, insightIds: [...n.insightIds, insightId], updatedAt: Date.now() } : n))
          }}
        />
      )}
    </div>
  )
}
