// src/lib/api/prediction-api.ts

import type { LiveScoreResponse, Match, MatchEvent, MatchPrediction } from '@/types'
import { cache } from 'react'
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
  let current = probabilities[0]
  for (let k = 1; k <= max_k; k++) {
    current *= lambda / k
    probabilities.push(current)
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
  prob += p
  for (let k = 1; k <= kMax; k++) {
    p *= totalLambda / k
    prob += p
  }
  return 1 - prob
}

/**
 * Analyzes match data to provide predictions
 */
/**
 * Analyzes match data to provide predictions
 */
function analyzeMatch(match: Match): MatchPrediction | null {
  try {
    if (!match || !match.stats || !match.scores || !match.time || !match.league?.data
      || !match.localTeam?.data || !match.visitorTeam?.data || !match.events?.data) {
      console.warn(`Skipping match ${match?.id} due to missing data`)
      return null
    }

    const statsData = match.stats.data || []
    const homeTeamStats = statsData.find(stats => stats.teamId === match.localteamId)
    const awayTeamStats = statsData.find(stats => stats.teamId === match.visitorteamId)

    const localteamIdStr = match.localteamId.toString()
    const visitorteamIdStr = match.visitorteamId.toString()

    // Current score and time
    const currentHomeGoals = match.scores.localTeamScore || 0
    const currentAwayGoals = match.scores.visitorTeamScore || 0
    const matchMinute = match.time.minute || 0
    const remainingTime = 90 - matchMinute

    // Basic stats
    const homePossession = homeTeamStats?.possessiontime || 50
    const awayPossession = awayTeamStats?.possessiontime || 50
    const homeShotsTotal = homeTeamStats?.shots?.total || 0
    const awayShotsTotal = awayTeamStats?.shots?.total || 0
    const homeShotsOnTarget = homeTeamStats?.shots?.ongoal || 0
    const awayShotsOnTarget = awayTeamStats?.shots?.ongoal || 0
    const homeShotsOffTarget = homeTeamStats?.shots?.offgoal || 0
    const awayShotsOffTarget = awayTeamStats?.shots?.offgoal || 0
    const homeAttacks = homeTeamStats?.attacks?.attacks || 0
    const awayAttacks = awayTeamStats?.attacks?.attacks || 0
    const homeDangerousAttacks = homeTeamStats?.attacks?.dangerous_attacks || 0
    const awayDangerousAttacks = awayTeamStats?.attacks?.dangerous_attacks || 0

    // Declare variables at function scope
    let homeWinProb: number
    let drawProb: number
    let awayWinProb: number
    let lambdaHome = 0
    let lambdaAway = 0

    if (matchMinute === 0) {
      homeWinProb = 0.33
      drawProb = 0.33
      awayWinProb = 0.33
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
      const homeXGSoFar = calculateTotalXG(match.events.data, localteamIdStr, localteamIdStr)
      const awayXGSoFar = calculateTotalXG(match.events.data, visitorteamIdStr, localteamIdStr)
      const homeXGRate = matchMinute > 0 ? homeXGSoFar / matchMinute : 0
      const awayXGRate = matchMinute > 0 ? awayXGSoFar / matchMinute : 0
      lambdaHome = homeXGRate * remainingTime
      lambdaAway = awayXGRate * remainingTime

      const homeProbabilities = computePoissonProbabilities(lambdaHome)
      const awayProbabilities = computePoissonProbabilities(lambdaAway)

      let pHomeWin = 0
      let pDraw = 0
      let pAwayWin = 0
      const maxK = 10

      for (let h = 0; h <= maxK; h++) {
        for (let a = 0; a <= maxK; a++) {
          const prob = homeProbabilities[h] * awayProbabilities[a]
          const homeTotal = currentHomeGoals + h
          const awayTotal = currentAwayGoals + a
          if (homeTotal > awayTotal)
            pHomeWin += prob
          else if (homeTotal === awayTotal)
            pDraw += prob
          else pAwayWin += prob
        }
      }

      const totalProb = pHomeWin + pDraw + pAwayWin
      homeWinProb = totalProb > 0 ? pHomeWin / totalProb : 0.33
      drawProb = totalProb > 0 ? pDraw / totalProb : 0.33
      awayWinProb = totalProb > 0 ? pAwayWin / totalProb : 0.33
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
        goals: { over15: over15Prob, over25: over25Prob, over35: over35Prob, btts: bttsProb },
      },
      stats: {
        possession: { home: homePossession, away: awayPossession },
        shots: {
          home: { total: homeShotsTotal, onTarget: homeShotsOnTarget, offTarget: homeShotsOffTarget },
          away: { total: awayShotsTotal, onTarget: awayShotsOnTarget, offTarget: awayShotsOffTarget },
        },
        attacks: {
          home: { total: homeAttacks, dangerous: homeDangerousAttacks },
          away: { total: awayAttacks, dangerous: awayDangerousAttacks },
        },
        corners: { home: homeTeamStats?.corners || 0, away: awayTeamStats?.corners || 0 },
        cards: {
          home: { yellow: homeTeamStats?.yellowcards || 0, red: homeTeamStats?.redcards || 0 },
          away: { yellow: awayTeamStats?.yellowcards || 0, red: awayTeamStats?.redcards || 0 },
        },
      },
      lastUpdated: new Date().toISOString(),
    }

    return enhanceWithTemporalAnalysis(prediction, match)
  }
  catch (error) {
    console.error(`Error analyzing match ${match?.id}:`, error)
    return null
  }
}

/**
 * Gets live match predictions
 */
export const getLivePredictions = cache(async (): Promise<MatchPrediction[]> => {
  try {
    const liveScoreData = await fetchLiveScores()
    return Object.values(liveScoreData)
      .map(match => analyzeMatch(match))
      .filter((prediction): prediction is MatchPrediction => prediction !== null)
  }
  catch (error) {
    console.error('Error getting live predictions:', error)
    return []
  }
})

/**
 * Gets a specific match prediction by ID
 */
export async function getMatchPredictionById(matchId: number): Promise<MatchPrediction | null> {
  try {
    const predictions = await getLivePredictions()
    return predictions.find(p => p.fixtureId === matchId) || null
  }
  catch (error) {
    console.error(`Error getting prediction for match ${matchId}:`, error)
    return null
  }
}
