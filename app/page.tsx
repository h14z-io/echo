'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { db } from '@/lib/db'
import RecordButton from '@/components/RecordButton'
import MicSelector from '@/components/MicSelector'
import NoteCard from '@/components/NoteCard'
import { useI18n } from '@/lib/i18n'
import type { VoiceNote } from '@/types'

const MoveToFolderModal = dynamic(() => import('@/components/MoveToFolderModal'))
const AddToInsightModal = dynamic(() => import('@/components/AddToInsightModal'))

export default function HomePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [recentNotes, setRecentNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)

  const [actionNote, setActionNote] = useState<VoiceNote | null>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showInsightModal, setShowInsightModal] = useState(false)

  useEffect(() => {
    let done = false
    db.notes.getRecent(5).then((notes) => {
      done = true
      setRecentNotes(notes)
      setLoading(false)
    }).catch(() => {
      done = true
      setLoading(false)
    })
    const timeout = setTimeout(() => {
      if (!done) setLoading(false)
    }, 4000)
    return () => clearTimeout(timeout)
  }, [])

  const handleAction = useCallback((action: 'folder' | 'insight' | 'delete', note: VoiceNote) => {
    if (action === 'folder') {
      setActionNote(note)
      setShowFolderModal(true)
    } else if (action === 'insight') {
      setActionNote(note)
      setShowInsightModal(true)
    } else if (action === 'delete') {
      db.notes.delete(note.id).then(() => {
        setRecentNotes((prev) => prev.filter((n) => n.id !== note.id))
      })
    }
  }, [])

  return (
    <div className="px-4 pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Echo" width={32} height={32} className="rounded-lg" priority />
          <h1 className="text-xl font-semibold text-zinc-50">{t('home.title')}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Settings size={20} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Record Button - Hero */}
      <div className="flex flex-col items-center gap-4 py-12">
        <RecordButton />
        <p className="text-sm text-zinc-500">{t('home.tapToRecord')}</p>
        <MicSelector />
      </div>

      {/* Recent Notes */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {t('home.recent')}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse"
              >
                <div className="h-4 bg-zinc-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">{t('home.noRecordings')}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {t('home.startHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                compact
                index={index}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFolderModal && actionNote && (
        <MoveToFolderModal
          noteId={actionNote.id}
          currentFolderId={actionNote.folderId}
          onClose={() => { setShowFolderModal(false); setActionNote(null) }}
          onMoved={(folderId) => {
            setRecentNotes((prev) => prev.map((n) => n.id === actionNote.id ? { ...n, folderId, updatedAt: Date.now() } : n))
          }}
        />
      )}
      {showInsightModal && actionNote && (
        <AddToInsightModal
          noteId={actionNote.id}
          currentInsightIds={actionNote.insightIds}
          onClose={() => { setShowInsightModal(false); setActionNote(null) }}
          onAdded={(insightId) => {
            setRecentNotes((prev) => prev.map((n) => n.id === actionNote.id ? { ...n, insightIds: [...n.insightIds, insightId], updatedAt: Date.now() } : n))
          }}
        />
      )}
    </div>
  )
}
