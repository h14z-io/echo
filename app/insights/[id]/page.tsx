'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  X,
  Search,
  RefreshCw,
  Copy,
  Trash2,
  Loader2,
  Send,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react'
import { db } from '@/lib/db'
import { formatTimestamp, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { generateInsightAnalysis, askInsightQuestion } from '@/lib/gemini'
import type { Insight, VoiceNote, InsightContent } from '@/types'

export default function InsightDetailPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [insight, setInsight] = useState<Insight | null>(null)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAddNotes, setShowAddNotes] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [askInput, setAskInput] = useState('')
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [copied, setCopied] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const loadInsight = useCallback(async () => {
    const data = await db.insights.get(id)
    if (!data) {
      router.push('/insights')
      return
    }
    setInsight(data)
    setNameValue(data.name)

    if (data.noteIds.length > 0) {
      const allNotes = await db.notes.getAll()
      setNotes(allNotes.filter((n) => data.noteIds.includes(n.id)))
    } else {
      setNotes([])
    }
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    loadInsight()
  }, [loadInsight])

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  const saveName = async () => {
    if (!insight || !nameValue.trim()) return
    const updated = { ...insight, name: nameValue.trim(), updatedAt: Date.now() }
    await db.insights.put(updated)
    setInsight(updated)
    setEditingName(false)
  }

  const handleGenerate = async () => {
    if (!insight || notes.length === 0) return
    setGenerating(true)
    try {
      const noteData = notes
        .filter((n) => n.transcription)
        .map((n) => ({
          date: n.createdAt,
          title: n.title || n.defaultTitle,
          transcription: n.transcription!,
        }))

      if (noteData.length === 0) {
        alert('No transcribed notes to analyze')
        setGenerating(false)
        return
      }

      const result = await generateInsightAnalysis(noteData, locale)

      const generatedContent: InsightContent = {
        summary: result.summary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
        timeline: result.timeline.map((t) => ({
          date: new Date(t.date).getTime() || Date.now(),
          noteId: '',
          event: t.event,
        })),
        customSections: insight.generatedContent?.customSections || [],
      }

      const updated: Insight = {
        ...insight,
        generatedContent,
        lastGeneratedAt: Date.now(),
        updatedAt: Date.now(),
      }
      await db.insights.put(updated)
      setInsight(updated)
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Failed to generate insights. Check your API key and try again.')
    }
    setGenerating(false)
  }

  const handleAsk = async () => {
    if (!insight || !askInput.trim() || notes.length === 0) return
    setAskingQuestion(true)
    try {
      const noteData = notes
        .filter((n) => n.transcription)
        .map((n) => ({
          date: n.createdAt,
          title: n.title || n.defaultTitle,
          transcription: n.transcription!,
        }))

      const answer = await askInsightQuestion(noteData, insight.name, askInput.trim(), locale)

      const customSection = {
        prompt: askInput.trim(),
        content: answer,
        generatedAt: Date.now(),
      }

      const existingSections = insight.generatedContent?.customSections || []
      const generatedContent: InsightContent = insight.generatedContent
        ? { ...insight.generatedContent, customSections: [...existingSections, customSection] }
        : {
            summary: '',
            keyPoints: [],
            actionItems: [],
            timeline: [],
            customSections: [customSection],
          }

      const updated: Insight = {
        ...insight,
        generatedContent,
        updatedAt: Date.now(),
      }
      await db.insights.put(updated)
      setInsight(updated)
      setAskInput('')
    } catch (err) {
      console.error('Question failed:', err)
      alert('Failed to get answer. Check your API key and try again.')
    }
    setAskingQuestion(false)
  }

  const handleDelete = async () => {
    if (!insight) return
    await db.insights.delete(insight.id)
    router.push('/insights')
  }

  const copyAsMarkdown = () => {
    if (!insight?.generatedContent) return

    const gc = insight.generatedContent
    let md = `# ${insight.name}\n\n`

    if (gc.summary) {
      md += `## Summary\n${gc.summary}\n\n`
    }

    if (gc.keyPoints.length > 0) {
      md += `## Key Points\n${gc.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
    }

    if (gc.actionItems.length > 0) {
      md += `## Action Items\n${gc.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n`
    }

    if (gc.timeline.length > 0) {
      md += `## Timeline\n${gc.timeline.map((t) => `- ${new Date(t.date).toLocaleDateString()}: ${t.event}`).join('\n')}\n\n`
    }

    if (gc.customSections.length > 0) {
      md += `## Custom Analysis\n`
      gc.customSections.forEach((s) => {
        md += `### ${s.prompt}\n${s.content}\n\n`
      })
    }

    navigator.clipboard.writeText(md.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 space-y-4">
        <div className="h-8 bg-zinc-800 rounded w-1/3 animate-pulse" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-2/3 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-full mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!insight) return null

  const gc = insight.generatedContent

  return (
    <div className="px-4 pt-4 pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/insights')}
          className="p-1 -ml-1 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') {
                  setNameValue(insight.name)
                  setEditingName(false)
                }
              }}
              className="w-full bg-transparent text-xl font-semibold text-zinc-50 outline-none border-b border-accent-600"
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-xl font-semibold text-zinc-50 truncate cursor-pointer"
            >
              {insight.name}
            </h1>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-50 w-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                {gc && (
                  <button
                    onClick={() => { handleGenerate(); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw size={16} />
                    {t('insights.regenerate')}
                  </button>
                )}
                {gc && (
                  <button
                    onClick={() => { copyAsMarkdown(); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Copy size={16} />
                    {copied ? t('common.copied') : t('insights.copyMarkdown')}
                  </button>
                )}
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 size={16} />
                  {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-accent-500 uppercase tracking-wider">
            Notes ({insight.noteIds.length})
          </h2>
          <button
            onClick={() => setShowAddNotes(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Plus size={14} />
            {t('insights.addNotes')}
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-zinc-500">{t('insights.noNotesAdded')}</p>
            <button
              onClick={() => setShowAddNotes(true)}
              className="mt-2 text-xs text-accent-400 hover:text-accent-300 transition-colors"
            >
              {t('insights.addNotesToInsight')}
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {note.title || note.defaultTitle}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatTimestamp(note.createdAt)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const updatedNoteIds = insight.noteIds.filter((nid) => nid !== note.id)
                    const updatedInsight = { ...insight, noteIds: updatedNoteIds, updatedAt: Date.now() }
                    await db.insights.put(updatedInsight)

                    const updatedNote = {
                      ...note,
                      insightIds: note.insightIds.filter((iid) => iid !== insight.id),
                      updatedAt: Date.now(),
                    }
                    await db.notes.put(updatedNote)

                    setInsight(updatedInsight)
                    setNotes((prev) => prev.filter((n) => n.id !== note.id))
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Content */}
      {generating ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-4/5" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin text-accent-500" />
            <span className="text-sm text-zinc-400">{t('insights.generating')}</span>
          </div>
        </div>
      ) : gc ? (
        <div className="space-y-4">
          {/* Summary */}
          {gc.summary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                {t('insights.summary')}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{gc.summary}</p>
            </motion.div>
          )}

          {/* Key Points */}
          {gc.keyPoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                {t('insights.keyPoints')}
              </h3>
              <ul className="space-y-2">
                {gc.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Action Items */}
          {gc.actionItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                {t('insights.actionItems')}
              </h3>
              <ul className="space-y-2">
                {gc.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Circle size={14} className="mt-0.5 text-zinc-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Timeline */}
          {gc.timeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                {t('insights.timeline')}
              </h3>
              <div className="relative pl-4">
                <div className="absolute left-[5px] top-1 bottom-1 w-px bg-zinc-700" />
                <div className="space-y-4">
                  {gc.timeline.map((entry, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className="absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-500 border-2 border-zinc-900" />
                      <div>
                        <p className="text-xs text-zinc-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-zinc-300">{entry.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom Sections */}
          {gc.customSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <h3 className="text-xs font-medium text-accent-400 mb-2">
                {section.prompt}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-8">
          {notes.length > 0 ? (
            <button
              onClick={handleGenerate}
              className="w-full bg-accent-600 hover:bg-accent-700 text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {t('insights.generateInsights')}
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              {t('insights.addNotesToGenerate')}
            </p>
          )}
        </div>
      )}

      {/* Ask Anything */}
      {insight.noteIds.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('insights.askAnything')}
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !askingQuestion && handleAsk()}
            disabled={askingQuestion}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleAsk}
            disabled={!askInput.trim() || askingQuestion}
            className="p-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {askingQuestion ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      )}

      {/* Add Notes Modal */}
      {showAddNotes && (
        <AddNotesModal
          insightId={insight.id}
          currentNoteIds={insight.noteIds}
          onClose={() => setShowAddNotes(false)}
          onSave={async (selectedIds) => {
            const addedIds = selectedIds.filter((sid) => !insight.noteIds.includes(sid))
            const removedIds = insight.noteIds.filter((nid) => !selectedIds.includes(nid))

            const updatedInsight = { ...insight, noteIds: selectedIds, updatedAt: Date.now() }
            await db.insights.put(updatedInsight)

            for (const nid of addedIds) {
              const note = await db.notes.get(nid)
              if (note) {
                await db.notes.put({
                  ...note,
                  insightIds: [...note.insightIds, insight.id],
                  updatedAt: Date.now(),
                })
              }
            }

            for (const nid of removedIds) {
              const note = await db.notes.get(nid)
              if (note) {
                await db.notes.put({
                  ...note,
                  insightIds: note.insightIds.filter((iid) => iid !== insight.id),
                  updatedAt: Date.now(),
                })
              }
            }

            setInsight(updatedInsight)
            const allNotes = await db.notes.getAll()
            setNotes(allNotes.filter((n) => selectedIds.includes(n.id)))
            setShowAddNotes(false)
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-zinc-50">{t('insights.deleteInsight')}</h2>
            <p className="text-sm text-zinc-400">
              {t('insights.confirmDelete', { name: insight.name })}
            </p>
            <div className="flex gap-3">
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
        </div>
      )}
    </div>
  )
}

// Add Notes Modal Component
function AddNotesModal({
  insightId,
  currentNoteIds,
  onClose,
  onSave,
}: {
  insightId: string
  currentNoteIds: string[]
  onClose: () => void
  onSave: (selectedIds: string[]) => void
}) {
  const { t } = useI18n()
  const [allNotes, setAllNotes] = useState<VoiceNote[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(currentNoteIds)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.notes.getAll().then((notes) => {
      setAllNotes(notes.sort((a, b) => b.createdAt - a.createdAt))
      setLoading(false)
    })
  }, [])

  const filtered = searchQuery.trim()
    ? allNotes.filter((n) =>
        (n.title || n.defaultTitle).toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.transcription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNotes

  const toggleNote = (noteId: string) => {
    setSelectedIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-50">{t('insights.addNotes')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={t('insights.searchNotes')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              {searchQuery ? t('insights.noNotesFound') : t('insights.noNotesAvailable')}
            </p>
          ) : (
            filtered.map((note) => {
              const isSelected = selectedIds.includes(note.id)
              return (
                <button
                  key={note.id}
                  onClick={() => toggleNote(note.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'bg-accent-600/10 border border-accent-600/30'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  )}
                >
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckCircle2 size={18} className="text-accent-500" />
                    ) : (
                      <Circle size={18} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {note.title || note.defaultTitle}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatTimestamp(note.createdAt)}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => onSave(selectedIds)}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {t('insights.save')} ({selectedIds.length === 1 ? t('common.nNote', { count: 1 }) : t('common.nNotes', { count: selectedIds.length })})
          </button>
        </div>
      </motion.div>
    </div>
  )
}
