'use client'

import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    const lastUpdateTime = localStorage.getItem('lastUpdateTime')
    if (lastUpdateTime) {
      setLastUpdate(new Date(lastUpdateTime).toLocaleString())
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mb-8">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold">You're offline</h1>

          <p className="text-muted-foreground">
            Please check your internet connection and try again
          </p>

          {lastUpdate && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Last data update:
                {' '}
                {lastUpdate}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="mt-6 w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Try again
          </button>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
