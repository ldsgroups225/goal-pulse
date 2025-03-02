import type { WindowAnalysis } from '@/types'
import { cn } from '@/lib/utils'

interface TemporalPredictionProps {
  windows: WindowAnalysis[]
  className?: string
}

export function TemporalPrediction({ windows, className }: TemporalPredictionProps) {
  // Sort windows by probability (highest first)
  const sortedWindows = [...windows].sort((a, b) => b.probability - a.probability)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-lg font-semibold">Goal Timing Probabilities</div>

      <div className="grid gap-3">
        {sortedWindows.map((window, index) => (
          <TimeWindowCard key={window.window.label} window={window} isHighest={index === 0} />
        ))}
      </div>
    </div>
  )
}

interface TimeWindowCardProps {
  window: WindowAnalysis
  isHighest: boolean
}

function TimeWindowCard({ window, isHighest }: TimeWindowCardProps) {
  // Format probability as percentage
  const probabilityPercent = Math.round(window.probability * 100)

  // Color coding based on probability
  let probabilityColor = 'text-gray-500'
  let barColor = 'bg-gray-300 dark:bg-gray-700'

  if (probabilityPercent >= 60) {
    probabilityColor = 'text-red-600 dark:text-red-400'
    barColor = 'bg-red-500 dark:bg-red-500'
  }
  else if (probabilityPercent >= 40) {
    probabilityColor = 'text-amber-600 dark:text-amber-400'
    barColor = 'bg-amber-500 dark:bg-amber-500'
  }
  else if (probabilityPercent >= 25) {
    probabilityColor = 'text-yellow-600 dark:text-yellow-400'
    barColor = 'bg-yellow-500 dark:bg-yellow-500'
  }
  else if (probabilityPercent >= 15) {
    probabilityColor = 'text-blue-600 dark:text-blue-400'
    barColor = 'bg-blue-500 dark:bg-blue-500'
  }

  return (
    <div className={cn(
      'rounded-lg border border-border p-3 bg-card',
      isHighest && 'ring-2 ring-primary/30 dark:ring-primary/20 bg-primary/5',
    )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{window.window.label}</span>
        <span className={cn('font-bold', probabilityColor)}>
          {probabilityPercent}
          %
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mb-3">
        <div
          className={cn('h-2 rounded-full', barColor)}
          style={{ width: `${probabilityPercent}%` }}
        />
      </div>

      {/* Factors */}
      <div className="text-sm text-muted-foreground">
        {window.keyFactors.length > 0
          ? (
              <>
                <span className="font-medium mr-1">Key factors:</span>
                {window.keyFactors.join(', ')}
              </>
            )
          : (
              'No significant factors'
            )}
      </div>

      {/* Stats */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <StatBadge
          label="Pressure"
          value={`${Math.round(window.pressureIndex * 100)}%`}
          color={window.pressureIndex > 0.5 ? 'text-red-600' : 'text-blue-600'}
        />
        <StatBadge
          label="Shot Rate"
          value={window.shotFrequency.toFixed(1)}
          suffix="/min"
        />
        <StatBadge
          label="Set Pieces"
          value={window.setPieceCount.toString()}
        />
      </div>
    </div>
  )
}

interface StatBadgeProps {
  label: string
  value: string
  suffix?: string
  color?: string
}

function StatBadge({ label, value, suffix = '', color }: StatBadgeProps) {
  return (
    <div className="bg-secondary/40 dark:bg-secondary/20 rounded px-2 py-1 flex flex-col items-center justify-center">
      <span className="text-[10px] opacity-70">{label}</span>
      <span className={cn('font-bold', color)}>
        {value}
        {suffix}
      </span>
    </div>
  )
}
