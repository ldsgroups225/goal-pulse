import { cn } from '@/lib/utils'

interface LiveBadgeProps {
  minute?: number
  status: string
  period?: string
  className?: string
  startTime?: string
}

export function LiveBadge({
  minute,
  status,
  period,
  className,
  startTime,
}: LiveBadgeProps) {
  // Determine if the match is live
  const isLive = status !== 'FT' && status !== 'HT' && status !== 'NS'

  // For halftime display
  if (status === 'HT') {
    return (
      <div className={cn(
        'flex items-center gap-1 text-xs font-medium',
        className,
      )}
      >
        <span className="text-accent flex items-center">
          <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mr-1.5"></span>
          HT
        </span>
      </div>
    )
  }

  if (status === 'FT') {
    return (
      <div className={cn(
        'flex items-center gap-1 text-xs font-medium',
        className,
      )}
      >
        <span className="text-muted-foreground">FT</span>
      </div>
    )
  }

  // For live matches
  if (isLive && minute !== undefined) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        className,
      )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 dark:bg-destructive dark:opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive dark:bg-destructive"></span>
        </span>
        <span className="text-destructive dark:text-destructive">
          {minute}
          &apos;
        </span>
        {period && (
          <span className="text-muted-foreground">
            •
            {period}
          </span>
        )}
      </div>
    )
  }

  // For not started matches, display start time if available
  if (status === 'NS' && startTime) {
    const timeFormatted = formatStartTime(startTime)
    return (
      <div className={cn(
        'flex items-center gap-1 text-xs font-medium text-primary dark:text-primary',
        className,
      )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>{timeFormatted}</span>
      </div>
    )
  }

  // For other statuses
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-medium text-muted-foreground',
      className,
    )}
    >
      {status}
    </div>
  )
}

// Helper function to format match start time
function formatStartTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
  catch (error) {
    console.error('Error formatting start time:', error)
    return dateTimeStr
  }
}
