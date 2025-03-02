import type { LiveScoreResponse, Match, MatchPrediction } from '@/types'
import { cache } from 'react'

const API_ENDPOINT = 'https://api.betmines.com/betmines/v1/fixtures/livescores'

/**
 * Fetches live score data from the API
 */
export const fetchLiveScores = cache(async (): Promise<LiveScoreResponse> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }

    const responseJson = await response.json()
    // Removed console.log to avoid performance issues
    return responseJson
  }
  catch (error) {
    console.error('Error fetching live scores:', error)
    throw error
  }
})

/**
 * Analyzes match data to provide predictions
 */
function analyzeMatch(match: Match): MatchPrediction | null {
  try {
    // Check if the match object has the required properties
    if (!match || !match.stats || !match.scores || !match.time || !match.league?.data
      || !match.localTeam?.data || !match.visitorTeam?.data) {
      console.warn(`Skipping match ${match?.id} due to missing required data`)
      return null
    }

    // Get team stats with safety checks
    const statsData = match.stats.data || []
    const homeTeamStats = statsData.find(stats => stats.teamId === match.localteamId)
    const awayTeamStats = statsData.find(stats => stats.teamId === match.visitorteamId)

    // Calculate win probabilities based on match stats
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

    // Current score
    const homeScore = match.scores.localTeamScore || 0
    const awayScore = match.scores.visitorTeamScore || 0

    // Calculate win probabilities
    let homeWinProb = 0.33
    let drawProb = 0.33
    let awayWinProb = 0.33

    // Adjust probabilities based on stats
    if (homeTeamStats && awayTeamStats) {
      // Possession factor
      homeWinProb += (homePossession - 50) * 0.003
      awayWinProb += (awayPossession - 50) * 0.003

      // Shots factor
      homeWinProb += (homeShotsTotal - awayShotsTotal) * 0.005
      awayWinProb += (awayShotsTotal - homeShotsTotal) * 0.005

      // Shots on target factor (stronger indicator)
      homeWinProb += (homeShotsOnTarget - awayShotsOnTarget) * 0.01
      awayWinProb += (awayShotsOnTarget - homeShotsOnTarget) * 0.01

      // Dangerous attacks factor
      homeWinProb += (homeDangerousAttacks - awayDangerousAttacks) * 0.002
      awayWinProb += (awayDangerousAttacks - homeDangerousAttacks) * 0.002

      // Current score factor
      if (homeScore > awayScore) {
        homeWinProb += 0.2
        drawProb -= 0.1
        awayWinProb -= 0.1
      }
      else if (awayScore > homeScore) {
        awayWinProb += 0.2
        drawProb -= 0.1
        homeWinProb -= 0.1
      }

      // Time factor - as the match progresses, current leader is more likely to win
      const matchMinute = match.time.minute || 0
      if (matchMinute > 70) {
        if (homeScore > awayScore) {
          homeWinProb += 0.15
          drawProb -= 0.1
          awayWinProb -= 0.05
        }
        else if (awayScore > homeScore) {
          awayWinProb += 0.15
          drawProb -= 0.1
          homeWinProb -= 0.05
        }
        else {
          // If draw late in the game, more likely to stay a draw
          drawProb += 0.1
          homeWinProb -= 0.05
          awayWinProb -= 0.05
        }
      }
    }

    // Ensure no negative probabilities
    homeWinProb = Math.max(0.05, homeWinProb)
    drawProb = Math.max(0.05, drawProb)
    awayWinProb = Math.max(0.05, awayWinProb)

    // Normalize probabilities
    const total = homeWinProb + drawProb + awayWinProb
    homeWinProb = homeWinProb / total
    drawProb = drawProb / total
    awayWinProb = awayWinProb / total

    // Determine recommended bet
    let recommendedBet = ''
    let confidence = 0

    if (homeWinProb > 0.5 && homeWinProb > drawProb && homeWinProb > awayWinProb) {
      recommendedBet = 'Home Win'
      confidence = homeWinProb
    }
    else if (awayWinProb > 0.5 && awayWinProb > drawProb && awayWinProb > homeWinProb) {
      recommendedBet = 'Away Win'
      confidence = awayWinProb
    }
    else if (drawProb > 0.4 && drawProb > homeWinProb && drawProb > awayWinProb) {
      recommendedBet = 'Draw'
      confidence = drawProb
    }
    else if ((homeScore + awayScore) >= 2
      || (homeShotsOnTarget + awayShotsOnTarget) > 10
      || (homeDangerousAttacks + awayDangerousAttacks) > 150) {
      recommendedBet = 'Over 2.5 Goals'
      confidence = 0.65
    }
    else {
      recommendedBet = 'No Clear Bet'
      confidence = 0.5
    }

    // Calculate goal market predictions
    const over15Prob = 0.6 + (homeShotsOnTarget + awayShotsOnTarget) * 0.02
    const over25Prob = 0.4 + (homeShotsOnTarget + awayShotsOnTarget) * 0.015
    const over35Prob = 0.2 + (homeShotsOnTarget + awayShotsOnTarget) * 0.01
    const bttsProb = 0.45 + (Math.min(homeShotsOnTarget, awayShotsOnTarget) * 0.03)

    // Generate reasons for the prediction
    const reasons = []

    if (homePossession > 60) {
      reasons.push(`Home team controlling possession (${homePossession}%)`)
    }
    else if (awayPossession > 60) {
      reasons.push(`Away team controlling possession (${awayPossession}%)`)
    }

    if (homeShotsOnTarget > awayShotsOnTarget * 2) {
      reasons.push(`Home team creating better chances (${homeShotsOnTarget} shots on target)`)
    }
    else if (awayShotsOnTarget > homeShotsOnTarget * 2) {
      reasons.push(`Away team creating better chances (${awayShotsOnTarget} shots on target)`)
    }

    if (homeAttacks > awayAttacks * 1.5) {
      reasons.push(`Home team dominating attacks (${homeAttacks} attacks)`)
    }
    else if (awayAttacks > homeAttacks * 1.5) {
      reasons.push(`Away team dominating attacks (${awayAttacks} attacks)`)
    }

    if (homeScore > 0 && awayScore > 0) {
      reasons.push('Both teams have scored already')
    }

    if (reasons.length === 0) {
      reasons.push('Based on balanced match statistics')
    }

    // Try to safely access nested properties
    const leagueName = match.league?.data?.name || 'Unknown League'
    const countryName = match.league?.data?.country?.data?.name || 'Unknown Country'
    const logoPath = match.league?.data?.logoPath || ''
    const homeTeamName = match.localTeam?.data?.name || 'Home Team'
    const homeTeamLogo = match.localTeam?.data?.logoPath || ''
    const awayTeamName = match.visitorTeam?.data?.name || 'Away Team'
    const awayTeamLogo = match.visitorTeam?.data?.logoPath || ''

    // Compile the prediction
    return {
      fixtureId: match.id,
      league: {
        name: leagueName,
        country: countryName,
        logoUrl: logoPath,
      },
      teams: {
        home: {
          name: homeTeamName,
          logoUrl: homeTeamLogo,
          score: homeScore,
        },
        away: {
          name: awayTeamName,
          logoUrl: awayTeamLogo,
          score: awayScore,
        },
      },
      status: {
        minute: match.time.minute || 0,
        status: match.time.status || 'Unknown',
        isLive: match.time.status !== 'FT' && match.time.status !== 'HT',
      },
      prediction: {
        winProbability: {
          home: Number.parseFloat(homeWinProb.toFixed(2)),
          draw: Number.parseFloat(drawProb.toFixed(2)),
          away: Number.parseFloat(awayWinProb.toFixed(2)),
        },
        recommendedBet,
        confidence: Number.parseFloat(confidence.toFixed(2)),
        reasons,
        goals: {
          over15: Number.parseFloat(over15Prob.toFixed(2)),
          over25: Number.parseFloat(over25Prob.toFixed(2)),
          over35: Number.parseFloat(over35Prob.toFixed(2)),
          btts: Number.parseFloat(bttsProb.toFixed(2)),
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
            yellow: homeTeamStats?.yellowcards || 0,
            red: homeTeamStats?.redcards || 0,
          },
          away: {
            yellow: awayTeamStats?.yellowcards || 0,
            red: awayTeamStats?.redcards || 0,
          },
        },
        corners: {
          home: homeTeamStats?.corners || 0,
          away: awayTeamStats?.corners || 0,
        },
      },
      lastUpdated: new Date().toISOString(),
    }
  }
  catch (error) {
    console.error('Error analyzing match:', error)
    return null
  }
}

/**
 * Gets live match predictions based on current data
 * @returns An array of match predictions
 */
export const getLivePredictions = cache(async (): Promise<MatchPrediction[]> => {
  try {
    const liveScoreData = await fetchLiveScores()

    // Transform the object into an array of match predictions
    const predictions = Object.values(liveScoreData)
      .map(match => analyzeMatch(match))
      .filter((prediction): prediction is MatchPrediction => prediction !== null)

    return predictions
  }
  catch (error) {
    console.error('Error getting live predictions:', error)
    return []
  }
})

/**
 * Gets a specific match prediction by ID
 * @param matchId The fixture ID to find
 */
export async function getMatchPredictionById(matchId: number): Promise<MatchPrediction | null> {
  try {
    const predictions = await getLivePredictions()
    return predictions.find(prediction => prediction.fixtureId === matchId) || null
  }
  catch (error) {
    console.error(`Error getting prediction for match ${matchId}:`, error)
    return null
  }
}
