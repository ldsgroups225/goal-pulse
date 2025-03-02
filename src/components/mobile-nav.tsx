'use client'

import { cn } from '@/lib/utils'
import { BarChart2Icon, HomeIcon, Settings2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function MobileNav() {
  const pathname = usePathname()

  // Navigation items
  const items = [
    {
      title: 'Home',
      href: '/',
      icon: HomeIcon,
    },
    {
      title: 'Predictions',
      href: '/predictions',
      icon: BarChart2Icon,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings2Icon,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border/60 bg-background/95 backdrop-blur-md pb-safe dark:bg-background/80 dark:border-border/40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-16">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center text-xs transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 mb-0.5 rounded-full',
                isActive && 'bg-primary/10',
              )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
                />
              </div>
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
