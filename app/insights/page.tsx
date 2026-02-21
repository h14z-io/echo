'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Lightbulb, X } from 'lucide-react'
import { db } from '@/lib/db'
import { generateId, formatTimestamp } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { Insight } from '@/types'

export default function InsightsPage() {
  const { t } = useI18n()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    db.insights.getAll().then((all) => {
      setInsights(all.sort((a, b) => b.updatedAt - a.updatedAt))
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return

    const insight: Insight = {
      id: generateId(),
      name,
      noteIds: [],
      generatedContent: null,
      lastGeneratedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await db.insights.put(insight)
    setInsights((prev) => [insight, ...prev])
    setNewName('')
    setShowModal(false)
  }

  return (
    <div className="px-4 pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-50">{t('insights.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Plus size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* List */}
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
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <Lightbulb size={24} className="text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">{t('insights.noInsights')}</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
            {t('insights.noInsightsDesc')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-accent-600 hover:bg-accent-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            {t('insights.createInsight')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/insights/${insight.id}`}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 active:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-50 truncate pr-4">
                      {insight.name}
                    </h3>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {insight.noteIds.length === 1 ? t('common.nNote', { count: 1 }) : t('common.nNotes', { count: insight.noteIds.length })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {insight.lastGeneratedAt
                      ? t('insights.generated', { date: formatTimestamp(insight.lastGeneratedAt) })
                      : t('insights.notGenerated')}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-50">{t('insights.newInsight')}</h2>
              <button
                onClick={() => { setShowModal(false); setNewName('') }}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              placeholder={t('insights.insightName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/50 outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {t('insights.create')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
