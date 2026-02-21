'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-zinc-50 mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-400 mb-6 max-w-xs">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="bg-accent-600 hover:bg-accent-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
