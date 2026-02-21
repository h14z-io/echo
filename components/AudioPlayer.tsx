'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Download } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface AudioPlayerProps {
  audioBlob: Blob
  duration: number
}

export default function AudioPlayer({ audioBlob, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    urlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [audioBlob])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar) return

    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const audioDuration = audio.duration && isFinite(audio.duration) ? audio.duration : duration
    audio.currentTime = ratio * audioDuration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const displayDuration = audioRef.current?.duration && isFinite(audioRef.current.duration)
    ? audioRef.current.duration
    : duration
  const progress = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0

  const handleDownload = useCallback(() => {
    const url = urlRef.current
    if (!url) return
    const ext = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('mp4') ? 'm4a' : 'ogg'
    const a = document.createElement('a')
    a.href = url
    a.download = `echo-recording.${ext}`
    a.click()
  }, [audioBlob.type])

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white transition-colors hover:bg-accent-700 active:scale-95"
      >
        {isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} className="ml-0.5" />
        )}
      </button>

      <div
        ref={progressRef}
        onClick={handleSeek}
        className="relative flex-1 cursor-pointer py-2"
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-accent-600 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
        {formatDuration(currentTime)} / {formatDuration(displayDuration)}
      </span>

      <button
        onClick={handleDownload}
        aria-label="Download recording"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        title="Download"
      >
        <Download size={16} />
      </button>
    </div>
  )
}
