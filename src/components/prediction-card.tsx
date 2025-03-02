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
                {data.prediction.goals?.over15 && typeof data.prediction.goals.over15 === 'number'
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
  // Extract match state data
  const { status, prediction, temporalGoalProbability, stats } = data
  const confidence = prediction.confidence
  const isLive = status.isLive

  // Calculate remaining time (important for prediction weighting)
  const remainingMinutes = isLive ? Math.max(90 - status.minute, 0) : 90
  const matchPhase = remainingMinutes >= 75 ? 'early' : remainingMinutes >= 45 ? 'mid' : remainingMinutes >= 15 ? 'late' : 'final'

  // Time-weighted confidence modifier (predictions become more accurate as match progresses)
  const timeConfidenceMultiplier = isLive ? Math.min(1.15, 1 + ((90 - remainingMinutes) / 200)) : 1
  const adjustedConfidence = Math.min(0.98, confidence * timeConfidenceMultiplier)

  // Get current score difference and calculate comeback likelihood
  const scoreDifference = data.teams.home.score - data.teams.away.score
  const homeLeading = scoreDifference > 0
  const awayLeading = scoreDifference < 0
  const leadMagnitude = Math.abs(scoreDifference)

  // Calculate urgency factor based on score difference and time
  const urgencyFactor = (leadMagnitude / (remainingMinutes + 10)) * 10

  // Create advanced scoring likelihood model
  function calculateScoringLikelihood(teamType: 'home' | 'away'): number {
    const isHome = teamType === 'home'
    const opposingTeam = isHome ? 'away' : 'home'

    // Base stats
    const possession = stats?.possession[teamType] || 50
    const shotsOnTarget = stats?.shots[teamType]?.onTarget || 0
    const shotsTotal = stats?.shots[teamType]?.total || 0
    const dangerousAttacks = stats?.attacks[teamType]?.dangerous || 0
    const opposingRedCards = stats?.cards[opposingTeam]?.red || 0

    // Advanced stats when available
    let pressureIntensity = 0
    let transitionSpeed = 0
    let defensiveActions = 0
    let setPieceEfficiency = 0
    let attackMomentum = 0

    if (temporalGoalProbability?.teamComparison) {
      const teamStats = temporalGoalProbability.teamComparison[teamType]
      pressureIntensity = teamStats?.pressureIntensity || 0
      transitionSpeed = teamStats?.transitionSpeed || 0
      defensiveActions = teamStats?.defensiveActions || 0
      setPieceEfficiency = teamStats?.setPieceEfficiency || 0

      if (temporalGoalProbability.momentumAnalysis) {
        attackMomentum = isHome
          ? temporalGoalProbability.momentumAnalysis.attackMomentum
          : 1 - temporalGoalProbability.momentumAnalysis.attackMomentum
      }
    }

    // Calculate fatigue factor
    const fatigueFactor = remainingMinutes < 30 ? 0.9 - (remainingMinutes / 100) : 1

    // Urgency multiplier based on score and time
    const urgencyMultiplier = isHome
      ? (homeLeading ? 0.85 : awayLeading ? 1.2 : 1) * (1 + urgencyFactor / 10)
      : (awayLeading ? 0.85 : homeLeading ? 1.2 : 1) * (1 + urgencyFactor / 10)

    // Time-based factors (teams often score at specific times)
    const timePatternFactor = (matchPhase === 'early' && remainingMinutes > 85)
      ? 1.1 // Early goals
      : (matchPhase === 'mid' && Math.abs(remainingMinutes - 45) < 5)
          ? 1.15 // End of halves
          : (matchPhase === 'late')
              ? 1.2 // Last 15 mins
              : (matchPhase === 'final' && remainingMinutes < 5)
                  ? 1.3 // Final minutes
                  : 1

    // Calculate raw scoring likelihood
    const rawLikelihood = (possession / 100 * 0.2)
      + (shotsOnTarget * 0.3)
      + (shotsTotal * 0.1)
      + (dangerousAttacks * 0.008)
      + (pressureIntensity * 0.15)
      + (transitionSpeed * 0.12)
      + (setPieceEfficiency * 0.1)
      + (attackMomentum * 0.25)
      + (opposingRedCards * 0.5)
      - (defensiveActions * 0.05)

    // Apply modifiers
    return rawLikelihood * urgencyMultiplier * timePatternFactor * fatigueFactor
  }

  // Get highest probability windows if available
  const highProbabilityWindows: Array<{ team: 'home' | 'away', windowStart: number, probability: number }> = []

  if (temporalGoalProbability?.windows && isLive) {
    // Find windows that include current match time
    const relevantWindows = temporalGoalProbability.windows.filter(w =>
      (w.window.start <= status.minute && w.window.end >= status.minute),
    )

    if (relevantWindows.length > 0) {
      // Determine which team is more likely to score in these windows
      const homeAttackMomentum = temporalGoalProbability.momentumAnalysis?.attackMomentum || 0.5
      relevantWindows.forEach((window) => {
        const homeProb = window.probability * homeAttackMomentum
        const awayProb = window.probability * (1 - homeAttackMomentum)

        if (homeProb > 0.3) {
          highProbabilityWindows.push({
            team: 'home',
            windowStart: window.window.start,
            probability: homeProb,
          })
        }

        if (awayProb > 0.3) {
          highProbabilityWindows.push({
            team: 'away',
            windowStart: window.window.start,
            probability: awayProb,
          })
        }
      })

      // Sort by probability
      highProbabilityWindows.sort((a, b) => b.probability - a.probability)
    }
  }

  // Calculate team scoring likelihoods
  const homeLikelihood = calculateScoringLikelihood('home')
  const awayLikelihood = calculateScoringLikelihood('away')
  const likelihoodRatio = homeLikelihood / Math.max(0.1, awayLikelihood)
  const percentageConfidence = Math.round(adjustedConfidence * 100)

  // Very high confidence predictions with extensive data and time context
  if (adjustedConfidence >= 0.88) {
    // If we have high probability windows in the current time, use them for very precise predictions
    if (highProbabilityWindows.length > 0 && highProbabilityWindows[0].probability > 0.6) {
      const topWindow = highProbabilityWindows[0]
      const team = data.teams[topWindow.team].name
      const windowEnd = Math.min(status.minute + 10, 90)

      return `ProPredict: ${team} to score between ${status.minute}'-${windowEnd}' (${percentageConfidence}%)`
    }

    // Use advanced team comparison from calculated likelihoods
    if (likelihoodRatio > 1.8) {
      return `ProPredict: ${data.teams.home.name} will score next (${percentageConfidence}%)`
    }
    else if (likelihoodRatio < 0.55) {
      return `ProPredict: ${data.teams.away.name} will score next (${percentageConfidence}%)`
    }

    // Determine if we expect goals based on match state
    const overUnderThreshold = matchPhase === 'late' ? 0.7 : 0.75
    if (prediction.goals?.over15 > overUnderThreshold) {
      if (remainingMinutes < 15) {
        return `ProPredict: Goal imminent (${percentageConfidence}%)`
      }
      return `ProPredict: Goal expected soon (${percentageConfidence}%)`
    }

    // Add a default return for the high confidence block
    return `ProPredict: High confidence prediction (${percentageConfidence}%)`
  }
  else if (adjustedConfidence >= 0.78) {
    // Different message based on match phase
    if (matchPhase === 'early') {
      const likelyTeam = likelihoodRatio > 1.5
        ? data.teams.home.name
        : likelihoodRatio < 0.67 ? data.teams.away.name : null

      if (likelyTeam) {
        return `ProPredict: ${likelyTeam} creating early chances (${percentageConfidence}%)`
      }
      return `ProPredict: Early goal opportunity (${percentageConfidence}%)`
    }

    if (matchPhase === 'mid') {
      const goalProb = data.prediction.goals?.over15 || 0
      if (goalProb > 0.7) {
        return `ProPredict: Goal before halftime (${Math.round(goalProb * 100)}%)`
      }
      return `ProPredict: Mid-match analysis inconclusive (${percentageConfidence}%)`
    }

    if (matchPhase === 'late' || matchPhase === 'final') {
      if (scoreDifference !== 0) {
        const leadingTeam = homeLeading ? data.teams.home.name : data.teams.away.name
        const trailingTeam = homeLeading ? data.teams.away.name : data.teams.home.name
        const trailingLikelihood = homeLeading ? awayLikelihood : homeLikelihood

        if (trailingLikelihood > 0.6 && urgencyFactor > 1) {
          return `ProPredict: ${trailingTeam} pushing for equalizer (${percentageConfidence}%)`
        }
        return `ProPredict: ${leadingTeam} likely to hold lead (${percentageConfidence}%)`
      }
      else {
        return `ProPredict: Match finely balanced (${percentageConfidence}%)`
      }
    }

    // Default high confidence message
    return `ProPredict: Goal opportunity building (${percentageConfidence}%)`
  }
  else if (adjustedConfidence >= 0.65) {
    const goalProb = data.prediction.goals?.over15 || 0
    const bttsProb = prediction.goals?.btts || 0

    if (scoreDifference === 0 && bttsProb > 0.7 && remainingMinutes > 30) {
      return `ProPredict: Both teams to score (${Math.round(bttsProb * 100)}%)`
    }

    if (goalProb > 0.65) {
      if (matchPhase === 'late' || matchPhase === 'final') {
        return `ProPredict: Late goal expected (${Math.round(goalProb * 100)}%)`
      }
      return `ProPredict: Goal likely (${Math.round(goalProb * 100)}%)`
    }

    return `ProPredict: Analyzing match patterns (${percentageConfidence}%)`
  }
  else {
    // Low confidence or insufficient data
    return `ProPredict: Analyzing match data...`
  }
}

// Helper to determine the color for the next scorer bet box
function getNextScorerBetColor(data: MatchPrediction): string {
  // Default color for ProPredict
  let betBoxColor = 'bg-card/60 text-card-foreground dark:bg-card/40 dark:text-card-foreground'

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
        betBoxColor = 'bg-gradient-to-r from-indigo-200 to-purple-200 text-purple-900 dark:from-indigo-900/50 dark:to-purple-900/50 dark:text-purple-200'
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
  const homeWinProb = data.prediction.winProbability?.home || 0
  const awayWinProb = data.prediction.winProbability?.away || 0

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
      if (homeStats?.pressureIntensity > (awayStats?.pressureIntensity || 0) * 1.5)
        return true
    }
  }

  // Check basic stats
  if (data.stats) {
    const homePossession = data.stats.possession?.home || 50
    const awayPossession = data.stats.possession?.away || 50
    const homeShotsOnTarget = data.stats.shots?.home?.onTarget || 0
    const awayShotsOnTarget = data.stats.shots?.away?.onTarget || 0
    const homeDangerousAttacks = data.stats.attacks?.home?.dangerous || 0
    const awayDangerousAttacks = data.stats.attacks?.away?.dangerous || 0

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
  const homeWinProb = data.prediction.winProbability?.home || 0
  const awayWinProb = data.prediction.winProbability?.away || 0

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
      if (awayStats?.pressureIntensity > (homeStats?.pressureIntensity || 0) * 1.5)
        return true
    }
  }

  // Check basic stats
  if (data.stats) {
    const homePossession = data.stats.possession?.home || 50
    const awayPossession = data.stats.possession?.away || 50
    const homeShotsOnTarget = data.stats.shots?.home?.onTarget || 0
    const awayShotsOnTarget = data.stats.shots?.away?.onTarget || 0
    const homeDangerousAttacks = data.stats.attacks?.home?.dangerous || 0
    const awayDangerousAttacks = data.stats.attacks?.away?.dangerous || 0

    const homeScore = (homePossession / 100 * 0.3) + (homeShotsOnTarget * 0.5) + (homeDangerousAttacks * 0.01)
    const awayScore = (awayPossession / 100 * 0.3) + (awayShotsOnTarget * 0.5) + (awayDangerousAttacks * 0.01)

    if (awayScore > homeScore * 1.3)
      return true
  }

  // Fall back to win probability
  return awayWinProb > homeWinProb * 1.5
}
