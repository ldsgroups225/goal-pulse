import type { MatchPrediction } from '@/types'
import { CountryFlag } from '@/components/ui/country-flag'
import { LiveBadge } from '@/components/ui/live-badge'
import { cn, formatScore } from '@/lib/utils'
import Image from 'next/image'
import { useMemo } from 'react'

interface PredictionCardProps {
  data: MatchPrediction
  className?: string
}

export function PredictionCard({ data, className }: PredictionCardProps) {
  // Core match state
  const { homeColor, awayColor } = formatScore(data.teams.home.score, data.teams.away.score)
  const isLive = data.status.isLive
  const statusText = data.status.status
  const matchMinute = data.status.minute
  const hasRedCard = (data.stats?.cards?.home?.red || 0) > 0 || (data.stats?.cards?.away?.red || 0) > 0

  // Simplified temporal prediction
  const temporalPrediction = useMemo(() => data.temporalGoalProbability?.windows || [], [data.temporalGoalProbability])
  const highestWindow = useMemo(() => {
    const activeWindows = temporalPrediction.filter(w => w.window.end >= matchMinute)
    return activeWindows.length > 0
      ? activeWindows.reduce((prev, curr) => (prev.probability > curr.probability ? prev : curr))
      : null
  }, [temporalPrediction, matchMinute])

  return (
    <div className={cn('rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm border border-border', className)}>
      {/* Header: League & Status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <CountryFlag country={data.league.country} imagePath={data.league.logoUrl} size="sm" />
          <span className="text-sm font-medium text-foreground/70 truncate max-w-[160px]">
            {data.league.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge status={statusText} minute={matchMinute} className="text-red-600 text-sm" />
          {hasRedCard && <span className="text-red-600 text-sm">🟥</span>}
          {!isLive && !['NS', 'HT', 'FT'].includes(statusText) && (
            <span className="text-sm">{statusText}</span>
          )}
        </div>
      </div>

      {/* Teams & Scores */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 items-center gap-3">
          <div className="flex items-center gap-2">
            <Image src={data.teams.home.logoUrl} alt={data.teams.home.name} width={32} height={32} className="object-contain" />
            <span className="text-sm truncate" title={data.teams.home.name}>
              {data.teams.home.name}
            </span>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70">{isLive || ['HT', 'FT'].includes(statusText) ? 'Score' : 'Match'}</div>
            <div className="text-2xl font-bold">
              <span className={homeColor}>{data.teams.home.score ?? '-'}</span>
              {' '}
              -
              {' '}
              <span className={awayColor}>{data.teams.away.score ?? '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm truncate" title={data.teams.away.name}>
              {data.teams.away.name}
            </span>
            <Image src={data.teams.away.logoUrl} alt={data.teams.away.name} width={32} height={32} className="object-contain" />
          </div>
        </div>

        {/* Stats Section */}
        {data.stats && (
          <div className="grid grid-cols-3 text-sm mt-4">
            <div>
              <div className="text-xs text-gray-500">Possession</div>
              <span className="text-foreground">
                {data.stats.possession.home}
                %
              </span>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Shots</div>
              <span className="text-foreground">
                {data.stats.shots.home.total}
                {' '}
                -
                {data.stats.shots.away.total}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Possession</div>
              <span className="text-foreground">
                {data.stats.possession.away}
                %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Panel */}
      <div className="grid grid-cols-3 border-t border-border/50">
        <div className="flex flex-col items-center py-3 bg-green-50 text-green-800">
          <div className="text-sm">Over 1.5 Goals</div>
          <div className="text-xl font-bold">
            {data.prediction.goals?.over15 ? `${data.prediction.goals.over15}%` : '-'}
          </div>
        </div>
        <div className="flex flex-col items-center py-3 bg-green-50 text-green-800">
          <div className="text-sm">Over 2.5 Goals</div>
          <div className="text-xl font-bold">
            {data.prediction.goals?.over25 ? `${data.prediction.goals.over25}%` : '-'}
          </div>
        </div>
        <div className="flex flex-col items-center py-3 bg-green-50 text-green-800">
          <div className="text-sm">BTTS</div>
          <div className="text-xl font-bold">
            {data.prediction.goals?.btts ? `${data.prediction.goals.btts}%` : '-'}
          </div>
        </div>
      </div>

      {/* Temporal Prediction Highlight */}
      {highestWindow && highestWindow.probability > 0.5 && (
        <div className="px-4 py-2 text-sm font-medium border-t border-border/80 bg-green-100 text-green-800">
          High goal chance in
          {' '}
          {highestWindow.window.label}
          {' '}
          (
          {highestWindow.probability}
          %)
        </div>
      )}
    </div>
  )
}
