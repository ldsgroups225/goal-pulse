import type { Match, MatchEvent, MatchPrediction, WindowAnalysis } from '@/types'
import { CountryFlag } from '@/components/ui/country-flag'
import { LiveBadge } from '@/components/ui/live-badge'
import { cn, formatScore } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Constants
const MAX_REGULATION_TIME = 90
const CRITICAL_WINDOWS = ['First 15', 'Final 10']

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
  const router = useRouter()

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
      <button
        type="button"
        onDoubleClick={() => router.push(`/${data.fixtureId}`)}
        className="flex-1 flex flex-col h-full"
      >
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
      </button>
    </div>
  )
}

// Helper to get high confidence tip text
function getHighConfidenceTip(data: MatchPrediction): string {
  const { status, /* prediction, */ temporalGoalProbability, stats } = data
  const currentMinute = status.minute
  const remainingTime = Math.max(MAX_REGULATION_TIME - currentMinute, 0)

  // If temporal data is missing, generate it using the temporal analysis
  let windows = temporalGoalProbability?.windows
  if (!windows || windows.length === 0) {
    // Create a simplified Match object with just the properties we need
    const matchData = {
      events: { data: [] as MatchEvent[] }, // Empty events array as fallback
      ...data,
    }
    windows = analyzeTemporalPatterns(matchData as unknown as Match)
  }

  // Temporal decay model with phase awareness
  const phaseWeights = calculatePhaseWeights(currentMinute)
  const timeDecayFactor = 1 - currentMinute / MAX_REGULATION_TIME ** 1.5

  // Fatigue model using exponential decay
  const fatigueImpact = calculateFatigueImpact(currentMinute)

  // Score difference dynamics
  const scoreDiff = data.teams.home.score - data.teams.away.score
  const goalUrgency = calculateGoalUrgency(scoreDiff, remainingTime)

  // Active window analysis
  const activeWindows = analyzeActiveWindows(windows, currentMinute)

  // Combined predictive model
  const predictiveScore = calculatePredictiveScore({
    baseStats: stats,
    activeWindows,
    phaseWeights,
    timeDecay: timeDecayFactor,
    fatigueImpact,
    goalUrgency,
  })

  // Check if there are recent events to adjust the prediction
  const matchEvents = (data as any).events?.data
  if (matchEvents && Array.isArray(matchEvents) && matchEvents.length > 0) {
    // Get the last few events to check for recent changes
    const recentEvents = matchEvents.slice(-3)
    // Create a copy of the prediction to adjust
    const adjustedPrediction = adjustPrediction(data, recentEvents)

    // If the adjustment significantly changed the prediction, reflect that in the message
    if (adjustedPrediction.temporalGoalProbability?.windows !== windows) {
      return generatePredictionMessage(
        predictiveScore * 1.1, // Increase the score slightly for recent events
        adjustedPrediction.temporalGoalProbability?.windows || activeWindows,
        currentMinute,
      )
    }
  }

  return generatePredictionMessage(predictiveScore, activeWindows, currentMinute)
}

// Helper functions
interface PredictiveParams {
  baseStats: MatchPrediction['stats']
  activeWindows: WindowAnalysis[]
  phaseWeights: Record<string, number>
  timeDecay: number
  fatigueImpact: number
  goalUrgency: number
}

function calculatePredictiveScore(params: PredictiveParams): number {
  const { baseStats, activeWindows, phaseWeights, timeDecay, fatigueImpact, goalUrgency } = params

  // Base statistics component
  const baseScore = 0.3 * (
    (baseStats.shots.home.onTarget + baseStats.shots.away.onTarget)
    + 0.5 * (baseStats.attacks.home.dangerous + baseStats.attacks.away.dangerous)
  )

  // Temporal window component
  const windowScore = activeWindows.reduce((sum, window) => {
    const windowWeight = CRITICAL_WINDOWS.includes(window.window.label) ? 1.2 : 1
    return sum + (window.probability * windowWeight * phaseWeights[window.window.label])
  }, 0)

  // Environmental factors
  const environmentScore = 0.4 * timeDecay * fatigueImpact * goalUrgency

  return (baseScore + windowScore + environmentScore) / 2.5
}

function calculatePhaseWeights(currentMinute: number): Record<string, number> {
  return {
    'First 15': Math.max(0, 1 - (currentMinute / 15)),
    'Final 10': currentMinute >= 80 ? 1 : Math.min(1, (currentMinute - 70) / 10),
    'default': 1 - (currentMinute / MAX_REGULATION_TIME) ** 2,
  }
}

function calculateFatigueImpact(currentMinute: number): number {
  return 0.7 + 0.3 * Math.exp(-currentMinute / 100)
}

function calculateGoalUrgency(scoreDiff: number, remainingTime: number): number {
  const absDiff = Math.abs(scoreDiff)
  return remainingTime > 0
    ? (1 / (absDiff + 1)) * (remainingTime / MAX_REGULATION_TIME)
    : 1
}

function analyzeActiveWindows(windows: WindowAnalysis[] = [], currentMinute: number): WindowAnalysis[] {
  return windows
    .filter(w => w.window.end >= currentMinute)
    .map(w => ({
      ...w,
      effectiveProbability: w.probability
        * Math.exp(-(currentMinute - w.window.start) / 10),
    }))
    .sort((a, b) => (b.effectiveProbability || b.probability) - (a.effectiveProbability || a.probability))
}

function generatePredictionMessage(
  score: number,
  windows: WindowAnalysis[],
  currentMinute: number,
): string {
  const criticalWindow = windows.find(w =>
    CRITICAL_WINDOWS.includes(w.window.label)
    && (w.effectiveProbability || w.probability) > 0.4,
  )

  if (criticalWindow) {
    const timeLeft = criticalWindow.window.end - currentMinute
    return `${Math.round(score * 100)}% chance of goal in next ${timeLeft} mins (${criticalWindow.window.label})`
  }

  const bestWindow = windows[0]
  if (bestWindow && (bestWindow.effectiveProbability || bestWindow.probability) > 0.35) {
    return `${Math.round(score * 100)}% goal potential in ${bestWindow.window.label}`
  }

  return currentMinute > 75
    ? 'Late game - monitor key players'
    : 'Developing match situation'
}

// Real-time prediction adjustment
function adjustPrediction(
  prediction: MatchPrediction,
  newEvents: MatchEvent[],
): MatchPrediction {
  if (!prediction.temporalGoalProbability?.windows) {
    return prediction
  }

  const updatedWindows = prediction.temporalGoalProbability.windows.map((w) => {
    const recentEvents = newEvents.filter(e =>
      e.minute >= w.window.start
      && e.minute <= w.window.end,
    )

    return {
      ...w,
      probability: Math.min(1, w.probability
      + recentEvents.reduce((sum, e) => sum + getEventImpact(e), 0)),
    }
  })

  // Create required structure for temporalGoalProbability including all required fields
  return {
    ...prediction,
    temporalGoalProbability: {
      windows: updatedWindows,
      keyMoments: prediction.temporalGoalProbability.keyMoments || {
        preWindowGoals: [],
        pressureBuildUp: [],
        defensiveErrors: [],
      },
      teamComparison: prediction.temporalGoalProbability.teamComparison || {
        home: {
          pressureIntensity: 0,
          defensiveActions: 0,
          transitionSpeed: 0,
          setPieceEfficiency: 0,
        },
        away: {
          pressureIntensity: 0,
          defensiveActions: 0,
          transitionSpeed: 0,
          setPieceEfficiency: 0,
        },
      },
      momentumAnalysis: prediction.temporalGoalProbability.momentumAnalysis || {
        attackMomentum: 0.5,
        defenseStability: 0.5,
        fatigueIndex: 0,
      },
      lastUpdated: new Date().toISOString(),
    },
  }
}

function getEventImpact(event: MatchEvent): number {
  switch (event.type) {
    case 'goal': return 0.15
    case 'shot': return event.isDangerous ? 0.08 : 0.03
    case 'corner': return 0.05
    case 'freekick': return 0.04
    case 'redcard': return -0.1
    default: return 0
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

// Temporal analysis enhancement
function analyzeTemporalPatterns(match: Match): WindowAnalysis[] {
  const events = match.events.data
  return CRITICAL_WINDOWS.map((windowLabel) => {
    // Create a window object structure matching the expected format
    const window = {
      start: windowLabel === 'First 15' ? 0 : 80,
      end: windowLabel === 'First 15' ? 15 : 90,
      label: windowLabel,
    }

    const windowEvents = events.filter(e =>
      e.minute >= window.start && e.minute <= window.end,
    )

    return {
      window,
      probability: calculateWindowProbability(windowEvents),
      keyFactors: identifyKeyFactors(windowEvents),
      pressureIndex: calculatePressureIndex(windowEvents),
      dangerRatio: calculateDangerRatio(windowEvents),
      shotFrequency: calculateShotFrequency(windowEvents),
      setPieceCount: countSetPieces(windowEvents),
      goalIntensity: calculateGoalIntensity(windowEvents),
      patternStrength: detectPatterns(windowEvents),
    }
  })
}

function calculateWindowProbability(events: MatchEvent[]): number {
  const weights = {
    shotOnTarget: 0.3,
    dangerousAttack: 0.2,
    corner: 0.15,
    freekick: 0.1,
    yellowCard: -0.05,
  }

  // Apply the weights to calculate the weighted probability
  let baseScore = 0
  events.forEach((event) => {
    if (event.isDangerous && event.type === 'shot') {
      baseScore += weights.shotOnTarget
    }
    else if (event.type === 'corner') {
      baseScore += weights.corner
    }
    else if (event.type === 'freekick') {
      baseScore += weights.freekick
    }
    else if (event.type === 'yellowcard') {
      baseScore += weights.yellowCard
    }
  })

  const score = events.reduce((sum, event) => {
    switch (event.type) {
      case 'goal': return sum + 0.5
      case 'shot': return sum + (event.isDangerous ? 0.4 : 0.2)
      case 'corner': return sum + 0.15
      case 'freekick': return sum + 0.1
      case 'yellowcard': return sum - 0.05
      default: return sum
    }
  }, baseScore) // Start with the base score calculated using weights

  return Math.min(1, Math.max(0, score * 0.7))
}

// Placeholder functions that would be implemented in a full solution
function identifyKeyFactors(_events: MatchEvent[]): string[] {
  return ['Pressure', 'Attacking momentum']
}

function calculatePressureIndex(events: MatchEvent[]): number {
  return Math.min(1, events.length * 0.1)
}

function calculateDangerRatio(events: MatchEvent[]): number {
  const dangerousEvents = events.filter(e => e.isDangerous)
  return events.length > 0 ? dangerousEvents.length / events.length : 0
}

function calculateShotFrequency(events: MatchEvent[]): number {
  return events.filter(e => e.type === 'shot').length
}

function countSetPieces(events: MatchEvent[]): number {
  return events.filter(e => e.type === 'freekick' || e.type === 'corner').length
}

function calculateGoalIntensity(events: MatchEvent[]): number {
  return events.filter(e => e.type === 'goal').length * 0.5
}

function detectPatterns(_events: MatchEvent[]): number {
  // Simplified implementation - would be more sophisticated in production
  return Math.random() * 0.5 + 0.2 // Return a random value between 0.2 and 0.7
}
