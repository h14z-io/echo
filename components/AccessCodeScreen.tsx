'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle } from 'lucide-react'

interface AccessCodeScreenProps {
  onSuccess: () => void
}

const CODE_LENGTH = 6

export default function AccessCodeScreen({ onSuccess }: AccessCodeScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const submitCode = useCallback(async (code: string) => {
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => setShake(false), 600)
        setDigits(Array(CODE_LENGTH).fill(''))
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const digit = value.slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError(false)

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (digit && index === CODE_LENGTH - 1) {
      const code = newDigits.join('')
      if (code.length === CODE_LENGTH) {
        submitCode(code)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return

    const newDigits = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)

    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted)
    } else {
      inputRefs.current[pasted.length]?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-zinc-950 px-6">
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
          <Lock className="h-7 w-7 text-accent-500" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-xl font-semibold text-zinc-50 mb-2"
      >
        Access Code
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-sm text-zinc-500 mb-10 text-center"
      >
        Enter your 6-digit code to continue
      </motion.p>

      {/* Digit inputs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={shake ? { duration: 0.5 } : { duration: 0.4, delay: 0.2 }}
        className="flex gap-3"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className={`
              h-14 w-11 rounded-xl border text-center text-lg font-semibold
              bg-zinc-900 text-zinc-50 outline-none
              transition-all duration-200
              ${error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                : digit
                  ? 'border-accent-600/60 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30'
                  : 'border-zinc-800 focus:border-accent-600 focus:ring-1 focus:ring-accent-600/30'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        ))}
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: error ? 1 : 0, height: error ? 'auto' : 0 }}
        className="mt-6 flex items-center gap-2 text-red-400 overflow-hidden"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">Invalid code. Try again.</span>
      </motion.div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <div className="h-1 w-16 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-full rounded-full bg-accent-600 animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Bottom accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-12 w-12 h-0.5 rounded-full bg-accent-600"
      />
    </div>
  )
}
