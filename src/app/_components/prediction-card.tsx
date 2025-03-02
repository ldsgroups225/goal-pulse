'use client'

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

  // Calculate goal tip colors
  const bttsProb = data.prediction.goals.btts
  const over25Prob = data.prediction.goals.over25

  const bttsColor = bttsProb >= 0.65 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
  const over25Color = over25Prob >= 0.65 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'

  // Calculate suggested bet with color
  const recommendedBet = data.prediction.recommendedBet
  let betBoxColor = 'bg-gray-100 text-gray-800'

  if (recommendedBet.includes('Home Win')) {
    betBoxColor = 'bg-yellow-100 text-yellow-800'
  }
  else if (recommendedBet.includes('Away Win')) {
    betBoxColor = 'bg-blue-100 text-blue-800'
  }
  else if (recommendedBet.includes('Draw')) {
    betBoxColor = 'bg-gray-100 text-gray-800'
  }
  else if (recommendedBet.includes('Over')) {
    betBoxColor = 'bg-green-100 text-green-800'
  }
  else if (recommendedBet.includes('Under')) {
    betBoxColor = 'bg-purple-100 text-purple-800'
  }
  else if (recommendedBet.includes('BTTS')) {
    betBoxColor = 'bg-pink-100 text-pink-800'
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100',
        'hover:shadow-md transition-shadow duration-200',
        'active:scale-[0.995] touch-action-manipulation',
        className,
      )}
    >
      <Link href={`/${data.fixtureId}`} className="block">
        {/* Card Header - League & Status */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <CountryFlag
              country={data.league.country}
              imagePath={data.league.logoUrl}
              size="sm"
            />
            <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
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
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-5 h-5 relative flex-shrink-0">
                <Image
                  src={data.teams.home.logoUrl || '/placeholder-team.png'}
                  alt={data.teams.home.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-medium truncate">
                {data.teams.home.name}
              </span>
            </div>

            <div className="flex items-center gap-2 mx-2">
              <span className={cn('text-base font-bold', homeColor)}>
                {data.teams.home.score}
              </span>
              <span className="text-gray-400">-</span>
              <span className={cn('text-base font-bold', awayColor)}>
                {data.teams.away.score}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium truncate">
                {data.teams.away.name}
              </span>
              <div className="w-5 h-5 relative flex-shrink-0">
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
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
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
                <span>•</span>
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
          <div className="grid grid-cols-3 border-t border-gray-100">
            {/* Home odds or Prediction */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-yellow-50">
              {data.teams.home.name.length > 10
                ? data.teams.home.name.substring(0, 10)
                : data.teams.home.name}
              <div className="text-xl font-bold text-yellow-800">
                {getOddsDisplay(data.prediction.winProbability.home)}
              </div>
            </div>

            {/* Draw odds or Over/Under */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-50">
              <div className="text-xs text-emerald-700">Nul</div>
              <div className="text-xl font-bold text-emerald-800">
                {getOddsDisplay(1 / data.prediction.winProbability.draw)}
              </div>
            </div>

            {/* Away odds */}
            <div className="flex flex-col items-center justify-center py-2 px-1 bg-yellow-50">
              {data.teams.away.name.length > 10
                ? data.teams.away.name.substring(0, 10)
                : data.teams.away.name}
              <div className="text-xl font-bold text-yellow-800">
                {getOddsDisplay(1 / data.prediction.winProbability.away)}
              </div>
            </div>
          </div>
        )}

        {/* Additional info like hot prediction box */}
        {!isCompact && data.prediction.confidence > 0.7 && (
          <div className={cn(
            'px-3 py-1 text-sm font-medium text-center',
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
  if (probability <= 0 || probability > 1) {
    return '-'
  }

  // Convert probability to decimal odds
  const odds = (1 / probability).toFixed(2)
  return odds
}

// Helper to get high confidence tip text
function getHighConfidenceTip(data: MatchPrediction): string {
  const { recommendedBet } = data.prediction

  if (recommendedBet === 'Home Win') {
    return `Grosse occasion pour ${data.teams.home.name} !`
  }
  else if (recommendedBet === 'Away Win') {
    return `Grosse occasion pour ${data.teams.away.name} !`
  }
  else if (recommendedBet.includes('Over')) {
    return 'Forte probabilité de buts !'
  }
  else if (recommendedBet === 'Draw') {
    return 'Match nul probable'
  }
  else {
    return recommendedBet
  }
}
