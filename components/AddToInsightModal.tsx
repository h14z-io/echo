'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Plus, X, Check, Loader2 } from 'lucide-react'
import { db } from '@/lib/db'
import { generateId, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { Insight } from '@/types'

interface AddToInsightModalProps {
  noteId: string
  currentInsightIds: string[]
  onClose: () => void
  onAdded: (insightId: string) => void
}

export default function AddToInsightModal({
  noteId,
  currentInsightIds,
  onClose,
  onAdded,
}: AddToInsightModalProps) {
  const { t } = useI18n()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [newInsightName, setNewInsightName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    db.insights.getAll().then((i) => {
      setInsights(i.sort((a, b) => b.updatedAt - a.updatedAt))
      setLoading(false)
    })
  }, [])

  const addToInsight = async (insight: Insight) => {
    if (insight.noteIds.includes(noteId)) return

    const updatedInsight = {
      ...insight,
      noteIds: [...insight.noteIds, noteId],
      updatedAt: Date.now(),
    }
    await db.insights.put(updatedInsight)

    const note = await db.notes.get(noteId)
    if (!note) return
    const updatedNote = {
      ...note,
      insightIds: [...note.insightIds, insight.id],
      updatedAt: Date.now(),
    }
    await db.notes.put(updatedNote)
    onAdded(insight.id)
    onClose()
  }

  const createAndAdd = async () => {
    const name = newInsightName.trim()
    if (!name) return
    const insight: Insight = {
      id: generateId(),
      name,
      noteIds: [],
      imageIds: [],
      generatedContent: null,
      lastGeneratedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.insights.put(insight)
    await addToInsight(insight)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-20" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insight-modal-title"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl mx-4"
        style={{ maxHeight: '60vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 id="insight-modal-title" className="text-lg font-semibold text-zinc-50">{t('noteDetail.selectInsight')}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(60vh - 64px)' }}>
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {insights.map((insight) => {
                const alreadyAdded = currentInsightIds.includes(insight.id)
                return (
                  <button
                    key={insight.id}
                    onClick={() => !alreadyAdded && addToInsight(insight)}
                    disabled={alreadyAdded}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm transition-colors',
                      alreadyAdded
                        ? 'bg-accent-600/10 text-accent-400 border border-accent-600/30 cursor-default'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    )}
                  >
                    <Lightbulb size={16} className={alreadyAdded ? 'text-accent-400' : 'text-zinc-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{insight.name}</p>
                      {alreadyAdded && (
                        <p className="text-xs text-accent-500 mt-0.5">{t('noteDetail.alreadyInInsight')}</p>
                      )}
                    </div>
                    {alreadyAdded && <Check size={16} className="text-accent-400 shrink-0" />}
                  </button>
                )
              })}

              {/* Create new insight - always visible */}
              {showCreate ? (
                <div className="flex items-center gap-2 px-3 py-2 mt-1">
                  <input
                    type="text"
                    value={newInsightName}
                    onChange={(e) => setNewInsightName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
                    placeholder={t('insights.insightName')}
                    autoFocus
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 outline-none"
                  />
                  <button
                    onClick={createAndAdd}
                    disabled={!newInsightName.trim()}
                    className="bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {t('insights.create')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-sm text-accent-400 hover:bg-zinc-800 transition-colors mt-1 border border-dashed border-zinc-700"
                >
                  <Plus size={16} />
                  {t('noteDetail.createNewInsight')}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
