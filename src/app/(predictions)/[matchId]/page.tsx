// src/app/(predictions)/[matchId]/page.tsx

import type { MatchPrediction, TeamWindowStats } from '@/types'
import { TemporalPrediction } from '@/components/temporal-prediction'
import { CountryFlag } from '@/components/ui/country-flag'
import { LiveBadge } from '@/components/ui/live-badge'
import { getMatchPredictionById } from '@/lib/api/prediction-api'
import { cn, formatConfidence } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface MatchPageProps {
  params: Promise<{
    matchId: string
  }>
}

interface TeamInsightsCardProps {
  team: MatchPrediction['teams']['home'] | MatchPrediction['teams']['away']
  stats: TeamWindowStats
}

function TeamInsightsCard({ team, stats }: TeamInsightsCardProps) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative w-6 h-6">
          <Image
            src={team.logoUrl || '/placeholder-team.png'}
            alt={team.name}
            fill
            sizes="24px"
            className="object-contain"
          />
        </div>
        <span className="font-medium text-sm text-card-foreground">{team.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="text-xs bg-background/50 dark:bg-muted/30 p-1.5 rounded border border-border/40">
          <div className="text-[10px] text-muted-foreground mb-0.5">Pressure</div>
          <div className="font-bold text-card-foreground">
            {Math.round(stats.pressureIntensity * 100)}
            %
          </div>
        </div>
        <div className="text-xs bg-background/50 dark:bg-muted/30 p-1.5 rounded border border-border/40">
          <div className="text-[10px] text-muted-foreground mb-0.5">Defense</div>
          <div className="font-bold text-card-foreground">{stats.defensiveActions}</div>
        </div>
        <div className="text-xs bg-background/50 dark:bg-muted/30 p-1.5 rounded border border-border/40">
          <div className="text-[10px] text-muted-foreground mb-0.5">Transitions</div>
          <div className="font-bold text-card-foreground">{Math.round(stats.transitionSpeed * 10) / 10}</div>
        </div>
        <div className="text-xs bg-background/50 dark:bg-muted/30 p-1.5 rounded border border-border/40">
          <div className="text-[10px] text-muted-foreground mb-0.5">Set Pieces</div>
          <div className="font-bold text-card-foreground">
            {Math.round(stats.setPieceEfficiency * 100)}
            %
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function MatchPredictionPage({
  params,
}: MatchPageProps) {
  const { matchId: matchIdStr } = await params
  const matchId = Number.parseInt(matchIdStr, 10)

  if (Number.isNaN(matchId)) {
    notFound()
  }

  const prediction = await getMatchPredictionById(matchId)

  if (!prediction) {
    notFound()
  }

  // Format probabilities
  const homeProb = Math.round(prediction.prediction.winProbability.home * 100)
  const drawProb = Math.round(prediction.prediction.winProbability.draw * 100)
  const awayProb = Math.round(prediction.prediction.winProbability.away * 100)

  // Format confidence
  const { value: confidenceValue, color: confidenceColor }
    = formatConfidence(prediction.prediction.confidence)

  // Format goal probabilities
  const over15Prob = Math.round(prediction.prediction.goals.over15 * 100)
  const over25Prob = Math.round(prediction.prediction.goals.over25 * 100)
  const over35Prob = Math.round(prediction.prediction.goals.over35 * 100)
  const bttsProb = Math.round(prediction.prediction.goals.btts * 100)

  // Check if match is live
  const isLive = prediction.status.status !== 'FT'
    && prediction.status.status !== 'HT'
    && prediction.status.status !== 'NS'

  return (
    <div className="max-w-xl mx-auto">
      {/* Back button */}
      <div className="px-4 pt-2 pb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to live matches
        </Link>
      </div>

      {/* Match Header */}
      <div className="bg-card dark:bg-card/95 rounded-t-xl overflow-hidden shadow-sm border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CountryFlag
              country={prediction.league.country}
              imagePath={prediction.league.logoUrl}
              size="md"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-card-foreground">{prediction.league.name}</span>
              <span className="text-xs text-muted-foreground">{prediction.league.country}</span>
            </div>
          </div>

          <LiveBadge
            minute={prediction.status.minute}
            status={prediction.status.status}
            period={prediction.status.status === 'LIVE' ? 'MT2' : undefined}
            className="text-sm"
          />
        </div>

        {/* Teams & Score */}
        <div className="p-6 bg-background/50 dark:bg-muted/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center gap-2 w-5/12">
              <div className="w-16 h-16 relative">
                <Image
                  src={prediction.teams.home.logoUrl || '/placeholder-team.png'}
                  alt={prediction.teams.home.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <span className="text-center font-medium text-card-foreground">{prediction.teams.home.name}</span>
            </div>

            <div className="flex flex-col items-center justify-center w-2/12">
              {isLive
                ? (
                    <div className="text-2xl font-bold text-card-foreground">
                      {prediction.teams.home.score}
                      {' '}
                      -
                      {prediction.teams.away.score}
                    </div>
                  )
                : (
                    <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  )}
            </div>

            <div className="flex flex-col items-center gap-2 w-5/12">
              <div className="w-16 h-16 relative">
                <Image
                  src={prediction.teams.away.logoUrl || '/placeholder-team.png'}
                  alt={prediction.teams.away.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <span className="text-center font-medium text-card-foreground">{prediction.teams.away.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Section */}
      <div className="bg-card dark:bg-card/95 shadow-sm border border-border border-t-0 px-4 py-4">
        <h2 className="text-lg font-bold mb-4 text-card-foreground">Match Prediction</h2>

        {/* Win probability bars */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1 text-card-foreground">
            <span>Home</span>
            <span>Draw</span>
            <span>Away</span>
          </div>
          <div className="flex h-7 rounded-lg overflow-hidden border border-border">
            <div
              className="bg-score-home h-full flex items-center justify-center text-xs font-medium text-primary-foreground"
              style={{ width: `${homeProb}%` }}
            >
              {homeProb > 10 ? `${homeProb}%` : ''}
            </div>
            <div
              className="bg-score-draw h-full flex items-center justify-center text-xs font-medium text-primary-foreground"
              style={{ width: `${drawProb}%` }}
            >
              {drawProb > 10 ? `${drawProb}%` : ''}
            </div>
            <div
              className="bg-score-away h-full flex items-center justify-center text-xs font-medium text-primary-foreground"
              style={{ width: `${awayProb}%` }}
            >
              {awayProb > 10 ? `${awayProb}%` : ''}
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-card-foreground">Prediction Confidence</span>
            <span className={cn('text-sm font-medium', confidenceColor)}>{confidenceValue}</span>
          </div>
          <div className="h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn('h-full', {
                'bg-red-500 dark:bg-red-500/80': prediction.prediction.confidence < 0.4,
                'bg-amber-500 dark:bg-amber-500/80': prediction.prediction.confidence >= 0.4 && prediction.prediction.confidence < 0.7,
                'bg-green-500 dark:bg-green-500/80': prediction.prediction.confidence >= 0.7,
              })}
              style={{ width: `${Math.round(prediction.prediction.confidence * 100)}%` }}
            />
          </div>
        </div>

        {/* Goals grid */}
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-2 text-card-foreground">Goals Prediction</h3>
          <div className="grid grid-cols-2 gap-3">
            <GoalPredictionCard
              title="Over 1.5 Goals"
              probability={over15Prob}
            />
            <GoalPredictionCard
              title="Over 2.5 Goals"
              probability={over25Prob}
            />
            <GoalPredictionCard
              title="Over 3.5 Goals"
              probability={over35Prob}
            />
            <GoalPredictionCard
              title="Both Teams Score"
              probability={bttsProb}
            />
          </div>
        </div>

        {/* Team Insights */}
        {prediction.temporalGoalProbability?.teamComparison && (
          <div className="my-6">
            <h3 className="text-base font-semibold mb-3 text-card-foreground">Team Insights</h3>
            <div className="grid grid-cols-2 gap-3">
              <TeamInsightsCard
                team={prediction.teams.home}
                stats={prediction.temporalGoalProbability.teamComparison.home}
              />
              <TeamInsightsCard
                team={prediction.teams.away}
                stats={prediction.temporalGoalProbability.teamComparison.away}
              />
            </div>
          </div>
        )}

        {/* Temporal prediction */}
        {prediction.temporalGoalProbability?.windows && (
          <div className="mt-6">
            <TemporalPrediction
              windows={prediction.temporalGoalProbability.windows}
              teamComparison={prediction.temporalGoalProbability.teamComparison}
              events={prediction.temporalGoalProbability.keyMoments.pressureBuildUp}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface GoalPredictionCardProps {
  title: string
  probability: number
}

function GoalPredictionCard({ title, probability }: GoalPredictionCardProps) {
  return (
    <div className="border border-border rounded-lg p-3 bg-background/50 dark:bg-muted/30 shadow-sm">
      <div className="text-sm font-medium mb-2 text-card-foreground">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-lg font-bold text-card-foreground">
          {probability}
          %
        </div>
        <div
          className={cn('text-xs px-1.5 py-0.5 rounded', {
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': probability < 50,
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': probability >= 50 && probability < 70,
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': probability >= 70,
          })}
        >
          {probability < 50 ? 'Low' : probability < 70 ? 'Medium' : 'High'}
        </div>
      </div>
    </div>
  )
}
