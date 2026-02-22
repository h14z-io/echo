'use client'

import { I18nProvider } from '@/lib/i18n'
import { ToastProvider } from '@/components/Toast'
import SplashScreen from '@/components/SplashScreen'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <SplashScreen>{children}</SplashScreen>
      </ToastProvider>
    </I18nProvider>
  )
}
