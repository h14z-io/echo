'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MoreVertical, ChevronDown, Loader2, Copy, Check, FolderOpen, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { processRecording } from '@/lib/gemini'
import { formatTimestamp, formatDuration } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import AudioPlayer from '@/components/AudioPlayer'
import TagChips from '@/components/TagChips'
import MoveToFolderModal from '@/components/MoveToFolderModal'
import AddToInsightModal from '@/components/AddToInsightModal'
import type { VoiceNote } from '@/types'

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { t, locale } = useI18n()
  const [note, setNote] = useState<VoiceNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedTranscript, setCopiedTranscript] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showInsightModal, setShowInsightModal] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const result = await db.notes.get(id)
        if (result) {
          setNote(result)
          setEditTitle(result.title)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchNote()
  }, [id])

  // Poll for updates while transcribing
  useEffect(() => {
    if (!note || note.status !== 'transcribing') return
    const interval = setInterval(async () => {
      const updated = await db.notes.get(id)
      if (updated && updated.status !== 'transcribing') {
        // Preserve the original audioBlob reference to avoid blob URL invalidation
        setNote((prev) => prev ? { ...updated, audioBlob: prev.audioBlob } : updated)
        setEditTitle(updated.title)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [id, note?.status])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [menuOpen])

  const saveTitle = useCallback(async () => {
    if (!note) return
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== note.title) {
      const updated = { ...note, title: trimmed, updatedAt: Date.now() }
      await db.notes.put(updated)
      setNote(updated)
    } else {
      setEditTitle(note.title)
    }
    setIsEditingTitle(false)
  }, [note, editTitle])

  const handleDelete = useCallback(async () => {
    if (!note) return
    const confirmed = window.confirm('Are you sure you want to delete this note?')
    if (confirmed) {
      await db.notes.delete(note.id)
      router.push('/notes')
    }
    setMenuOpen(false)
  }, [note, router])

  const handleTagsChange = useCallback(async (newTags: string[]) => {
    if (!note) return
    const updated = { ...note, tags: newTags, updatedAt: Date.now() }
    await db.notes.put(updated)
    setNote(updated)
  }, [note])

  const handleRetry = useCallback(async () => {
    if (!note) return
    setRetrying(true)
    try {
      const result = await processRecording(note.audioBlob, locale)
      const updated: VoiceNote = {
        ...note,
        title: result.title,
        transcription: result.transcription,
        summary: result.summary,
        tags: result.tags,
        status: 'ready',
        updatedAt: Date.now(),
      }
      await db.notes.put(updated)
      setNote(updated)
      setEditTitle(result.title)
    } catch {
      // retry failed silently
    } finally {
      setRetrying(false)
    }
  }, [note, locale])

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  // 404 state
  if (notFound || !note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-zinc-50">{t('noteDetail.notFound')}</p>
        <p className="text-sm text-zinc-400">{t('noteDetail.notFoundDesc')}</p>
        <Link
          href="/notes"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          {t('noteDetail.backToNotes')}
        </Link>
      </div>
    )
  }

  const isTranscribing = note.status === 'transcribing'
  const isError = note.status === 'error'

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/notes"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-800"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </Link>
          <h1 className="text-lg font-semibold text-zinc-50">{t('noteDetail.title')}</h1>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-800"
          >
            <MoreVertical size={20} className="text-zinc-400" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl"
              >
                <button
                  onClick={() => { setMenuOpen(false); setShowFolderModal(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <FolderOpen size={16} className="text-zinc-500" />
                  {t('noteDetail.moveToFolder')}
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setShowInsightModal(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <Lightbulb size={16} className="text-zinc-500" />
                  {t('noteDetail.addToInsight')}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                >
                  {t('noteDetail.delete')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title + Metadata */}
        <div>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') {
                  setEditTitle(note.title)
                  setIsEditingTitle(false)
                }
              }}
              autoFocus
              className="w-full bg-transparent text-xl font-semibold text-zinc-50 outline-none border-b border-accent-600 pb-1"
            />
          ) : (
            <h2
              onClick={() => {
                setIsEditingTitle(true)
                setTimeout(() => titleInputRef.current?.focus(), 0)
              }}
              className="cursor-pointer text-xl font-semibold text-zinc-50 transition-colors hover:text-accent-400"
            >
              {note.title}
            </h2>
          )}
          <p className="mt-1 text-sm text-zinc-500">
            {formatTimestamp(note.createdAt)} · {formatDuration(note.duration)}
          </p>
        </div>

        {/* Audio Player */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <AudioPlayer audioBlob={note.audioBlob} duration={note.duration} />
        </motion.div>

        {/* Status: Transcribing */}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-500">{t('noteDetail.aiSummary')}</p>
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-500">{t('noteDetail.transcript')}</p>
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Status: Error */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center"
          >
            <p className="mb-3 text-sm text-red-400">
              {t('noteDetail.processingFailed')}
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
            >
              {retrying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('noteDetail.retrying')}
                </>
              ) : (
                t('noteDetail.retry')
              )}
            </button>
          </motion.div>
        )}

        {/* AI Summary */}
        {note.summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={() => setSummaryOpen(!summaryOpen)}
                className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-accent-500"
              >
                {t('noteDetail.aiSummary')}
                <motion.span
                  animate={{ rotate: summaryOpen ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(note.summary || '')
                  setCopiedSummary(true)
                  setTimeout(() => setCopiedSummary(false), 2000)
                }}
                className="ml-auto p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copiedSummary ? (
                  <span className="flex items-center gap-1 text-xs text-accent-400">
                    <Check size={14} />
                    {t('noteDetail.copied')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Copy size={14} />
                    {t('noteDetail.copy')}
                  </span>
                )}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {summaryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-sm leading-relaxed text-zinc-300">{note.summary}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Transcript */}
        {note.transcription && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-accent-500">
                {t('noteDetail.transcript')}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(note.transcription || '')
                  setCopiedTranscript(true)
                  setTimeout(() => setCopiedTranscript(false), 2000)
                }}
                className="ml-auto p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copiedTranscript ? (
                  <span className="flex items-center gap-1 text-xs text-accent-400">
                    <Check size={14} />
                    {t('noteDetail.copied')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Copy size={14} />
                    {t('noteDetail.copy')}
                  </span>
                )}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {note.transcription}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tags */}
        {(note.tags.length > 0 || note.status === 'ready') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-500">
              {t('noteDetail.tags')}
            </p>
            <TagChips tags={note.tags} onChange={handleTagsChange} />
          </motion.div>
        )}
      </div>

      {/* Move to Folder Modal */}
      {showFolderModal && (
        <MoveToFolderModal
          noteId={note.id}
          currentFolderId={note.folderId}
          onClose={() => setShowFolderModal(false)}
          onMoved={(folderId) => setNote({ ...note, folderId, updatedAt: Date.now() })}
        />
      )}

      {/* Add to Insight Modal */}
      {showInsightModal && (
        <AddToInsightModal
          noteId={note.id}
          currentInsightIds={note.insightIds}
          onClose={() => setShowInsightModal(false)}
          onAdded={(insightId) => setNote({ ...note, insightIds: [...note.insightIds, insightId], updatedAt: Date.now() })}
        />
      )}
    </div>
  )
}
