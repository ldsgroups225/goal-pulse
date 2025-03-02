// src/app/(predictions)/[matchId]/page.tsx

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

export default async function MatchPredictionPage({
  params,
}: MatchPageProps) {
  const { matchId: matchIdStr } = await params
  const matchId = Number.parseInt(matchIdStr, 10)
  const randomId = Math.random().toString(36).substring(2, 9)

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
          className="inline-flex items-center text-sm font-medium text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to live matches
        </Link>
      </div>

      {/* Match Header */}
      <div className="bg-white rounded-t-xl overflow-hidden shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CountryFlag
              country={prediction.league.country}
              imagePath={prediction.league.logoUrl}
              size="md"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{prediction.league.name}</span>
              <span className="text-xs text-gray-500">{prediction.league.country}</span>
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
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center gap-2 w-5/12">
              <div className="w-16 h-16 relative">
                <Image
                  src={prediction.teams.home.logoUrl || '/placeholder-team.png'}
                  alt={prediction.teams.home.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-center font-medium">{prediction.teams.home.name}</span>
            </div>

            <div className="flex flex-col items-center justify-center w-2/12">
              {isLive
                ? (
                    <div className="text-2xl font-bold">
                      {prediction.teams.home.score}
                      {' '}
                      -
                      {prediction.teams.away.score}
                    </div>
                  )
                : (
                    <div className="text-2xl font-bold text-gray-400">VS</div>
                  )}
            </div>

            <div className="flex flex-col items-center gap-2 w-5/12">
              <div className="w-16 h-16 relative">
                <Image
                  src={prediction.teams.away.logoUrl || '/placeholder-team.png'}
                  alt={prediction.teams.away.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-center font-medium">{prediction.teams.away.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Section */}
      <div className="bg-white shadow-sm border border-gray-100 border-t-0 px-4 py-4">
        <h2 className="text-lg font-bold mb-4">Match Prediction</h2>

        {/* Win probability bars */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Home</span>
            <span>Draw</span>
            <span>Away</span>
          </div>
          <div className="flex h-7 rounded-lg overflow-hidden">
            <div
              className="bg-green-500 text-white text-xs flex items-center justify-center"
              style={{ width: `${homeProb}%` }}
            >
              {homeProb}
              %
            </div>
            <div
              className="bg-gray-500 text-white text-xs flex items-center justify-center"
              style={{ width: `${drawProb}%` }}
            >
              {drawProb}
              %
            </div>
            <div
              className="bg-blue-500 text-white text-xs flex items-center justify-center"
              style={{ width: `${awayProb}%` }}
            >
              {awayProb}
              %
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium mt-1">
            <span>{(1 / (prediction.prediction.winProbability.home || 0.01)).toFixed(2)}</span>
            <span>{(1 / (prediction.prediction.winProbability.draw || 0.01)).toFixed(2)}</span>
            <span>{(1 / (prediction.prediction.winProbability.away || 0.01)).toFixed(2)}</span>
          </div>
        </div>

        {/* Recommended bet */}
        <div className="rounded-lg bg-gray-50 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Recommended Bet</h3>
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              confidenceColor,
            )}
            >
              {confidenceValue}
              {' '}
              Confidence
            </div>
          </div>

          <div className="text-lg font-bold">{prediction.prediction.recommendedBet}</div>

          <div className="mt-3 text-sm text-gray-600">
            {prediction.prediction.reasons.map(reason => (
              <div key={randomId} className="flex items-start mb-1">
                <span className="mr-2">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals prediction */}
        <div className="mb-4">
          <h3 className="font-medium mb-3">Goals Prediction</h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-600">Over 1.5</div>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${over15Prob}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {over15Prob}
                  %
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-600">Over 2.5</div>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${over25Prob}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {over25Prob}
                  %
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-600">Over 3.5</div>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${over35Prob}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {over35Prob}
                  %
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-600">BTTS</div>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${bttsProb}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {bttsProb}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white shadow-sm border border-gray-100 border-t-0 rounded-b-xl px-4 py-4 mt-4">
        <h2 className="text-lg font-bold mb-4">Match Statistics</h2>

        {/* Possession */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">
              {prediction.stats.possession.home}
              %
            </span>
            <span className="text-gray-600">Possession</span>
            <span className="font-medium">
              {prediction.stats.possession.away}
              %
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-green-500"
              style={{ width: `${prediction.stats.possession.home}%` }}
            />
            <div
              className="bg-blue-500"
              style={{ width: `${prediction.stats.possession.away}%` }}
            />
          </div>
        </div>

        {/* Shots */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold">{prediction.stats.shots.home.total}</div>
            <div className="text-xs text-gray-600">Shots</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-lg font-bold">
              {prediction.stats.shots.home.onTarget}
              {' '}
              -
              {' '}
              {prediction.stats.shots.away.onTarget}
            </div>
            <div className="text-xs text-gray-600">On Target</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{prediction.stats.shots.away.total}</div>
            <div className="text-xs text-gray-600">Shots</div>
          </div>
        </div>

        {/* Other stats */}
        <div className="space-y-3">
          {/* Attacks */}
          <div className="flex justify-between items-center">
            <div className="text-right w-1/3">
              <div className="font-medium">{prediction.stats.attacks.home.total}</div>
              <div className="text-xs text-gray-500">
                (
                {prediction.stats.attacks.home.dangerous}
                {' '}
                dangerous)
              </div>
            </div>
            <div className="text-center w-1/3 text-sm text-gray-600">Attacks</div>
            <div className="w-1/3">
              <div className="font-medium">{prediction.stats.attacks.away.total}</div>
              <div className="text-xs text-gray-500">
                (
                {prediction.stats.attacks.away.dangerous}
                {' '}
                dangerous)
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="flex justify-between items-center">
            <div className="text-right w-1/3">
              <div className="font-medium">
                <span className="text-yellow-500 mr-1">■</span>
                {prediction.stats.cards.home.yellow}
              </div>
              <div className="font-medium mt-1">
                <span className="text-red-500 mr-1">■</span>
                {prediction.stats.cards.home.red}
              </div>
            </div>
            <div className="text-center w-1/3 text-sm text-gray-600">Cards</div>
            <div className="w-1/3">
              <div className="font-medium">
                <span className="text-yellow-500 mr-1">■</span>
                {prediction.stats.cards.away.yellow}
              </div>
              <div className="font-medium mt-1">
                <span className="text-red-500 mr-1">■</span>
                {prediction.stats.cards.away.red}
              </div>
            </div>
          </div>

          {/* Corners */}
          <div className="flex justify-between items-center">
            <div className="text-right w-1/3">
              <div className="font-medium">{prediction.stats.corners.home}</div>
            </div>
            <div className="text-center w-1/3 text-sm text-gray-600">Corners</div>
            <div className="w-1/3">
              <div className="font-medium">{prediction.stats.corners.away}</div>
            </div>
          </div>
        </div>

        {/* Last updated timestamp */}
        <div className="text-xs text-gray-400 text-center mt-6">
          Last updated:
          {' '}
          {new Date(prediction.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
