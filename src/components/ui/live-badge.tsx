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
  startTime
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
        <span className="text-amber-500 dark:text-amber-400">HT</span>
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
        <span className="text-gray-500 dark:text-gray-400">FT</span>
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
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 dark:bg-red-500 dark:opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 dark:bg-red-400"></span>
        </span>
        <span className="text-red-600 dark:text-red-400">
          {minute}
          &apos;
        </span>
        {period && (
          <span className="text-gray-500 dark:text-gray-400">
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
        'flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400',
        className,
      )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      'flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400',
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
      hour12: true 
    })
  } catch (error) {
    console.error('Error formatting start time:', error)
    return dateTimeStr
  }
}
