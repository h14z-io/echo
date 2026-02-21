'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, FileText, FolderOpen, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.home', icon: Home },
  { href: '/notes', labelKey: 'nav.notes', icon: FileText },
  { href: '/folders', labelKey: 'nav.folders', icon: FolderOpen },
  { href: '/insights', labelKey: 'nav.insights', icon: Lightbulb },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  // Hide on recording page
  if (pathname === '/recording') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-around pb-safe">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-4 py-3 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-accent-500'
                  : 'text-zinc-500 active:text-zinc-300'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-accent-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1 : 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </motion.div>
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
