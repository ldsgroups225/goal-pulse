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
        <h3 className="text-lg font-semibold">Goal Timing Analysis</h3>
        <span className="text-xs text-muted-foreground bg-primary-foreground/10 px-2 py-1 rounded">
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
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
        {/* Halftime marker */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-400 dark:bg-gray-500 -ml-0.5 z-10" />

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
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
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
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
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
      'border rounded-lg p-3',
      highlightWindow && highlightWindow.probability > 0.3
        ? 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10'
        : 'border-border bg-card',
    )}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
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
                <div className="flex-1 bg-background dark:bg-background/20 rounded-md p-1.5 text-center">
                  <div className="text-[10px] opacity-70">Shot Freq.</div>
                  <div className="font-bold">
                    {highlightWindow.shotFrequency.toFixed(1)}
                    /min
                  </div>
                </div>
                <div className="flex-1 bg-background dark:bg-background/20 rounded-md p-1.5 text-center">
                  <div className="text-[10px] opacity-70">Top Factor</div>
                  <div className="font-bold">{highlightWindow.keyFactors[0]?.split(' ')[0] || 'N/A'}</div>
                </div>
              </div>
            </>
          )
        : (
            <div className="text-xs text-muted-foreground py-3 text-center">
              No significant goal threat detected
            </div>
          )}
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
  const probabilityColor = getTextColor(probabilityPercent)
  const barColor = getBarColor(probabilityPercent)

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

// Helper functions
function getTextColor(probability: number): string {
  if (probability >= 60)
    return 'text-red-600 dark:text-red-400'
  if (probability >= 40)
    return 'text-amber-600 dark:text-amber-400'
  if (probability >= 25)
    return 'text-yellow-600 dark:text-yellow-400'
  if (probability >= 15)
    return 'text-blue-600 dark:text-blue-400'
  return 'text-gray-500'
}

function getBarColor(probability: number): string {
  if (probability >= 60)
    return 'bg-red-500 dark:bg-red-500'
  if (probability >= 40)
    return 'bg-amber-500 dark:bg-amber-500'
  if (probability >= 25)
    return 'bg-yellow-500 dark:bg-yellow-500'
  if (probability >= 15)
    return 'bg-blue-500 dark:bg-blue-500'
  return 'bg-gray-300 dark:bg-gray-700'
}

function getHotspotColor(probability: number): string {
  if (probability >= 0.6)
    return 'bg-red-500 dark:bg-red-500'
  if (probability >= 0.4)
    return 'bg-amber-500 dark:bg-amber-500'
  if (probability >= 0.25)
    return 'bg-yellow-500 dark:bg-yellow-500'
  if (probability >= 0.15)
    return 'bg-blue-500 dark:bg-blue-500'
  return 'bg-gray-400 dark:bg-gray-600'
}
