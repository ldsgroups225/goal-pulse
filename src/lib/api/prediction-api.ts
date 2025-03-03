// src/lib/api/prediction-api.ts

import type { LiveScoreResponse, Match, MatchEvent, MatchPrediction } from '@/types'
import type { TeamSeasonStats } from '@/types/fixture-info'
import { cache } from 'react'
import { fetchFixtureInfo } from './fixture-info-service'
import { enhanceWithTemporalAnalysis } from './prediction-temporal-api'

export type { MatchPrediction }

const API_ENDPOINT = 'https://api.betmines.com/betmines/v1/fixtures/livescores'

/**
 * Fetches live score data from the API
 */
export const fetchLiveScores = cache(async (): Promise<LiveScoreResponse> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      next: { revalidate: 30 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('Error fetching live scores:', error)
    throw error
  }
})

/**
 * Calculates xG for a single shot event based on its position
 */
function calculateXG(event: MatchEvent, isHomeTeam: boolean): number {
  const { x, y } = event
  if (x === undefined || y === undefined)
    return 0

  const distance = isHomeTeam
    ? Math.sqrt((100 - x) ** 2 + (30 - y) ** 2)
    : Math.sqrt(x ** 2 + (30 - y) ** 2)
  if (distance === 0)
    return 1

  const centralityFactor = Math.exp(-1.22 * Math.abs(y - 30) / 30)
  return Math.min(1, (90.75 / distance ** 2) * centralityFactor)
}

/**
 * Computes total xG for a team from match events
 */
function calculateTotalXG(events: MatchEvent[], teamId: string, localteamId: string): number {
  const isHomeTeam = teamId === localteamId
  return events
    .filter(e => e.type === 'shot' && e.teamId === teamId)
    .reduce((sum, e) => sum + calculateXG(e, isHomeTeam), 0)
}

/**
 * Computes Poisson probabilities up to max_k
 */
function computePoissonProbabilities(lambda: number, max_k: number = 10): number[] {
  const probabilities = [Math.exp(-lambda)]
  for (let k = 1; k <= max_k; k++) {
    probabilities.push(probabilities[k - 1] * lambda / k)
  }

  return probabilities
}

/**
 * Computes probability of total goals exceeding a threshold
 */
function computeOverProb(currentTotal: number, totalLambda: number, threshold: number): number {
  if (currentTotal >= threshold)
    return 1

  const kMax = Math.floor(threshold - currentTotal - 1)
  if (kMax < 0)
    return 1
  let prob = 0
  let p = Math.exp(-totalLambda)

  for (let k = 0; k <= kMax; k++) {
    prob += p
    p *= totalLambda / (k + 1)
  }

  return 1 - prob
}

/**
 * Gets the historical scoring rate for a specific time window
 * This is exported for use in prediction-temporal-api.ts
 */
export function getHistoricalScoringRate(
  teamStats: TeamSeasonStats | undefined,
  windowStart: number,
  windowEnd: number,
): number {
  if (!teamStats || !teamStats.seasonStats?.scoringMinutes?.length) {
    return 0
  }

  let targetBucket: string
  if (windowStart <= 15 && windowEnd <= 15) {
    targetBucket = '0-15'
  }
  else if (windowStart >= 35 && windowEnd <= 45) {
    targetBucket = '30-45'
  }
  else if (windowStart >= 45 && windowEnd <= 60) {
    targetBucket = '45-60'
  }
  else if (windowStart >= 75) {
    targetBucket = '75-90'
  }
  else if (windowStart >= 60) {
    targetBucket = '60-75'
  }
  else if (windowStart >= 30) {
    targetBucket = '30-45'
  }
  else if (windowStart >= 15) {
    targetBucket = '15-30'
  }
  else {
    targetBucket = '0-15'
  }

  // Find the scoring minute and period with the target bucket
  const scoringMinute = teamStats.seasonStats.scoringMinutes[0]
  const period = scoringMinute?.period?.find(p => p.minute === targetBucket)

  // Convert goals scored in this period to a rate (goals per match)
  if (period) {
    const count = Number.parseInt(period.count, 10) || 0
    return count / (teamStats.nbMatches || 1)
  }

  return 0
}

/**
 * Analyzes match data to provide predictions
 */
async function analyzeMatch(match: Match): Promise<MatchPrediction | null> {
  try {
    // Extract all events
    const events = match.events?.data || []
    if (!events || events.length === 0) {
      console.warn(`No events found for match ${match.id}`)
      return null
    }

    // Fetch fixture info for additional data
    const fixtureInfo = await fetchFixtureInfo(match.id)

    // Extract team stats and probabilities if available
    const localTeamSeasonStats = fixtureInfo?.localTeamSeasonStats
    const visitorTeamSeasonStats = fixtureInfo?.visitorTeamSeasonStats
    const probability = fixtureInfo?.probability

    const statsData = match.stats.data
    const homeTeamStats = statsData.find(stats => stats.teamId === match.localteamId)
    const awayTeamStats = statsData.find(stats => stats.teamId === match.visitorteamId)

    const localteamIdStr = match.localteamId.toString()
    const visitorteamIdStr = match.visitorteamId.toString()

    // Current score and time
    const currentHomeGoals = match.scores.localTeamScore || 0
    const currentAwayGoals = match.scores.visitorTeamScore || 0
    const matchMinute = match.time.minute || 0
    const remainingTime = Math.max(0, 90 - matchMinute)

    // Basic stats
    const homePossession = homeTeamStats?.possessiontime || 50
    const awayPossession = 100 - homePossession
    const homeShotsTotal = homeTeamStats?.shots?.total || 0
    const awayShotsTotal = awayTeamStats?.shots?.total || 0
    const homeShotsOnTarget = homeTeamStats?.shots?.ongoal || 0
    const awayShotsOnTarget = awayTeamStats?.shots?.ongoal || 0
    const homeShotsOffTarget = homeShotsTotal - homeShotsOnTarget
    const awayShotsOffTarget = awayShotsTotal - awayShotsOnTarget
    const homeAttacks = homeTeamStats?.attacks?.attacks || 0
    const awayAttacks = awayTeamStats?.attacks?.attacks || 0
    const homeDangerousAttacks = homeTeamStats?.attacks?.dangerous_attacks || 0
    const awayDangerousAttacks = awayTeamStats?.attacks?.dangerous_attacks || 0
    const homeYellowCards = homeTeamStats?.yellowcards || 0
    const awayYellowCards = awayTeamStats?.yellowcards || 0
    const homeRedCards = homeTeamStats?.redcards || 0
    const awayRedCards = awayTeamStats?.redcards || 0
    const homeCorners = homeTeamStats?.corners || 0
    const awayCorners = awayTeamStats?.corners || 0

    // Declare variables at function scope
    let homeWinProb: number
    let drawProb: number
    let awayWinProb: number
    let lambdaHome = 0
    let lambdaAway = 0

    if (matchMinute === 0) {
      // Use pre-match probabilities from the fixture info if available
      if (probability) {
        homeWinProb = probability.home || 0.33
        drawProb = probability.draw || 0.33
        awayWinProb = probability.away || 0.33
      }
      else {
        homeWinProb = 0.33
        drawProb = 0.33
        awayWinProb = 0.33
      }
    }
    else if (remainingTime <= 0) {
      if (currentHomeGoals > currentAwayGoals) {
        homeWinProb = 1
        drawProb = 0
        awayWinProb = 0
      }
      else if (currentHomeGoals < currentAwayGoals) {
        homeWinProb = 0
        drawProb = 0
        awayWinProb = 1
      }
      else {
        homeWinProb = 0
        drawProb = 1
        awayWinProb = 0
      }
    }
    else {
      // Calculate xG from live events
      const homeXGSoFar = calculateTotalXG(match.events.data, localteamIdStr, localteamIdStr)
      const awayXGSoFar = calculateTotalXG(match.events.data, visitorteamIdStr, localteamIdStr)

      // Get historical goal rates for the remaining time
      const homeHistoricalRate = localTeamSeasonStats ? localTeamSeasonStats.avgTotalGoals * (remainingTime / 90) : 0
      const awayHistoricalRate = visitorTeamSeasonStats ? visitorTeamSeasonStats.avgTotalGoals * (remainingTime / 90) : 0

      // Calculate expected remaining goals using a weighted combination of live data and historical data
      // We weight live data more heavily as the match progresses
      const liveDataWeight = Math.min(0.8, matchMinute / 60) // Caps at 80% weight for live data
      const historicalWeight = 1 - liveDataWeight

      // Calculate expected goals for the remainder of the match
      const homeShotRatio = homeShotsTotal > 0
        ? homeShotsTotal / (homeShotsTotal + awayShotsTotal)
        : 0.5

      // Dynamic lambda calculation for remaining time
      const homeLambdaLive = (homeXGSoFar / Math.max(1, matchMinute)) * remainingTime
        * (1 + 0.2 * (homeShotRatio - 0.5) + 0.2 * (homePossession / 100 - 0.5))

      const awayLambdaLive = (awayXGSoFar / Math.max(1, matchMinute)) * remainingTime
        * (1 + 0.2 * ((1 - homeShotRatio) - 0.5) + 0.2 * ((100 - homePossession) / 100 - 0.5))

      // Combine live and historical data
      lambdaHome = (liveDataWeight * homeLambdaLive) + (historicalWeight * homeHistoricalRate)
      lambdaAway = (liveDataWeight * awayLambdaLive) + (historicalWeight * awayHistoricalRate)

      // Apply team-specific modifiers based on historical concession rates
      if (localTeamSeasonStats && visitorTeamSeasonStats) {
        // Home team scores more when away team concedes more than average
        const awayDefenseFactor = visitorTeamSeasonStats.avgTotalAwayConcededGoals
          / Math.max(0.5, visitorTeamSeasonStats.avgTotalConcededGoals)

        // Away team scores more when home team concedes more than average
        const homeDefenseFactor = localTeamSeasonStats.avgTotalHomeConcededGoals
          / Math.max(0.5, localTeamSeasonStats.avgTotalConcededGoals)

        lambdaHome *= Math.min(1.5, awayDefenseFactor)
        lambdaAway *= Math.min(1.5, homeDefenseFactor)
      }

      // Calculate probabilities using Poisson distribution
      // Max goals to consider
      const maxGoals = 5

      // Generate distributions
      const homeProbs = computePoissonProbabilities(lambdaHome, maxGoals)
      const awayProbs = computePoissonProbabilities(lambdaAway, maxGoals)

      // Calculate match outcome probabilities
      homeWinProb = 0
      drawProb = 0
      awayWinProb = 0

      for (let i = 0; i <= maxGoals; i++) {
        for (let j = 0; j <= maxGoals; j++) {
          const prob = homeProbs[i] * awayProbs[j]

          if (currentHomeGoals + i > currentAwayGoals + j) {
            homeWinProb += prob
          }
          else if (currentHomeGoals + i < currentAwayGoals + j) {
            awayWinProb += prob
          }
          else {
            drawProb += prob
          }
        }
      }
    }

    // Normalize probabilities to ensure they sum to 1
    const totalProb = homeWinProb + drawProb + awayWinProb
    if (totalProb > 0) {
      homeWinProb /= totalProb
      drawProb /= totalProb
      awayWinProb /= totalProb
    }

    // Goal market predictions
    const currentTotal = currentHomeGoals + currentAwayGoals
    const totalLambda = lambdaHome + lambdaAway
    const over15Prob = computeOverProb(currentTotal, totalLambda, 2)
    const over25Prob = computeOverProb(currentTotal, totalLambda, 3)
    const over35Prob = computeOverProb(currentTotal, totalLambda, 4)
    const pHomeScores = currentHomeGoals >= 1 ? 1 : 1 - Math.exp(-lambdaHome)
    const pAwayScores = currentAwayGoals >= 1 ? 1 : 1 - Math.exp(-lambdaAway)
    const bttsProb = pHomeScores * pAwayScores

    // Recommended bet and confidence
    let recommendedBet = ''
    let confidence = 0
    if (homeWinProb > 0.6) {
      recommendedBet = 'Home Win'
      confidence = homeWinProb
    }
    else if (awayWinProb > 0.6) {
      recommendedBet = 'Away Win'
      confidence = awayWinProb
    }
    else if (drawProb > 0.5) {
      recommendedBet = 'Draw'
      confidence = drawProb
    }
    else if (over25Prob > 0.7) {
      recommendedBet = 'Over 2.5 Goals'
      confidence = over25Prob
    }
    else {
      recommendedBet = 'No Clear Bet'
      confidence = 0.5
    }

    // Prediction reasons
    const reasons: string[] = []
    if (homePossession > 60)
      reasons.push(`Home team controlling possession (${homePossession}%)`)
    if (awayPossession > 60)
      reasons.push(`Away team controlling possession (${awayPossession}%)`)
    if (homeShotsOnTarget > awayShotsOnTarget * 2)
      reasons.push(`Home team creating better chances (${homeShotsOnTarget} shots on target)`)
    if (awayShotsOnTarget > homeShotsOnTarget * 2)
      reasons.push(`Away team creating better chances (${awayShotsOnTarget} shots on target)`)
    if (homeAttacks > awayAttacks * 1.5)
      reasons.push(`Home team dominating attacks (${homeAttacks} attacks)`)
    if (awayAttacks > homeAttacks * 1.5)
      reasons.push(`Away team dominating attacks (${awayAttacks} attacks)`)
    if (currentHomeGoals > 0 && currentAwayGoals > 0)
      reasons.push('Both teams have scored already')
    if (reasons.length === 0)
      reasons.push('Based on balanced match statistics')

    // Include historical insights if available
    const h2hTrends: string[] = []
    if (fixtureInfo?.head2head_detail_list && fixtureInfo.head2head_detail_list.length > 0) {
      const h2hMatches = fixtureInfo.head2head_detail_list
      const totalGoals = h2hMatches.reduce((sum, match) => {
        return sum + match.scores.localTeamScoreFT + match.scores.visitorTeamScoreFT
      }, 0)

      const avgGoals = totalGoals / h2hMatches.length
      h2hTrends.push(`Avg ${avgGoals.toFixed(1)} goals per H2H match`)

      const bttsCount = h2hMatches.filter(m =>
        m.scores.localTeamScoreFT > 0 && m.scores.visitorTeamScoreFT > 0).length
      const bttsPercentage = (bttsCount / h2hMatches.length) * 100

      if (bttsPercentage > 50) {
        h2hTrends.push(`BTTS in ${bttsPercentage.toFixed(0)}% of H2H matches`)
      }
    }

    const prediction: MatchPrediction = {
      fixtureId: match.id,
      league: {
        name: match.league.data.name,
        country: match.league.data.country?.data?.name || '',
        logoUrl: match.league.data.logoPath || '',
      },
      teams: {
        home: {
          name: match.localTeam.data.name,
          logoUrl: match.localTeam.data.logoPath || '',
          score: currentHomeGoals,
        },
        away: {
          name: match.visitorTeam.data.name,
          logoUrl: match.visitorTeam.data.logoPath || '',
          score: currentAwayGoals,
        },
      },
      status: {
        minute: matchMinute,
        status: match.time.status,
        isLive: match.time.status.toLowerCase() === 'live',
      },
      prediction: {
        winProbability: { home: homeWinProb, draw: drawProb, away: awayWinProb },
        recommendedBet,
        confidence,
        reasons,
        goals: {
          over15: over15Prob,
          over25: over25Prob,
          over35: over35Prob,
          btts: bttsProb,
        },
      },
      stats: {
        possession: {
          home: homePossession,
          away: awayPossession,
        },
        shots: {
          home: {
            total: homeShotsTotal,
            onTarget: homeShotsOnTarget,
            offTarget: homeShotsOffTarget,
          },
          away: {
            total: awayShotsTotal,
            onTarget: awayShotsOnTarget,
            offTarget: awayShotsOffTarget,
          },
        },
        attacks: {
          home: {
            total: homeAttacks,
            dangerous: homeDangerousAttacks,
          },
          away: {
            total: awayAttacks,
            dangerous: awayDangerousAttacks,
          },
        },
        cards: {
          home: {
            yellow: homeYellowCards,
            red: homeRedCards,
          },
          away: {
            yellow: awayYellowCards,
            red: awayRedCards,
          },
        },
        corners: {
          home: homeCorners,
          away: awayCorners,
        },
      },
      lastUpdated: new Date().toISOString(),
      historicalInsights: {
        scoringRates: {
          home: {
            total: localTeamSeasonStats?.avgTotalGoals || 0,
            byWindow: {},
          },
          away: {
            total: visitorTeamSeasonStats?.avgTotalGoals || 0,
            byWindow: {},
          },
        },
        h2hTrends,
      },
    }

    return prediction
  }
  catch (error) {
    console.error(`Error analyzing match ${match.id}:`, error)
    return null
  }
}

/**
 * Gets live match predictions
 */
export const getLivePredictions = cache(async (): Promise<MatchPrediction[]> => {
  try {
    const liveScores = await fetchLiveScores()
    if (!liveScores?.data) {
      console.warn('No live scores data available')
      return []
    }

    const predictions: MatchPrediction[] = []
    const matchesArray = Array.isArray(liveScores.data) ? liveScores.data : []

    for (const match of matchesArray) {
      const prediction = await analyzeMatch(match)
      if (prediction) {
        // Fetch fixture info for temporal analysis
        const fixtureInfo = await fetchFixtureInfo(match.id)

        // Enhance prediction with temporal analysis
        const enhancedPrediction = await enhanceWithTemporalAnalysis(prediction, match, fixtureInfo)
        predictions.push(enhancedPrediction)
      }
    }

    return predictions
  }
  catch (error) {
    console.error('Error getting live predictions:', error)
    return []
  }
})

/**
 * Gets a specific match prediction by ID
 */
export const getMatchPredictionById = cache(async (matchId: number): Promise<MatchPrediction | null> => {
  try {
    // Fetch all live scores first
    const liveScores = await fetchLiveScores()
    if (!liveScores?.data) {
      console.warn('No live scores data available')
      return null
    }

    // Find the specific match
    const matchesArray = Array.isArray(liveScores.data) ? liveScores.data : []
    const match = matchesArray.find((m: Match) => m.id === matchId)

    if (!match) {
      console.warn(`Match with ID ${matchId} not found in live scores`)
      return null
    }

    // Analyze the match
    const prediction = await analyzeMatch(match)
    if (!prediction) {
      return null
    }

    // Fetch fixture info for this match
    const fixtureInfo = await fetchFixtureInfo(matchId)

    // Enhance with temporal analysis
    return await enhanceWithTemporalAnalysis(prediction, match, fixtureInfo)
  }
  catch (error) {
    console.error(`Error getting prediction for match ${matchId}:`, error)
    return null
  }
})
