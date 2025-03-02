'use client'

import { ActivityIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm dark:bg-background/80 dark:border-border/40'
          : 'bg-background dark:bg-background'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <span className="absolute w-8 h-8 bg-primary/10 rounded-full scale-100 group-hover:scale-110 transition-transform duration-300"></span>
            <ActivityIcon className="h-5 w-5 text-primary relative z-10" />
          </div>
          <span className="font-bold text-lg">
            <span className="text-foreground">Goal</span>
            <span className="text-primary">Pulse</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/predictions"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hidden sm:block"
          >
            Predictions
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block"></div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
