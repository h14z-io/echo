'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
                <div
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-accent-500 transition-all duration-300 ease-out"
                />
              )}
              <div
                className={cn(
                  'transition-transform duration-200 ease-out',
                  isActive ? 'scale-100' : 'scale-90'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
