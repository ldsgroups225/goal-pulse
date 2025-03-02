import type { MatchPrediction } from '@/types'
import { CountryFlag } from '@/components/ui/country-flag'
import { LiveBadge } from '@/components/ui/live-badge'
import { cn, formatScore } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface PredictionCardProps {
  data: MatchPrediction
  variant?: 'default' | 'compact'
  showPrediction?: boolean
  className?: string
}

export function PredictionCard({
  data,
  variant = 'default',
  showPrediction = true,
  className,
}: PredictionCardProps) {
  const isCompact = variant === 'compact'
  const { homeColor, awayColor } = formatScore(data.teams.home.score, data.teams.away.score)

  // Calculate suggested bet with color
  const recommendedBet = data.prediction.recommendedBet
  let betBoxColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

  if (recommendedBet.includes('Home Win')) {
    betBoxColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  }
  else if (recommendedBet.includes('Away Win')) {
    betBoxColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  }
  else if (recommendedBet.includes('Draw')) {
    betBoxColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
  else if (recommendedBet.includes('Over')) {
    betBoxColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }
  else if (recommendedBet.includes('Under')) {
    betBoxColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
  else if (recommendedBet.includes('BTTS')) {
    betBoxColor = 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
  }

  // Get temporal goal prediction if available
  const temporalPrediction = data.temporalGoalProbability?.windows
  const highestGoalWindow = temporalPrediction && temporalPrediction.length > 0
    ? [...temporalPrediction].sort((a, b) => b.probability - a.probability)[0]
    : null

  // Format temporal prediction text
  const temporalText = highestGoalWindow
    ? `${Math.round(highestGoalWindow.probability * 100)}% Goal in ${highestGoalWindow.window.label}`
    : null

  // Determine if we should show temporal prediction (high probability)
  const showTemporalPrediction = highestGoalWindow && highestGoalWindow.probability > 0.2

  // Find specific first 15min and last 10min windows
  const first15Window = temporalPrediction?.find(w => w.window.label === 'First 15')
  const final10Window = temporalPrediction?.find(w => w.window.label === 'Final 10')

  // Calculate probabilities for display
  const first15Prob = first15Window ? Math.round(first15Window.probability * 100) : null
  const final10Prob = final10Window ? Math.round(final10Window.probability * 100) : null

  // Highlight if either of our key time windows has high probability
  const highlightEarlyGoal = first15Window && first15Window.probability > 0.3
  const highlightLateGoal = final10Window && final10Window.probability > 0.3

  // Get status string and minute from status object
  const statusText = data.status.status
  const matchMinute = data.status.minute
  const isLive = data.status.isLive

  // Placeholder for additional data elements not in type
  const matchDate = 'Upcoming'
  const isStopped = false

  return (
    <div
      className={cn(
        'h-full rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border',
        'hover:shadow-md transition-all duration-200',
        'active:scale-[0.995] touch-action-manipulation',
        'dark:hover:bg-card/90 dark:shadow-lg dark:shadow-black/10',
        'flex flex-col',
        className,
      )}
    >
      <Link href={`/${data.fixtureId}`} className="flex-1 flex flex-col h-full">
        {/* Card Header - League & Status */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-card/80 dark:bg-card/60">
          <div className="flex items-center gap-1.5">
            <CountryFlag
              country={data.league.country}
              imagePath={data.league.logoUrl}
              size="sm"
            />
            <span className="text-xs font-medium text-foreground/70 dark:text-foreground/80 truncate max-w-[140px]">
              {data.league.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isLive && <LiveBadge status={statusText} minute={matchMinute} />}
            <span className="text-xs">
              {isLive && matchMinute
                ? (
                    <>
                      {matchMinute}
                      '
                      {isStopped && '+'}
                    </>
                  )
                : statusText === 'HT'
                  ? 'HT'
                  : statusText === 'FT'
                    ? 'FT'
                    : matchDate}
            </span>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex-1 px-3 py-2 flex flex-col justify-between">
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* Home Team */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 mb-1 relative">
                <Image
                  src={data.teams.home.logoUrl}
                  alt={data.teams.home.name}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-xs text-center leading-tight">
                {data.teams.home.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="mb-0.5 text-sm opacity-70 font-medium">
                {isLive || statusText === 'HT' || statusText === 'FT'
                  ? 'Score'
                  : matchDate}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${homeColor} w-6 text-center`}
                >
                  {data.teams.home.score !== undefined ? data.teams.home.score : '-'}
                </span>
                <span className="text-lg mx-[-2px]">-</span>
                <span
                  className={`text-2xl font-bold ${awayColor} w-6 text-center`}
                >
                  {data.teams.away.score !== undefined ? data.teams.away.score : '-'}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 mb-1 relative">
                <Image
                  src={data.teams.away.logoUrl}
                  alt={data.teams.away.name}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-xs text-center leading-tight">
                {data.teams.away.name}
              </span>
            </div>
          </div>

          {/* Match stats */}
          {data.stats && (
            <div className="grid grid-cols-3 items-center text-xs text-center gap-2 mt-3">
              <div>
                Poss:
                {' '}
                {data.stats.possession.home}
                %
              </div>
              <div className="flex gap-1">
                <span>
                  Shots:
                  {data.stats.shots.home.total}
                  -
                  {data.stats.shots.away.total}
                </span>
                <span className="opacity-40">•</span>
                <span>
                  Corners:
                  {data.stats.corners.home}
                  -
                  {data.stats.corners.away}
                </span>
              </div>
              <div>
                Poss:
                {' '}
                {data.stats.possession.away}
                %
              </div>
            </div>
          )}
        </div>

        {/* Temporal Prediction Panel - REPLACES ODDS */}
        {showPrediction && (
          <div className="grid grid-cols-3 border-t border-border/60 mt-auto">
            {/* First 15min goal probability */}
            <div
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1',
                first15Prob && first15Prob > 30
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-primary/5 dark:bg-primary/10',
              )}
            >
              <div className="text-xs opacity-80 mb-0.5">First 15'</div>
              <div className={cn(
                'text-xl font-bold',
                first15Prob && first15Prob > 30 ? 'text-blue-600 dark:text-blue-400' : 'text-primary dark:text-primary-foreground',
              )}
              >
                {first15Prob !== null ? `${first15Prob}%` : '-'}
              </div>
            </div>

            {/* Overall goal probability */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-secondary dark:bg-secondary/30">
              <div className="text-xs opacity-80 mb-0.5">Goal Prob</div>
              <div className="text-xl font-bold text-secondary-foreground">
                {data.prediction.goals && typeof data.prediction.goals.over15 === 'number'
                  ? `${Math.round(data.prediction.goals.over15 * 100)}%`
                  : '-'}
              </div>
            </div>

            {/* Last 10min goal probability */}
            <div
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1',
                final10Prob && final10Prob > 30
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-primary/5 dark:bg-primary/10',
              )}
            >
              <div className="text-xs opacity-80 mb-0.5">Last 10'</div>
              <div className={cn(
                'text-xl font-bold',
                final10Prob && final10Prob > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-primary dark:text-primary-foreground',
              )}
              >
                {final10Prob !== null ? `${final10Prob}%` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* Additional info like hot prediction box */}
        {!isCompact && data.prediction.confidence > 0.7 && (
          <div className={cn(
            'px-3 py-1.5 text-sm font-medium text-center',
            'border-t border-border/60 backdrop-blur-sm',
            betBoxColor,
          )}
          >
            {getHighConfidenceTip(data)}
          </div>
        )}

        {/* Temporal Goal Prediction - Additional details */}
        {!isCompact && showTemporalPrediction && (
          <div className={cn(
            'px-3 py-1.5 text-sm font-medium',
            'border-t border-border/60 backdrop-blur-sm',
            highlightEarlyGoal
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : highlightLateGoal
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
          )}
          >
            <span className="flex items-center justify-center gap-1">
              {/* Clock icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>

              {highlightEarlyGoal && first15Window
                ? (
                    <span>
                      Early Goal Alert (
                      {Math.round(first15Window.probability * 100)}
                      %)
                    </span>
                  )
                : highlightLateGoal && final10Window
                  ? (
                      <span>
                        Late Goal Alert (
                        {Math.round(final10Window.probability * 100)}
                        %)
                      </span>
                    )
                  : (
                      temporalText
                    )}

              {highestGoalWindow?.keyFactors && highestGoalWindow.keyFactors.length > 0
                && highestGoalWindow.keyFactors[0] !== 'Normal play' && (
                <span className="ml-1 text-xs opacity-90">
                  (
                  {highestGoalWindow.keyFactors.slice(0, 2).join(', ')}
                  )
                </span>
              )}
            </span>
          </div>
        )}
      </Link>
    </div>
  )
}

// Helper to get high confidence tip text
function getHighConfidenceTip(data: MatchPrediction): string {
  const confidence = data.prediction.confidence
  let confidenceStr = ''

  if (confidence >= 0.9) {
    confidenceStr = 'Very High Confidence'
  }
  else if (confidence >= 0.8) {
    confidenceStr = 'High Confidence'
  }
  else if (confidence >= 0.7) {
    confidenceStr = 'Good Confidence'
  }

  return `${confidenceStr}: ${data.prediction.recommendedBet}`
}
