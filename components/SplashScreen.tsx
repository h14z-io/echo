'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import AccessCodeScreen from '@/components/AccessCodeScreen'

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showSplash) return

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth')
        const data = await res.json()
        setAuthenticated(data.authenticated)
      } catch {
        setAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [showSplash])

  const handleAuthSuccess = useCallback(() => {
    setAuthenticated(true)
  }, [])

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 animate-splash-exit">
          {/* Logo */}
          <div className="relative mb-6 animate-splash-logo">
            <Image
              src="/logo.jpg"
              alt="Echo"
              width={96}
              height={96}
              className="rounded-2xl"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-semibold text-zinc-50 tracking-tight animate-splash-title">
            Echo
          </h1>

          {/* Tagline */}
          <p className="text-sm text-zinc-500 mt-2 animate-splash-tagline">
            Voice notes with AI
          </p>

          {/* Bottom accent line */}
          <div className="absolute bottom-12 w-12 h-0.5 rounded-full bg-accent-600 animate-splash-accent" />
        </div>
      )}

      {!showSplash && !authChecked && (
        <div className="fixed inset-0 z-[90] bg-zinc-950" />
      )}

      {!showSplash && authChecked && !authenticated && (
        <AccessCodeScreen onSuccess={handleAuthSuccess} />
      )}

      <div className={showSplash || !authChecked || !authenticated ? 'opacity-0 pointer-events-none' : 'animate-fade-in'}>
        {children}
      </div>
    </>
  )
}
