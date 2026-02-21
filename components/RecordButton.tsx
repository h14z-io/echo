'use client'

import { Mic } from 'lucide-react'
import Link from 'next/link'

export default function RecordButton() {
  return (
    <Link href="/recording" aria-label="Start recording">
      <div className="relative flex items-center justify-center active:scale-[0.92] hover:scale-105 transition-transform">
        {/* Outer pulse */}
        <div className="absolute w-24 h-24 rounded-full bg-accent-600/10 animate-pulse-ring-1" />

        {/* Middle pulse */}
        <div className="absolute w-20 h-20 rounded-full bg-accent-600/20 animate-pulse-ring-2" />

        {/* Inner pulse */}
        <div className="absolute w-20 h-20 rounded-full bg-accent-600/15 animate-pulse-ring-3" />

        {/* Glow */}
        <div className="absolute w-20 h-20 rounded-full bg-accent-600/20 blur-xl" />

        {/* Main button */}
        <div className="relative w-20 h-20 rounded-full bg-accent-600 flex items-center justify-center shadow-lg shadow-accent-600/30 animate-record-btn-in">
          <Mic size={28} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </Link>
  )
}
