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

  // Check for red cards
  const hasRedCard = data.stats?.cards?.home?.red > 0 || data.stats?.cards?.away?.red > 0

  // Enhanced UI for cards with red cards
  const redCardHighlight = hasRedCard && isLive ? 'border-red-500 dark:border-red-500' : ''

  // Get match start time from data if available
  const matchStartTime = data.lastUpdated // Using lastUpdated as a placeholder - replace with actual start time field

  return (
    <div
      className={cn(
        'h-full rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border',
        'hover:shadow-md transition-all duration-200',
        'active:scale-[0.995] touch-action-manipulation',
        'dark:hover:bg-card/90 dark:shadow-lg dark:shadow-black/10',
        'flex flex-col',
        redCardHighlight,
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
            {/* Live badge with enhanced functionality */}
            <LiveBadge
              status={statusText}
              minute={matchMinute}
              startTime={statusText === 'NS' ? matchStartTime : undefined}
            />

            {/* Red card indicator */}
            {hasRedCard && (
              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
                RC
              </span>
            )}

            {/* Display minute or status */}
            {!isLive && statusText !== 'NS' && statusText !== 'HT' && statusText !== 'FT' && (
              <span className="text-xs">
                {statusText}
              </span>
            )}
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
                  : 'Match'}
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
              <div className="text-xs opacity-80 mb-0.5">Home Next</div>
              <div className={cn(
                'text-xl font-bold',
                first15Prob && first15Prob > 30 ? 'text-blue-600 dark:text-blue-400' : 'text-primary dark:text-primary-foreground',
              )}
              >
                {Math.round(data.prediction.winProbability.home * 100)}
                %
              </div>
            </div>

            {/* Overall goal probability */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-secondary dark:bg-secondary/30">
              <div className="text-xs opacity-80 mb-0.5">Next Goal</div>
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
              <div className="text-xs opacity-80 mb-0.5">Away Next</div>
              <div className={cn(
                'text-xl font-bold',
                final10Prob && final10Prob > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-primary dark:text-primary-foreground',
              )}
              >
                {Math.round(data.prediction.winProbability.away * 100)}
                %
              </div>
            </div>
          </div>
        )}

        {/* Additional info like hot prediction box */}
        {!isCompact && data.prediction.confidence > 0.7 && (
          <div className={cn(
            'px-3 py-1.5 text-sm font-medium',
            'border-t border-border/60 backdrop-blur-sm',
            getNextScorerBetColor(data),
          )}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
              {getHighConfidenceTip(data)}
            </div>
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

  // Determine which team is more likely to score next
  const homeWinProb = data.prediction.winProbability.home
  const awayWinProb = data.prediction.winProbability.away

  // Use ProPredict terminology for high accuracy predictions
  if (confidence >= 0.85) {
    // Check if we have temporal data available for more precise prediction
    if (data.temporalGoalProbability) {
      // If there's momentum analysis, use it to determine next scorer
      if (data.temporalGoalProbability.momentumAnalysis) {
        const attackMomentum = data.temporalGoalProbability.momentumAnalysis.attackMomentum

        if (attackMomentum > 0.6) {
          return `ProPredict: ${data.teams.home.name} will score next (${Math.round(confidence * 100)}%)`
        }
        else if (attackMomentum < 0.4) {
          return `ProPredict: ${data.teams.away.name} will score next (${Math.round(confidence * 100)}%)`
        }
      }

      // Use team comparison if available
      if (data.temporalGoalProbability.teamComparison) {
        const homeStats = data.temporalGoalProbability.teamComparison.home
        const awayStats = data.temporalGoalProbability.teamComparison.away

        if (homeStats.pressureIntensity > awayStats.pressureIntensity * 1.5) {
          return `ProPredict: ${data.teams.home.name} will score next (${Math.round(confidence * 100)}%)`
        }
        else if (awayStats.pressureIntensity > homeStats.pressureIntensity * 1.5) {
          return `ProPredict: ${data.teams.away.name} will score next (${Math.round(confidence * 100)}%)`
        }
      }
    }

    // If no temporal data, use basic stats for high confidence predictions
    if (data.stats) {
      const homePossession = data.stats.possession.home
      const awayPossession = data.stats.possession.away
      const homeShotsOnTarget = data.stats.shots.home.onTarget
      const awayShotsOnTarget = data.stats.shots.away.onTarget
      const homeDangerousAttacks = data.stats.attacks.home.dangerous
      const awayDangerousAttacks = data.stats.attacks.away.dangerous

      // Calculate a simple scoring likelihood score
      const homeScore = (homePossession / 100 * 0.3) + (homeShotsOnTarget * 0.5) + (homeDangerousAttacks * 0.01)
      const awayScore = (awayPossession / 100 * 0.3) + (awayShotsOnTarget * 0.5) + (awayDangerousAttacks * 0.01)

      if (homeScore > awayScore * 1.3) {
        return `ProPredict: ${data.teams.home.name} will score next (${Math.round(confidence * 100)}%)`
      }
      else if (awayScore > homeScore * 1.3) {
        return `ProPredict: ${data.teams.away.name} will score next (${Math.round(confidence * 100)}%)`
      }
    }

    // Fallback to win probability for high confidence cases
    if (homeWinProb > awayWinProb * 1.5) {
      return `ProPredict: ${data.teams.home.name} will score next (${Math.round(confidence * 100)}%)`
    }
    else if (awayWinProb > homeWinProb * 1.5) {
      return `ProPredict: ${data.teams.away.name} will score next (${Math.round(confidence * 100)}%)`
    }

    // Default for high confidence but unclear which team
    return `ProPredict: Goal expected soon (${Math.round(confidence * 100)}%)`
  }
  else if (confidence >= 0.7) {
    // Medium confidence predictions - just indicate a goal is expected
    const goalProb = data.prediction.goals?.over15 || 0
    if (goalProb > 0.65) {
      return `ProPredict: Goal expected (${Math.round(goalProb * 100)}%)`
    }

    // Basic prediction without specifying team for medium confidence
    return `ProPredict: Next goal opportunity (${Math.round(confidence * 100)}%)`
  }

  // Low confidence prediction
  return `ProPredict: Analyzing match data...`
}

// Helper to determine the color for the next scorer bet box
function getNextScorerBetColor(data: MatchPrediction): string {
  // Default color for ProPredict
  let betBoxColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

  const confidence = data.prediction.confidence

  // High confidence predictions get more vibrant colors
  if (confidence >= 0.85) {
    // Determine which team is more likely to score next
    const isHomeTeamLikely = isHomeTeamLikelyToScoreNext(data)
    const isAwayTeamLikely = isAwayTeamLikelyToScoreNext(data)

    if (isHomeTeamLikely) {
      // More vibrant yellow for home team
      betBoxColor = 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800/50 dark:text-yellow-200'
    }
    else if (isAwayTeamLikely) {
      // More vibrant blue for away team
      betBoxColor = 'bg-blue-200 text-blue-900 dark:bg-blue-800/50 dark:text-blue-200'
    }
    else {
      // For high confidence but unclear which team, use a vibrant green
      const goalProb = data.prediction.goals?.over15 || 0
      if (goalProb > 0.65) {
        betBoxColor = 'bg-green-200 text-green-900 dark:bg-green-800/50 dark:text-green-200'
      }
      else {
        // For high confidence general predictions - purple gradient
        betBoxColor = 'bg-gradient-to-r from-indigo-200 to-purple-200 text-purple-900 dark:bg-gradient-to-r dark:from-indigo-900/50 dark:to-purple-900/50 dark:text-purple-200'
      }
    }
  }
  else if (confidence >= 0.7) {
    // Medium confidence - more muted colors but still clear
    const goalProb = data.prediction.goals?.over15 || 0
    if (goalProb > 0.65) {
      betBoxColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    }
    else {
      betBoxColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    }
  }

  return betBoxColor
}

// Helper to check if home team is likely to score next
function isHomeTeamLikelyToScoreNext(data: MatchPrediction): boolean {
  const homeWinProb = data.prediction.winProbability.home
  const awayWinProb = data.prediction.winProbability.away

  // Check temporal data first
  if (data.temporalGoalProbability) {
    if (data.temporalGoalProbability.momentumAnalysis) {
      const attackMomentum = data.temporalGoalProbability.momentumAnalysis.attackMomentum
      if (attackMomentum > 0.6)
        return true
    }

    if (data.temporalGoalProbability.teamComparison) {
      const homeStats = data.temporalGoalProbability.teamComparison.home
      const awayStats = data.temporalGoalProbability.teamComparison.away
      if (homeStats.pressureIntensity > awayStats.pressureIntensity * 1.5)
        return true
    }
  }

  // Check basic stats
  if (data.stats) {
    const homePossession = data.stats.possession.home
    const awayPossession = data.stats.possession.away
    const homeShotsOnTarget = data.stats.shots.home.onTarget
    const awayShotsOnTarget = data.stats.shots.away.onTarget
    const homeDangerousAttacks = data.stats.attacks.home.dangerous
    const awayDangerousAttacks = data.stats.attacks.away.dangerous

    const homeScore = (homePossession / 100 * 0.3) + (homeShotsOnTarget * 0.5) + (homeDangerousAttacks * 0.01)
    const awayScore = (awayPossession / 100 * 0.3) + (awayShotsOnTarget * 0.5) + (awayDangerousAttacks * 0.01)

    if (homeScore > awayScore * 1.3)
      return true
  }

  // Fall back to win probability
  return homeWinProb > awayWinProb * 1.5
}

// Helper to check if away team is likely to score next
function isAwayTeamLikelyToScoreNext(data: MatchPrediction): boolean {
  const homeWinProb = data.prediction.winProbability.home
  const awayWinProb = data.prediction.winProbability.away

  // Check temporal data first
  if (data.temporalGoalProbability) {
    if (data.temporalGoalProbability.momentumAnalysis) {
      const attackMomentum = data.temporalGoalProbability.momentumAnalysis.attackMomentum
      if (attackMomentum < 0.4)
        return true
    }

    if (data.temporalGoalProbability.teamComparison) {
      const homeStats = data.temporalGoalProbability.teamComparison.home
      const awayStats = data.temporalGoalProbability.teamComparison.away
      if (awayStats.pressureIntensity > homeStats.pressureIntensity * 1.5)
        return true
    }
  }

  // Check basic stats
  if (data.stats) {
    const homePossession = data.stats.possession.home
    const awayPossession = data.stats.possession.away
    const homeShotsOnTarget = data.stats.shots.home.onTarget
    const awayShotsOnTarget = data.stats.shots.away.onTarget
    const homeDangerousAttacks = data.stats.attacks.home.dangerous
    const awayDangerousAttacks = data.stats.attacks.away.dangerous

    const homeScore = (homePossession / 100 * 0.3) + (homeShotsOnTarget * 0.5) + (homeDangerousAttacks * 0.01)
    const awayScore = (awayPossession / 100 * 0.3) + (awayShotsOnTarget * 0.5) + (awayDangerousAttacks * 0.01)

    if (awayScore > homeScore * 1.3)
      return true
  }

  // Fall back to win probability
  return awayWinProb > homeWinProb * 1.5
}
