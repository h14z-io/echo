'use client'

import { I18nProvider } from '@/lib/i18n'
import SplashScreen from '@/components/SplashScreen'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SplashScreen>{children}</SplashScreen>
    </I18nProvider>
  )
}
