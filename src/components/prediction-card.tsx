// src/components/prediction-card.tsx

import type { Match, MatchEvent, MatchPrediction, WindowAnalysis } from '@/types'
import { CountryFlag } from '@/components/ui/country-flag'
import { LiveBadge } from '@/components/ui/live-badge'
import { cn, formatScore } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

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

  // Memoized temporal prediction data
  const temporalPrediction = useMemo(() => data.temporalGoalProbability?.windows || [], [data.temporalGoalProbability])
  const activeWindows = useMemo(() => analyzeActiveWindows(temporalPrediction, data.status.minute), [temporalPrediction, data.status.minute])
  const highestGoalWindow = useMemo(() =>
    activeWindows.length > 0
      ? [...activeWindows].sort((a, b) => (b.effectiveProbability || b.probability) - (a.effectiveProbability || a.probability))[0]
      : null, [activeWindows])

  // Dynamic threshold based on match state
  const dynamicThreshold = useMemo(() => {
    const totalGoals = data.teams.home.score + data.teams.away.score
    return totalGoals > 2 ? 0.15 : 0.2
  }, [data.teams.home.score, data.teams.away.score])

  const showTemporalPrediction = highestGoalWindow && (highestGoalWindow.effectiveProbability || highestGoalWindow.probability) > dynamicThreshold

  // Specific window probabilities
  const first15Window = useMemo(() => temporalPrediction.find(w => w.window.label === 'First 15'), [temporalPrediction])
  const final10Window = useMemo(() => temporalPrediction.find(w => w.window.label === 'Final 10'), [temporalPrediction])
  const first15Prob = first15Window ? Math.round(first15Window.probability * 100) : null
  const final10Prob = final10Window ? Math.round(final10Window.probability * 100) : null

  const highlightEarlyGoal = first15Window && first15Window.probability > 0.3 && data.status.minute < 15
  const highlightLateGoal = final10Window && final10Window.probability > 0.3 && data.status.minute >= 80

  // Match state
  const statusText = data.status.status
  const matchMinute = data.status.minute
  const isLive = data.status.isLive
  const hasRedCard = data.stats?.cards?.home?.red > 0 || data.stats?.cards?.away?.red > 0
  const redCardHighlight = hasRedCard && isLive ? 'border-destructive dark:border-destructive' : ''

  // Memoized temporal text
  const temporalText = useMemo(() =>
    highestGoalWindow
      ? `${Math.round((highestGoalWindow.effectiveProbability || highestGoalWindow.probability) * 100)}% Goal in ${highestGoalWindow.window.label}`
      : null, [highestGoalWindow])

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
            <CountryFlag country={data.league.country} imagePath={data.league.logoUrl} size="sm" />
            <span className="text-xs font-medium text-foreground/70 dark:text-foreground/80 truncate max-w-[140px]">
              {data.league.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <LiveBadge status={statusText} minute={matchMinute} />
            {hasRedCard && (
              <span className="text-xs bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive px-1.5 py-0.5 rounded font-medium">
                RC
              </span>
            )}
            {!isLive && statusText !== 'NS' && statusText !== 'HT' && statusText !== 'FT' && (
              <span className="text-xs">{statusText}</span>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex-1 px-3 py-2 flex flex-col justify-between">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="flex flex-row items-center justify-start gap-1">
              <span className="text-xs leading-tight max-w-[80px] text-left">{data.teams.home.name}</span>
              <div className="w-8 h-8 relative">
                <Image src={data.teams.home.logoUrl} alt={data.teams.home.name} fill className="object-contain" sizes="32px" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm opacity-70 font-medium">
                {isLive || statusText === 'HT' || statusText === 'FT' ? 'Score' : 'Match'}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${homeColor} w-6 text-center`}>
                  {data.teams.home.score !== undefined ? data.teams.home.score : '-'}
                </span>
                <span className="text-lg mx-[-2px]">-</span>
                <span className={`text-2xl font-bold ${awayColor} w-6 text-center`}>
                  {data.teams.away.score !== undefined ? data.teams.away.score : '-'}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-8 h-8 relative">
                <Image src={data.teams.away.logoUrl} alt={data.teams.away.name} fill className="object-contain" sizes="32px" />
              </div>
              <span className="text-xs leading-tight max-w-[80px] text-right">{data.teams.away.name}</span>
            </div>
          </div>
          {data.stats && (
            <div className="grid grid-cols-3 items-center text-xs text-center gap-2 mt-3">
              <div className="text-start">
                Poss:
                {data.stats.possession.home}
                %
              </div>
              <div className="flex gap-1 items-center text-center">
                <span>
                  Shots:
                  {data.stats.shots.home.total}
                  {' '}
                  -
                  {data.stats.shots.away.total}
                </span>
                <span className="opacity-40">•</span>
                <span>
                  Corners:
                  {data.stats.corners.home}
                  {' '}
                  -
                  {data.stats.corners.away}
                </span>
              </div>
              <div className="text-end">
                Poss:
                {data.stats.possession.away}
                %
              </div>
            </div>
          )}
        </div>

        {/* Temporal Prediction Panel */}
        {showPrediction && (
          <div className="grid grid-cols-3 border-t border-border/60 mt-auto">
            <div
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1',
                first15Prob && first15Prob > 30 ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <div className="text-xs opacity-80 mb-0.5">Home Next</div>
              <div className="text-xl font-bold">
                {Math.round(data.prediction.winProbability.home * 100)}
                %
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-secondary dark:bg-secondary/30">
              <div className="text-xs opacity-80 mb-0.5">Next Goal</div>
              <div className="text-xl font-bold text-secondary-foreground">
                {data.prediction.goals?.over15 && typeof data.prediction.goals.over15 === 'number'
                  ? `${Math.round(data.prediction.goals.over15 * 100)}%`
                  : '-'}
              </div>
            </div>
            <div
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1',
                final10Prob && final10Prob > 30 ? 'bg-accent/10 text-accent-foreground dark:bg-accent/20 dark:text-accent-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <div className="text-xs opacity-80 mb-0.5">Away Next</div>
              <div className="text-xl font-bold">
                {Math.round(data.prediction.winProbability.away * 100)}
                %
              </div>
            </div>
          </div>
        )}

        {/* High Confidence Tip */}
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

        {/* Temporal Goal Prediction */}
        {!isCompact && highestGoalWindow && (
          <div className={cn(
            'px-3 py-1.5 text-sm font-medium',
            'border-t border-border/60 backdrop-blur-sm',
            showTemporalPrediction ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'bg-muted text-muted-foreground',
          )}
          >
            <span className="flex items-center justify-center gap-1">
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
              {highestGoalWindow?.keyFactors && highestGoalWindow.keyFactors.length > 0 && highestGoalWindow.keyFactors[0] !== 'Normal play' && (
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

// Enhanced High Confidence Tip Logic
function getHighConfidenceTip(data: MatchPrediction): string {
  const { status, temporalGoalProbability, stats } = data
  const currentMinute = status.minute
  const remainingTime = Math.max(MAX_REGULATION_TIME - currentMinute, 0)

  let windows = temporalGoalProbability?.windows || []
  if (!windows.length) {
    const matchData = { events: { data: [] as MatchEvent[] }, ...data }
    windows = analyzeTemporalPatterns(matchData as unknown as Match)
  }

  const phaseWeights = calculatePhaseWeights(currentMinute)
  const timeDecayFactor = 1 - currentMinute / MAX_REGULATION_TIME ** 1.5
  const fatigueImpact = calculateFatigueImpact(currentMinute)
  const scoreDiff = data.teams.home.score - data.teams.away.score
  const goalUrgency = calculateGoalUrgency(scoreDiff, remainingTime)
  const activeWindows = analyzeActiveWindows(windows, currentMinute)

  const predictiveScore = calculatePredictiveScore({
    baseStats: stats,
    activeWindows,
    phaseWeights,
    timeDecay: timeDecayFactor,
    fatigueImpact,
    goalUrgency,
  })

  const matchEvents = (data as any).events?.data || []
  const recentEvents = matchEvents.slice(-3)
  const recentImpact = recentEvents.reduce((sum: number, e: MatchEvent) => sum + getEventImpact(e), 0)
  const adjustedScore = predictiveScore * (1 + recentImpact)

  return generatePredictionMessage(adjustedScore, activeWindows, currentMinute)
}

// Helper Functions (Unchanged from your original unless noted)
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
  const baseScore = baseStats
    ? 0.3 * (
      (baseStats.shots.home.onTarget + baseStats.shots.away.onTarget)
      + 0.5 * (baseStats.attacks.home.dangerous + baseStats.attacks.away.dangerous)
    )
    : 0
  const windowScore = activeWindows.reduce((sum, window) => {
    const windowWeight = CRITICAL_WINDOWS.includes(window.window.label) ? 1.2 : 1
    return sum + (window.probability * windowWeight * (phaseWeights[window.window.label] || phaseWeights.default))
  }, 0)
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
  return remainingTime > 0 ? (1 / (absDiff + 1)) * (remainingTime / MAX_REGULATION_TIME) : 1
}

function analyzeActiveWindows(windows: WindowAnalysis[] = [], currentMinute: number): WindowAnalysis[] {
  return windows
    .filter(w => w.window.end >= currentMinute)
    .map(w => ({
      ...w,
      effectiveProbability: w.probability * Math.exp(-(currentMinute - w.window.start) / 10),
    }))
    .sort((a, b) => (b.effectiveProbability || b.probability) - (a.effectiveProbability || a.probability))
}

function generatePredictionMessage(score: number, windows: WindowAnalysis[], currentMinute: number): string {
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
  return currentMinute > 75 ? 'Late game - monitor key players' : 'Developing match situation'
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

// Placeholder for analyzeTemporalPatterns (simplified)
function analyzeTemporalPatterns(match: Match): WindowAnalysis[] {
  const events = match.events.data
  return CRITICAL_WINDOWS.map((windowLabel) => {
    const window = { start: windowLabel === 'First 15' ? 0 : 80, end: windowLabel === 'First 15' ? 15 : 90, label: windowLabel }
    const windowEvents = events.filter(e => e.minute >= window.start && e.minute <= window.end)
    return {
      window,
      probability: calculateWindowProbability(windowEvents),
      keyFactors: ['Pressure', 'Attacking momentum'],
      pressureIndex: 0,
      dangerRatio: 0,
      shotFrequency: 0,
      setPieceCount: 0,
      goalIntensity: 0,
      patternStrength: 0,
    }
  })
}

function calculateWindowProbability(events: MatchEvent[]): number {
  const score = events.reduce((sum: number, event: MatchEvent) => {
    switch (event.type) {
      case 'goal': return sum + 0.5
      case 'shot': return sum + (event.isDangerous ? 0.4 : 0.2)
      case 'corner': return sum + 0.15
      case 'freekick': return sum + 0.1
      case 'yellowcard': return sum - 0.05
      default: return sum
    }
  }, 0)
  return Math.min(1, Math.max(0, score * 0.7))
}

// Simplified getNextScorerBetColor (adapt as needed)
function getNextScorerBetColor(data: MatchPrediction): string {
  return data.prediction.confidence >= 0.85
    ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary'
    : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
}
