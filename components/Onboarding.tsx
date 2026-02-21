'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, FileText, Lightbulb } from 'lucide-react'
import { db } from '@/lib/db'
import { useI18n } from '@/lib/i18n'

const SLIDE_ICONS = [Mic, FileText, Lightbulb] as const

const SLIDE_KEYS = [
  { title: 'onboarding.record', description: 'onboarding.recordDesc' },
  { title: 'onboarding.transcribe', description: 'onboarding.transcribeDesc' },
  { title: 'onboarding.organize', description: 'onboarding.organizeDesc' },
] as const

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0)
  const { t } = useI18n()

  const handleNext = async () => {
    if (current < SLIDE_KEYS.length - 1) {
      setCurrent(current + 1)
    } else {
      await db.settings.set('onboardingCompleted', true)
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-zinc-950 px-8">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-6"
          >
            {(() => {
              const Icon = SLIDE_ICONS[current]
              return (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-600/10">
                  <Icon className="h-16 w-16 text-accent-500" />
                </div>
              )
            })()}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-2xl font-bold text-zinc-50">
                {t(SLIDE_KEYS[current].title)}
              </h2>
              <p className="text-center text-zinc-400">
                {t(SLIDE_KEYS[current].description)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm pb-12">
        {/* Dot indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {SLIDE_KEYS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === current ? 'bg-accent-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full rounded-lg bg-accent-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-700"
        >
          {current < SLIDE_KEYS.length - 1 ? t('onboarding.next') : t('onboarding.getStarted')}
        </motion.button>
      </div>
    </div>
  )
}
