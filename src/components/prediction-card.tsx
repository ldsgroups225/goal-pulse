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

          <LiveBadge
            minute={data.status.minute}
            status={data.status.status}
            period={data.status.status === 'LIVE' ? 'MT2' : undefined}
          />
        </div>

        {/* Teams & Score */}
        <div className="px-4 py-3 flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 relative flex-shrink-0 bg-white/30 dark:bg-white/10 rounded-full p-0.5 shadow-inner">
                <Image
                  src={data.teams.home.logoUrl || '/placeholder-team.png'}
                  alt={data.teams.home.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-medium truncate text-foreground">
                {data.teams.home.name}
              </span>
            </div>

            <div className="flex items-center gap-2 mx-2 backdrop-blur-sm px-2 py-0.5 rounded-md bg-secondary/30 dark:bg-secondary/20">
              <span className={cn('text-base font-bold', homeColor)}>
                {data.teams.home.score}
              </span>
              <span className="text-foreground/30 dark:text-foreground/50">-</span>
              <span className={cn('text-base font-bold', awayColor)}>
                {data.teams.away.score}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium truncate text-foreground">
                {data.teams.away.name}
              </span>
              <div className="w-6 h-6 relative flex-shrink-0 bg-white/30 dark:bg-white/10 rounded-full p-0.5 shadow-inner">
                <Image
                  src={data.teams.away.logoUrl || '/placeholder-team.png'}
                  alt={data.teams.away.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Stats row (only for non-compact view) */}
          {!isCompact && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 bg-secondary/50 dark:bg-secondary/20 p-1.5 rounded-md">
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

        {/* Prediction Boxes */}
        {showPrediction && (
          <div className="grid grid-cols-3 border-t border-border/60 mt-auto">
            {/* Home odds or Prediction */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-primary/5 dark:bg-primary/10">
              <div className="text-xs opacity-80 mb-0.5">
                {data.teams.home.name.length > 8
                  ? `${data.teams.home.name.substring(0, 8)}..`
                  : data.teams.home.name}
              </div>
              <div className="text-xl font-bold text-primary dark:text-primary-foreground">
                {getOddsDisplay(data.prediction.winProbability.home)}
              </div>
            </div>

            {/* Draw odds or Over/Under */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-secondary dark:bg-secondary/30">
              <div className="text-xs opacity-80 mb-0.5">Nul</div>
              <div className="text-xl font-bold text-secondary-foreground">
                {getOddsDisplay(1 / data.prediction.winProbability.draw)}
              </div>
            </div>

            {/* Away odds */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-primary/5 dark:bg-primary/10">
              <div className="text-xs opacity-80 mb-0.5">
                {data.teams.away.name.length > 8
                  ? `${data.teams.away.name.substring(0, 8)}..`
                  : data.teams.away.name}
              </div>
              <div className="text-xl font-bold text-primary dark:text-primary-foreground">
                {getOddsDisplay(1 / data.prediction.winProbability.away)}
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
      </Link>
    </div>
  )
}

// Helper function to convert probability to odds and display
function getOddsDisplay(probability: number): string {
  if (!probability || probability <= 0)
    return '-'
  const odds = (1 / probability).toFixed(2)
  return odds
}

// Helper to get high confidence tip text
function getHighConfidenceTip(data: MatchPrediction): string {
  const confidence = data.prediction.confidence
  const recommendedBet = data.prediction.recommendedBet

  // Add emojis based on confidence level
  let emoji = ''
  if (confidence >= 0.85) {
    emoji = '🔥 '
  }
  else if (confidence >= 0.75) {
    emoji = '💡 '
  }

  return `${emoji}${recommendedBet}`
}
