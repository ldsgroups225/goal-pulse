// src/app/_components/pwa-install-prompt.tsx

'use client'

import { usePWA } from '@/lib/pwa'
import { useState } from 'react'

/**
 * PWA installation prompt component
 */
export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg max-w-xs">
      <div className="flex flex-col gap-2">
        <p className="font-medium">Install Goal Pulse</p>
        <p className="text-sm text-muted-foreground">
          Install this app on your device for a better experience
        </p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 px-4 py-2 text-sm rounded-md border hover:bg-secondary/50"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={promptInstall}
            className="flex-1 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
