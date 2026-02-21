'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic2, ChevronDown, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const STORAGE_KEY = 'echo-preferred-mic'

export default function MicSelector() {
  const { t } = useI18n()
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSelectedId(stored)

    navigator.mediaDevices.enumerateDevices()
      .then((all) => {
        const mics = all.filter((d) => d.kind === 'audioinput' && d.deviceId)
        setDevices(mics)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (devices.length === 0) return null

  const selected = devices.find((d) => d.deviceId === selectedId) || devices[0]
  const label = selected.label || `${t('home.microphone')} 1`
  const truncated = label.length > 30 ? label.slice(0, 28) + '...' : label

  const handleSelect = (deviceId: string) => {
    setSelectedId(deviceId)
    localStorage.setItem(STORAGE_KEY, deviceId)
    setOpen(false)
  }

  if (devices.length === 1) {
    return (
      <div className="flex items-center gap-1.5 mt-1" aria-label={t('home.microphone')}>
        <Mic2 size={12} className="text-zinc-600" strokeWidth={1.5} />
        <span className="text-xs text-zinc-600">{truncated}</span>
      </div>
    )
  }

  return (
    <div className="relative mt-1" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label={t('home.microphone')}
      >
        <Mic2 size={12} strokeWidth={1.5} />
        <span>{truncated}</span>
        <ChevronDown size={10} strokeWidth={1.5} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl py-1 shadow-xl z-50">
          {devices.map((device) => {
            const deviceLabel = device.label || device.deviceId.slice(0, 12)
            const isSelected = device.deviceId === (selectedId || devices[0].deviceId)
            return (
              <button
                key={device.deviceId}
                onClick={() => handleSelect(device.deviceId)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'text-accent-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span className="truncate mr-2">{deviceLabel}</span>
                {isSelected && <Check size={12} strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
