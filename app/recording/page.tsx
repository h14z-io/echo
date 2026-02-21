'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Square } from 'lucide-react'
import { db } from '@/lib/db'
import { generateId, formatRecordingTime } from '@/lib/utils'
import { processRecording } from '@/lib/gemini'
import { useI18n } from '@/lib/i18n'

export default function RecordingPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [seconds, setSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  const PROCESSING_STEPS = 7

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0)
      return
    }
    if (processingStep >= PROCESSING_STEPS - 1) return

    const timer = setTimeout(() => {
      setProcessingStep((prev) => prev + 1)
    }, 2500)

    return () => clearTimeout(timer)
  }, [isProcessing, processingStep])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)
  const initedRef = useRef(false)

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 48
      const gap = 3
      const totalGaps = gap * (barCount - 1)
      const barWidth = (canvas.width - totalGaps) / barCount
      const centerY = canvas.height / 2

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength)
        const value = dataArray[dataIndex] / 255
        const barHeight = Math.max(4, value * centerY * 0.85)

        const x = i * (barWidth + gap)

        ctx.fillStyle = `rgba(var(--color-accent-500), ${0.5 + value * 0.5})`
        ctx.beginPath()
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2)
        ctx.fill()
      }
    }

    draw()
  }, [])

  const startRecording = useCallback(async () => {
    if (initedRef.current) return
    initedRef.current = true

    try {
      const preferredMic = localStorage.getItem('echo-preferred-mic')
      const audioConstraints: MediaTrackConstraints | boolean = preferredMic
        ? { deviceId: { ideal: preferredMic } }
        : true
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      streamRef.current = stream

      // Setup analyser for waveform
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      drawWaveform()

      // Start timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      router.push('/')
    }
  }, [drawWaveform, router])

  useEffect(() => {
    startRecording()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [startRecording])

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    analyserRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const handleStop = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    setIsProcessing(true)

    const audioBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        resolve(blob)
      }
      recorder.stop()
    })

    cleanup()

    const noteId = generateId()
    const now = Date.now()
    const defaultTitle = new Date(now).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const { audioUtils } = await import('@/lib/audio')
    const duration = await audioUtils.getAudioDuration(audioBlob)

    // Save note immediately with transcribing status
    const note = {
      id: noteId,
      title: '',
      defaultTitle,
      audioBlob,
      audioFormat: audioBlob.type || 'audio/webm',
      duration: duration || seconds,
      transcription: null,
      summary: null,
      tags: [] as string[],
      folderId: null,
      insightIds: [] as string[],
      status: 'transcribing' as const,
      createdAt: now,
      updatedAt: now,
    }

    await db.notes.put(note)

    // Navigate immediately - note detail shows skeleton for 'transcribing' status
    router.push(`/notes/${noteId}`)

    // Process in background (fire-and-forget)
    const currentLocale = locale
    processRecording(audioBlob, currentLocale)
      .then(async (result) => {
        await db.notes.put({
          ...note,
          title: result.title,
          summary: result.summary,
          transcription: result.transcription,
          tags: result.tags,
          status: 'ready',
          updatedAt: Date.now(),
        })
      })
      .catch(async (err) => {
        console.error('Processing failed:', err)
        await db.notes.put({
          ...note,
          status: 'error',
          updatedAt: Date.now(),
        })
      })
  }

  const handlePause = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (isPaused) {
      recorder.resume()
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
      drawWaveform()
      setIsPaused(false)
    } else {
      recorder.pause()
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      setIsPaused(true)
    }
  }

  const handleCancel = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    cleanup()
    router.push('/')
  }

  return (
    <div className="px-4 pt-4 flex flex-col items-center min-h-dvh">
      {/* Header */}
      <div className="w-full">
        <motion.h1
          className="text-lg font-semibold text-zinc-50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isProcessing ? t('recording.processing') : isPaused ? t('recording.paused') : t('recording.recording')}
        </motion.h1>
      </div>

      {/* Timer */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 -mt-12">
        <motion.div
          className="text-6xl font-light text-zinc-50 tabular-nums tracking-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {formatRecordingTime(seconds)}
        </motion.div>

        {/* Waveform */}
        <motion.canvas
          ref={canvasRef}
          width={320}
          height={80}
          className="w-80 h-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isPaused ? 0.4 : 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Stop Button */}
        {!isProcessing && (
          <motion.button
            onClick={handleStop}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/25 transition-colors"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Square size={22} className="text-white" fill="white" />
          </motion.button>
        )}

        {isProcessing && (
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-accent-500 rounded-full animate-spin" />
            <div className="h-5 relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={processingStep}
                  className="text-sm text-zinc-500"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {t(`recording.step${processingStep + 1}`)}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Pause / Cancel */}
        {!isProcessing && (
          <motion.div
            className="flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handlePause}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors py-2 px-3"
            >
              {isPaused ? t('recording.resume') : t('recording.pause')}
            </button>
            <button
              onClick={handleCancel}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-2 px-3"
            >
              {t('recording.cancel')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
