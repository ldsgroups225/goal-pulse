// src/lib/api/prediction-temporal-api.ts

import type { Match, MatchEvent, MatchPrediction, TeamWindowStats, TemporalWindow, WindowAnalysis } from '@/types'
import type { FixtureInfoResponse, TeamSeasonStats } from '@/types/fixture-info'

// Define the key temporal windows for analysis
export const PREDICTION_WINDOWS: TemporalWindow[] = [
  { start: 0, end: 15, label: 'First 15' },
  { start: 35, end: 45, label: 'First Half End' },
  { start: 45, end: 55, label: 'Second Half Start' },
  { start: 80, end: 90, label: 'Final 10' },
]

// Define weights for different factors in each window
export const WINDOW_FACTORS = {
  'First 15': {
    weight: 0.4,
    factors: ['early_pressure', 'set_pieces', 'opening_tactics'],
  },
  'First Half End': {
    weight: 0.3,
    factors: ['fatigue', 'scoreline_pressure', 'half_time_adjustment'],
  },
  'Second Half Start': {
    weight: 0.3,
    factors: ['tactical_changes', 'substitution_impact', 'renewed_energy'],
  },
  'Final 10': {
    weight: 0.4,
    factors: ['desperation', 'defensive_errors', 'time_pressure', 'fitness_levels'],
  },
}

// Map our temporal windows to fixture info API time buckets
const WINDOW_TO_SCORING_MINUTE_MAP: Record<string, string> = {
  'First 15': '0-15',
  'First Half End': '30-45',
  'Second Half Start': '45-60',
  'Final 10': '75-90',
}

/**
 * Filter events to those occurring within a specific time window
 */
export function filterEventsByWindow(
  events: MatchEvent[],
  window: TemporalWindow,
): MatchEvent[] {
  // Filter events that happened during the specified window
  return events.filter((event) => {
    const eventMinute = event.minute + (event.extraMinute || 0)
    return eventMinute >= window.start && eventMinute <= window.end
  })
}

/**
 * Calculate pressure index based on shots, corners, and dangerous attacks
 */
function calculatePressureIndex(
  windowEvents: MatchEvent[],
  _stats: any,
  windowMinutes: number,
): number {
  const shots = windowEvents.filter(e => e.type === 'goal' || e.isDangerous).length
  const corners = windowEvents.filter(e => e.type === 'freekick' && e.reason?.includes('corner')).length
  const cards = windowEvents.filter(e => e.type === 'yellowcard' || e.type === 'redcard').length

  // Normalize by time window duration
  const shotRate = shots / windowMinutes
  const cornerRate = corners / windowMinutes
  const cardRate = cards / windowMinutes

  // Weight factors (can be adjusted based on analysis)
  return Math.min(1, (shotRate * 0.5) + (cornerRate * 0.3) + (cardRate * 0.2))
}

/**
 * Calculate momentum based on sequence of attacking events
 */
function calculateAttackMomentum(
  events: MatchEvent[],
  window: TemporalWindow,
  teamId?: string,
): number {
  const windowEvents = filterEventsByWindow(events, window)

  if (teamId) {
    // Filter for specific team if provided
    const teamEvents = windowEvents.filter(e => e.teamId === teamId)
    if (teamEvents.length === 0)
      return 0

    // Calculate momentum for specific team
    return analyzeAttackSequence(teamEvents)
  }

  // Calculate overall momentum
  return analyzeAttackSequence(windowEvents)
}

/**
 * Analyze attack sequence to determine momentum
 */
function analyzeAttackSequence(events: MatchEvent[]): number {
  if (events.length === 0)
    return 0

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = a.minute + (a.extraMinute || 0)
    const bTime = b.minute + (b.extraMinute || 0)
    return aTime - bTime
  })

  // Identify attack sequences
  const attackSequences: MatchEvent[][] = []
  let currentSequence: MatchEvent[] = []
  let lastEventTime = -5 // initialize with negative value

  sortedEvents.forEach((event) => {
    const eventTime = event.minute + (event.extraMinute || 0)

    // If more than 2 minutes have passed, start a new sequence
    if (eventTime - lastEventTime > 2 && currentSequence.length > 0) {
      attackSequences.push([...currentSequence])
      currentSequence = []
    }

    // Add event to current sequence
    currentSequence.push(event)
    lastEventTime = eventTime
  })

  // Add the last sequence if not empty
  if (currentSequence.length > 0) {
    attackSequences.push(currentSequence)
  }

  // Score each sequence and calculate overall momentum
  let totalMomentum = 0
  attackSequences.forEach((sequence) => {
    const sequenceScore = sequence.reduce((score, event) => {
      // Different events contribute differently to momentum
      switch (event.type) {
        case 'goal': return score + 1.0
        case 'freekick': return score + (event.isDangerous ? 0.4 : 0.2)
        case 'var': return score + 0.3
        default: return score + (event.isDangerous ? 0.3 : 0.1)
      }
    }, 0)

    // Longer sequences have more weight
    const lengthFactor = Math.min(1, sequence.length / 5)
    totalMomentum += sequenceScore * lengthFactor
  })

  // Normalize to 0-1 range
  return Math.min(1, totalMomentum / Math.max(1, attackSequences.length))
}

/**
 * Extract key factors that influence predictions in a time window
 */
function identifyKeyFactors(
  windowEvents: MatchEvent[],
  window: TemporalWindow,
  _stats: any,
): string[] {
  const factors: string[] = []

  // Event count thresholds
  const shotCount = windowEvents.filter(e => e.isDangerous).length
  const cornerCount = windowEvents.filter(e => e.type === 'freekick' && e.reason?.includes('corner')).length
  const foulCount = windowEvents.filter(e => e.type === 'freekick' && !e.reason?.includes('corner')).length
  const cardCount = windowEvents.filter(e => e.type === 'yellowcard' || e.type === 'redcard').length

  // Check for high-pressure factors
  if (shotCount >= 3) {
    factors.push(`${shotCount} shots in last ${window.end - window.start}min`)
  }

  if (cornerCount >= 2) {
    factors.push(`${cornerCount} corners`)
  }

  if (cardCount >= 1) {
    factors.push(`${cardCount} cards`)
  }

  if (foulCount >= 3) {
    factors.push('High foul count')
  }

  // Check intensity based on time window
  if (window.label === 'First 15' && shotCount > 0) {
    factors.push('Early pressure')
  }

  if (window.label === 'Final 10' && (shotCount > 0 || cornerCount > 0)) {
    factors.push('Late game pressure')
  }

  // Return list of unique factors
  return factors.length > 0 ? factors : ['Normal play']
}

/**
 * Calculate set piece efficiency
 */
function calculateSetPieceEfficiency(events: MatchEvent[], teamId?: string): number {
  const setPieces = events.filter(e =>
    e.type === 'freekick'
    && (!teamId || e.teamId === teamId),
  )

  if (setPieces.length === 0)
    return 0

  const dangerousSetPieces = setPieces.filter(e => e.isDangerous)
  return dangerousSetPieces.length / setPieces.length
}

/**
 * Calculate team window stats
 */
function calculateTeamWindowStats(
  events: MatchEvent[],
  window: TemporalWindow,
  teamId: string,
): TeamWindowStats {
  const teamEvents = events.filter(e => e.teamId === teamId)
  const windowEvents = filterEventsByWindow(teamEvents, window)

  return {
    pressureIntensity: calculatePressureIndex(windowEvents, null, window.end - window.start),
    defensiveActions: windowEvents.filter(e => e.type === 'yellowcard' || e.type === 'redcard').length,
    transitionSpeed: 0.5, // Placeholder, would need more detailed data
    setPieceEfficiency: calculateSetPieceEfficiency(windowEvents),
  }
}

/**
 * Gets historical scoring rate for a team in a specific window
 */
function getWindowHistoricalRate(
  teamStats: TeamSeasonStats | undefined,
  window: TemporalWindow,
): number {
  if (!teamStats || !teamStats.seasonStats?.scoringMinutes?.length) {
    return 0
  }

  // Get the corresponding time bucket for this window
  const timeBucket = WINDOW_TO_SCORING_MINUTE_MAP[window.label] || `${window.start}-${window.end}`

  // Find the period that matches our target bucket
  const scoringMinute = teamStats.seasonStats.scoringMinutes[0]
  const period = scoringMinute?.period?.find(p => p.minute === timeBucket)

  if (period) {
    const count = Number.parseInt(period.count, 10) || 0
    // Calculate rate per minute for more precise calculation
    const durationMinutes = window.end - window.start
    const ratePerMatch = count / (teamStats.nbMatches || 1)
    return ratePerMatch * (durationMinutes / 90)
  }

  return 0
}

/**
 * Calculate goal probability based on various factors
 */
function calculateGoalProbability(
  events: MatchEvent[],
  window: TemporalWindow,
  match: Match,
  fixtureInfo?: FixtureInfoResponse,
): number {
  // Skip calculation if we're past this window
  const currentMinute = match.time.minute || 0
  if (currentMinute > window.end) {
    return 0
  }

  // Get events in this window
  const windowEvents = filterEventsByWindow(events, window)

  // Extract stats that influence probability
  const dangerousEvents = windowEvents.filter(e => e.isDangerous).length
  const corners = windowEvents.filter(e => e.type === 'freekick' && e.reason?.includes('corner')).length
  const shotEvents = windowEvents.filter(e => e.type === 'shot').length

  // Window length in minutes
  const windowMinutes = window.end - window.start

  // Calculate basic probability based on events
  let liveProb = 0
  if (dangerousEvents > 0 || corners > 0 || shotEvents > 0) {
    // Base probability calculation
    const pressureIndex = (dangerousEvents * 0.1) + (corners * 0.05) + (shotEvents * 0.08)
    liveProb = Math.min(0.7, pressureIndex) // Cap at 70% for live factors alone
  }

  // Get historical data if fixture info is available
  let historicalProb = 0
  if (fixtureInfo) {
    const { localTeamSeasonStats, visitorTeamSeasonStats } = fixtureInfo

    // Get scoring rates for both teams in this window
    const homeRate = getWindowHistoricalRate(localTeamSeasonStats, window)
    const awayRate = getWindowHistoricalRate(visitorTeamSeasonStats, window)

    // Calculate historical probability using Poisson formula: P(goals > 0) = 1 - e^(-lambda)
    const combinedRate = homeRate + awayRate
    historicalProb = 1 - Math.exp(-combinedRate)
  }

  // Weight to assign historical data vs. live events
  // More weight to historical data for future windows
  let historicalWeight = 0.5
  if (currentMinute < window.start) {
    // For future window, rely more on historical data
    historicalWeight = 0.7
  }
  else if (currentMinute >= window.start && currentMinute <= window.end) {
    // For current window, balance is based on progress through window
    const windowProgress = (currentMinute - window.start) / windowMinutes
    historicalWeight = Math.max(0.2, 0.6 - (windowProgress * 0.4))
  }

  // Combine probabilities with weighted average
  let finalProb = (historicalWeight * historicalProb) + ((1 - historicalWeight) * liveProb)

  // If window is in the past, probability is 0
  if (currentMinute > window.end) {
    finalProb = 0
  }

  return finalProb
}

/**
 * Analyze a single match for temporal goal predictions
 */
export function analyzeTemporal(
  match: Match,
  fixtureInfo?: FixtureInfoResponse,
): WindowAnalysis[] {
  // Skip if match doesn't have necessary data
  if (!match || !match.events?.data) {
    return []
  }

  const events = match.events.data || []
  const windows = PREDICTION_WINDOWS.map((window) => {
    const windowEvents = filterEventsByWindow(events, window)
    const goalProb = calculateGoalProbability(events, window, match, fixtureInfo)

    // Calculate momentum and key factors
    const momentum = calculateAttackMomentum(events, window)
    const keyFactors = identifyKeyFactors(windowEvents, window, match.stats?.data)

    // Determine if window is current, upcoming, or past
    const currentMinute = match.time.minute || 0
    let windowStatus = 'upcoming'
    if (currentMinute > window.end) {
      windowStatus = 'past'
    }
    else if (currentMinute >= window.start && currentMinute <= window.end) {
      windowStatus = 'current'
    }

    // If we have fixture info, add insights from historical head-to-head matches
    const insights: string[] = []
    if (fixtureInfo && fixtureInfo.head2head_detail_list?.length > 0) {
      // Count goals in this window across H2H matches
      let windowGoalCount = 0
      let matchCount = 0

      fixtureInfo.head2head_detail_list.forEach((h2h) => {
        matchCount++
        const { localTeamScoreFT, visitorTeamScoreFT, localTeamScoreHT, visitorTeamScoreHT } = h2h.scores

        // For first half windows, compare HT scores
        if (window.end <= 45 && (localTeamScoreHT > 0 || visitorTeamScoreHT > 0)) {
          windowGoalCount++
        }

        // For second half windows, compare FT-HT difference
        if (window.start >= 45
          && ((localTeamScoreFT > localTeamScoreHT) || (visitorTeamScoreFT > visitorTeamScoreHT))) {
          windowGoalCount++
        }
      })

      const h2hRate = matchCount > 0 ? windowGoalCount / matchCount : 0
      if (h2hRate > 0.5 && matchCount >= 3) {
        insights.push(`${Math.round(h2hRate * 100)}% of H2H matches had goals in this period`)
      }
    }

    // Create a compliant WindowAnalysis object
    return {
      window,
      probability: goalProb,
      keyFactors,
      pressureIndex: momentum * 0.7,
      dangerRatio: windowEvents.filter(e => e.isDangerous).length / Math.max(1, windowEvents.length),
      shotFrequency: windowEvents.filter(e => e.type === 'shot').length / Math.max(1, window.end - window.start),
      setPieceCount: windowEvents.filter(e => e.type === 'freekick').length,
      goalIntensity: windowEvents.filter(e => e.type === 'goal').length * 1.5,
      patternStrength: momentum * 0.5,
      effectiveProbability: goalProb,
      _status: windowStatus, // Add as non-type field for internal use
      _insights: insights, // Add as non-type field for internal use
    }
  })

  return windows
}

/**
 * Enhance match prediction with temporal analysis
 */
export async function enhanceWithTemporalAnalysis(
  matchPrediction: MatchPrediction,
  match: Match,
  fixtureInfo?: FixtureInfoResponse,
): Promise<MatchPrediction> {
  // Skip if match doesn't have necessary data
  if (!match || !match.events?.data) {
    return matchPrediction
  }

  // Analyze temporal windows
  const windows = analyzeTemporal(match, fixtureInfo)

  // Find key moments (events that significantly impact predictions)
  const events = match.events.data

  // Identify goals scored just before a prediction window
  const preWindowGoals = events.filter((e) => {
    if (e.type !== 'goal')
      return false

    const eventMinute = e.minute + (e.extraMinute || 0)
    return PREDICTION_WINDOWS.some(window =>
      eventMinute >= Math.max(0, window.start - 5) && eventMinute < window.start,
    )
  })

  // Identify sequences of pressure that could lead to goals
  const pressureBuildUp = events.filter((e) => {
    if (!e.isDangerous)
      return false

    const eventMinute = e.minute + (e.extraMinute || 0)
    return PREDICTION_WINDOWS.some(window =>
      eventMinute >= window.start && eventMinute <= window.end,
    )
  })

  // Identify defensive errors that could lead to goals
  const defensiveErrors = events.filter((e) => {
    return (e.type === 'yellowcard' || e.type === 'redcard')
      && PREDICTION_WINDOWS.some((window) => {
        const eventMinute = e.minute + (e.extraMinute || 0)
        return eventMinute >= window.start && eventMinute <= window.end
      })
  })

  // Calculate team-specific stats for the current or upcoming window
  const currentMinute = match.time.minute || 0
  const activeWindow = windows.find((w) => {
    const status = (w as any)._status
    return (currentMinute >= w.window.start && currentMinute <= w.window.end)
      || (currentMinute < w.window.start && status === 'upcoming')
  })

  const homeTeamId = match.localteamId.toString()
  const awayTeamId = match.visitorteamId.toString()

  // Create proper TeamWindowStats objects
  const homeStatsData = activeWindow
    ? calculateTeamWindowStats(events, activeWindow.window, homeTeamId)
    : { pressureIntensity: 0, defensiveActions: 0, transitionSpeed: 0, setPieceEfficiency: 0 }

  const awayStatsData = activeWindow
    ? calculateTeamWindowStats(events, activeWindow.window, awayTeamId)
    : { pressureIntensity: 0, defensiveActions: 0, transitionSpeed: 0, setPieceEfficiency: 0 }

  // Calculate momentum difference (positive = home team advantage)
  const momentumDiff = (homeStatsData as any).attackMomentum - (awayStatsData as any).attackMomentum

  // Estimate fatigue based on match minute and recent high-intensity events
  const fatigueIndex = Math.min(1, currentMinute / 100)
    * (1 + 0.1 * (events.filter(e =>
      e.type === 'substitution' && e.minute + (e.extraMinute || 0) > currentMinute - 10,
    ).length))

  return {
    ...matchPrediction,
    temporalGoalProbability: {
      windows,
      keyMoments: {
        preWindowGoals,
        pressureBuildUp,
        defensiveErrors,
      },
      teamComparison: {
        home: homeStatsData,
        away: awayStatsData,
      },
      momentumAnalysis: {
        attackMomentum: momentumDiff,
        defenseStability: 0.5 + (0.1 * ((homeStatsData as any).pressure - (awayStatsData as any).pressure)),
        fatigueIndex,
      },
      lastUpdated: new Date().toISOString(),
    },
  }
}

/**
 * Gets a high-impact factor summary string
 */
export function getTemporalSummary(windows: WindowAnalysis[]): string {
  if (!windows || windows.length === 0) {
    return 'No temporal data available'
  }

  // Find window with highest probability
  const sortedWindows = [...windows].sort((a, b) => b.probability - a.probability)
  const highestWindow = sortedWindows[0]

  // Format probability as percentage
  const probability = Math.round(highestWindow.probability * 100)

  // Get key factors as string
  const factorsText = highestWindow.keyFactors.join(' + ')

  return `${probability}% Goal in ${highestWindow.window.label}${
    factorsText !== 'Normal play' ? `: ${factorsText}` : ''}`
}
