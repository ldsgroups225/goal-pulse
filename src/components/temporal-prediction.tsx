import type { MatchEvent, TeamWindowStats, WindowAnalysis } from '@/types'
import { cn } from '@/lib/utils'

interface TemporalPredictionProps {
  windows: WindowAnalysis[]
  teamComparison?: {
    home: TeamWindowStats
    away: TeamWindowStats
  }
  events?: MatchEvent[]
  className?: string
}

export function TemporalPrediction({ windows, teamComparison: _teamComparison, events: _events, className }: TemporalPredictionProps) {
  // Sort windows by probability (highest first)
  const sortedWindows = [...windows].sort((a, b) => b.probability - a.probability)

  // Group windows by half
  const firstHalfWindows = windows.filter(w =>
    w.window.label.includes('First')
    || w.window.end <= 45,
  )

  const secondHalfWindows = windows.filter(w =>
    w.window.label.includes('Second')
    || (w.window.start > 45 && w.window.label.includes('Final')),
  )

  // Find the highest probability windows for each half
  const highestFirstHalf = firstHalfWindows.length > 0
    ? firstHalfWindows.sort((a, b) => b.probability - a.probability)[0]
    : null

  const highestSecondHalf = secondHalfWindows.length > 0
    ? secondHalfWindows.sort((a, b) => b.probability - a.probability)[0]
    : null

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Goal Timing Analysis</h3>
        <span className="text-xs text-muted-foreground bg-accent/40 dark:bg-accent/20 px-2 py-1 rounded">
          Advanced Prediction
        </span>
      </div>

      {/* Match timeline visualization */}
      <MatchTimeline
        windows={windows}
        highestFirstHalf={highestFirstHalf}
        highestSecondHalf={highestSecondHalf}
      />

      {/* Half-by-half comparison */}
      <div className="grid grid-cols-2 gap-3">
        <HalfPrediction
          title="First Half"
          windows={firstHalfWindows}
          highlight={highestFirstHalf}
        />

        <HalfPrediction
          title="Second Half"
          windows={secondHalfWindows}
          highlight={highestSecondHalf}
        />
      </div>

      {/* Key windows details */}
      <div className="grid gap-3 mt-2">
        {sortedWindows.slice(0, 3).map((window, index) => (
          <TimeWindowCard
            key={window.window.label}
            window={window}
            isHighest={index === 0}
          />
        ))}
      </div>
    </div>
  )
}

interface MatchTimelineProps {
  windows: WindowAnalysis[]
  highestFirstHalf: WindowAnalysis | null
  highestSecondHalf: WindowAnalysis | null
}

function MatchTimeline({ windows: _windows, highestFirstHalf, highestSecondHalf }: MatchTimelineProps) {
  return (
    <div className="relative py-3">
      {/* Timeline base */}
      <div className="h-2 bg-muted dark:bg-muted/50 rounded-full relative">
        {/* Halftime marker */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-border dark:bg-border -ml-0.5 z-10" />

        {/* First half hotspot */}
        {highestFirstHalf && (
          <div
            className={cn(
              'absolute h-4 -top-1 rounded-full transition-all',
              getHotspotColor(highestFirstHalf.probability),
            )}
            style={{
              left: `${(highestFirstHalf.window.start + ((highestFirstHalf.window.end - highestFirstHalf.window.start) / 2)) / 90 * 100}%`,
              width: `${(highestFirstHalf.window.end - highestFirstHalf.window.start) / 90 * 100}%`,
              opacity: Math.max(0.5, highestFirstHalf.probability),
            }}
          >
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground border border-border text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
              {Math.round(highestFirstHalf.probability * 100)}
              % (
              {highestFirstHalf.window.label}
              )
            </div>
          </div>
        )}

        {/* Second half hotspot */}
        {highestSecondHalf && (
          <div
            className={cn(
              'absolute h-4 -top-1 rounded-full transition-all',
              getHotspotColor(highestSecondHalf.probability),
            )}
            style={{
              left: `${(highestSecondHalf.window.start + ((highestSecondHalf.window.end - highestSecondHalf.window.start) / 2)) / 90 * 100}%`,
              width: `${(highestSecondHalf.window.end - highestSecondHalf.window.start) / 90 * 100}%`,
              opacity: Math.max(0.5, highestSecondHalf.probability),
            }}
          >
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground border border-border text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
              {Math.round(highestSecondHalf.probability * 100)}
              % (
              {highestSecondHalf.window.label}
              )
            </div>
          </div>
        )}
      </div>

      {/* Time markers */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>0'</span>
        <span>15'</span>
        <span>30'</span>
        <span>HT</span>
        <span>60'</span>
        <span>75'</span>
        <span>90'</span>
      </div>
    </div>
  )
}

interface HalfPredictionProps {
  title: string
  windows: WindowAnalysis[]
  highlight: WindowAnalysis | null
}

function HalfPrediction({ title, windows, highlight }: HalfPredictionProps) {
  // If no highlight window but we have windows, use the highest one
  const highlightWindow = highlight || (windows.length > 0
    ? [...windows].sort((a, b) => b.probability - a.probability)[0]
    : null)

  const probabilityPercentage = highlightWindow
    ? Math.round(highlightWindow.probability * 100)
    : 0

  const probabilityColor = getTextColor(probabilityPercentage)

  return (
    <div className={cn(
      'border rounded-lg p-3 shadow-sm',
      highlightWindow && highlightWindow.probability > 0.3
        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/30 dark:bg-amber-900/10'
        : 'border-border bg-card',
    )}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm text-card-foreground">{title}</h4>
        {highlightWindow && (
          <span className={cn('text-sm font-bold', probabilityColor)}>
            {probabilityPercentage}
            %
          </span>
        )}
      </div>

      {highlightWindow
        ? (
            <>
              <div className="text-xs text-muted-foreground mb-2">
                Highest probability:
                {' '}
                <span className="font-medium">{highlightWindow.window.label}</span>
              </div>

              <div className="flex gap-2 mt-2 text-xs">
                <StatBadge
                  label="Intensity"
                  value={highlightWindow.goalIntensity.toFixed(1)}
                  color={getIntensityColor(highlightWindow.goalIntensity)}
                />
                <StatBadge
                  label="Pattern"
                  value={highlightWindow.patternStrength.toFixed(1)}
                />
              </div>
            </>
          )
        : (
            <div className="text-xs text-muted-foreground">
              No significant goal probability in this half
            </div>
          )}
    </div>
  )
}

interface TimeWindowCardProps {
  window: WindowAnalysis
  isHighest?: boolean
}

function TimeWindowCard({ window, isHighest = false }: TimeWindowCardProps) {
  const probabilityPercentage = Math.round(window.probability * 100)
  const barColor = getBarColor(window.probability)
  const textColor = getTextColor(window.probability)

  return (
    <div className={cn(
      'border rounded-lg p-3 transition-colors',
      isHighest
        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/30 dark:bg-amber-900/10'
        : 'border-border bg-card',
    )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-card-foreground">{window.window.label}</span>
          {isHighest && (
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 rounded">
              Highest
            </span>
          )}
        </div>
        <span className={cn('text-sm font-bold', textColor)}>
          {probabilityPercentage}
          %
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden mb-3">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${probabilityPercentage}%` }}
        />
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <StatBadge
          label="Time"
          value={`${window.window.start}'–${window.window.end}'`}
        />
        <StatBadge
          label="Intensity"
          value={window.goalIntensity.toFixed(1)}
          color={getIntensityColor(window.goalIntensity)}
        />
        <StatBadge
          label="Pattern"
          value={window.patternStrength.toFixed(1)}
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
    <div className="border border-border/40 bg-background/50 dark:bg-muted/20 p-1.5 rounded text-center">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn('font-medium text-card-foreground', color)}>
        {value}
        {suffix}
      </div>
    </div>
  )
}

// Helper functions
function getTextColor(probability: number): string {
  if (probability < 30) {
    return 'text-gray-600 dark:text-gray-400'
  }
  if (probability < 50) {
    return 'text-blue-600 dark:text-blue-400'
  }
  if (probability < 70) {
    return 'text-amber-600 dark:text-amber-400'
  }
  return 'text-green-600 dark:text-green-400'
}

function getBarColor(probability: number): string {
  if (probability < 0.3) {
    return 'bg-gray-400 dark:bg-gray-500'
  }
  if (probability < 0.5) {
    return 'bg-blue-500 dark:bg-blue-500/80'
  }
  if (probability < 0.7) {
    return 'bg-amber-500 dark:bg-amber-500/80'
  }
  return 'bg-green-500 dark:bg-green-500/80'
}

function getHotspotColor(probability: number): string {
  if (probability < 0.3) {
    return 'bg-gray-400/70 dark:bg-gray-500/60'
  }
  if (probability < 0.5) {
    return 'bg-blue-400/70 dark:bg-blue-500/60'
  }
  if (probability < 0.7) {
    return 'bg-amber-400/70 dark:bg-amber-500/60'
  }
  return 'bg-green-400/70 dark:bg-green-500/60'
}

function getIntensityColor(intensity: number): string | undefined {
  if (intensity < 3) {
    return 'text-gray-600 dark:text-gray-400'
  }
  if (intensity < 5) {
    return 'text-blue-600 dark:text-blue-400'
  }
  if (intensity < 7) {
    return 'text-amber-600 dark:text-amber-400'
  }
  if (intensity >= 7) {
    return 'text-green-600 dark:text-green-400'
  }
  return undefined
}
