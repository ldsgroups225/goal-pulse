'use client';

import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  minute?: number;
  status: string;
  period?: string;
  className?: string;
}

export function LiveBadge({ minute, status, period, className }: LiveBadgeProps) {
  // Determine if the match is live
  const isLive = status !== 'FT' && status !== 'HT' && status !== 'NS';
  
  // For halftime or fulltime display
  if (status === 'HT') {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium",
        className
      )}>
        <span className="text-amber-500">HT</span>
      </div>
    );
  }
  
  if (status === 'FT') {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium",
        className
      )}>
        <span className="text-gray-400">FT</span>
      </div>
    );
  }
  
  // For live matches
  if (isLive && minute !== undefined) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium",
        className
      )}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-red-500">{minute}&apos;</span>
        {period && <span className="text-gray-400">• {period}</span>}
      </div>
    );
  }
  
  // For not started matches
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium text-gray-400",
      className
    )}>
      {status}
    </div>
  );
}
