'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, Database, ArrowRightLeft, Server, Globe } from 'lucide-react'
import { db } from '@/lib/db'
import { hasV1Data, migrateV1toV2 } from '@/lib/migration'
import { useI18n, LOCALE_NAMES, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const [notesCount, setNotesCount] = useState(0)
  const [foldersCount, setFoldersCount] = useState(0)
  const [insightsCount, setInsightsCount] = useState(0)

  const [showV1Migration, setShowV1Migration] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{ notesMigrated: number, foldersCreated: number } | null>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      const notes = await db.notes.getAll()
      setNotesCount(notes.length)

      const folders = await db.folders.getAll()
      setFoldersCount(folders.length)

      const insights = await db.insights.getAll()
      setInsightsCount(insights.length)

      setShowV1Migration(hasV1Data())
    }
    load()
  }, [])

  const handleMigrate = async () => {
    setMigrating(true)
    setMigrationError(null)
    setMigrationResult(null)
    try {
      const result = await migrateV1toV2()
      setMigrationResult(result)
      setShowV1Migration(false)

      // Refresh counts
      const notes = await db.notes.getAll()
      setNotesCount(notes.length)
      const folders = await db.folders.getAll()
      setFoldersCount(folders.length)

      const insights2 = await db.insights.getAll()
      setInsightsCount(insights2.length)

    } catch (err) {
      setMigrationError(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await db.destroy()
      window.location.href = '/'
    } catch (err) {
      console.error('Failed to delete database:', err)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 pt-4 pb-20">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-zinc-50">{t('settings.title')}</h1>
        </div>

        {/* Language */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('settings.language')}</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Globe size={18} className="text-zinc-500" />
              <p className="text-sm text-zinc-50">{t('settings.language')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['en', 'es', 'pt'] as Locale[]).map((loc) => (
                <button key={loc} onClick={() => setLocale(loc)} className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', locale === loc ? 'bg-accent-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200')}>
                  {LOCALE_NAMES[loc]}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* AI Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('settings.aiConfig')}
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-3">
              <Server size={18} className="text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-zinc-50">Gemini 2.5 Flash</p>
                <p className="text-xs text-zinc-500">{t('settings.serverSideKey')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Storage */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('settings.storage')}
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-zinc-500" />
              <div className="flex gap-4 text-sm">
                <span className="text-zinc-400">
                  <span className="font-medium text-zinc-50">{notesCount}</span> {t('common.notes')}
                </span>
                <span className="text-zinc-400">
                  <span className="font-medium text-zinc-50">{foldersCount}</span> {t('nav.folders')}
                </span>
                <span className="text-zinc-400">
                  <span className="font-medium text-zinc-50">{insightsCount}</span> {t('nav.insights')}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Migration */}
        {showV1Migration && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {t('settings.migrateFromV1')}
            </h2>
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start gap-3">
                <ArrowRightLeft size={18} className="mt-0.5 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  {t('settings.migrateDesc')}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-40"
              >
                {migrating ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    {t('settings.migrating')}
                  </span>
                ) : (
                  t('settings.migrateNow')
                )}
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Migration result */}
        {migrationResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
          >
            {t('settings.migrationComplete', { notes: migrationResult.notesMigrated, folders: migrationResult.foldersCreated })}
          </motion.div>
        )}

        {migrationError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {t('settings.migrationFailed')} {migrationError}
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-red-400">
            {t('settings.dangerZone')}
          </h2>
          <div className="rounded-xl border border-red-500/20 bg-zinc-900 p-4">
            {!showDeleteConfirm ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 size={16} />
                {t('settings.deleteAllData')}
              </motion.button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-400">
                  {t('settings.deleteConfirm')}
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAll}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    {t('settings.deleteAll')}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    {t('common.cancel')}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('settings.about')}
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm font-medium text-zinc-50">{t('settings.version')}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {t('settings.description')}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {t('settings.builtWith')}
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
