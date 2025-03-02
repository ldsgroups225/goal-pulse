import type { Match, MatchEvent, MatchPrediction, TeamWindowStats, TemporalWindow, WindowAnalysis } from '@/types'

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

/**
 * Filter events by time window
 */
export function filterEventsByWindow(
  events: MatchEvent[],
  window: TemporalWindow,
  includeBuildUp: boolean = false,
): MatchEvent[] {
  const buffer = includeBuildUp ? 5 : 0
  return events.filter((e) => {
    const eventMinute = e.minute + (e.extraMinute || 0)
    return eventMinute >= (window.start - buffer)
      && eventMinute <= window.end
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
  const windowEvents = filterEventsByWindow(events, window, true)

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
  const windowEvents = filterEventsByWindow(teamEvents, window, true)

  return {
    pressureIntensity: calculatePressureIndex(windowEvents, null, window.end - window.start),
    defensiveActions: windowEvents.filter(e => e.type === 'yellowcard' || e.type === 'redcard').length,
    transitionSpeed: 0.5, // Placeholder, would need more detailed data
    setPieceEfficiency: calculateSetPieceEfficiency(windowEvents),
  }
}

/**
 * Calculate goal probability based on various factors
 */
function calculateGoalProbability(
  events: MatchEvent[],
  window: TemporalWindow,
  _match: Match,
): number {
  const _windowEvents = filterEventsByWindow(events, window)
  const buildupEvents = filterEventsByWindow(events, window, true)

  // Base probability factors
  const baseProbability = 0.15 // Starting point

  // Calculate factors
  const pressure = calculatePressureIndex(buildupEvents, null, window.end - window.start)
  const momentum = calculateAttackMomentum(events, window)

  // Set piece influence
  const setPieces = buildupEvents.filter(e => e.type === 'freekick').length
  const setPieceFactor = Math.min(0.2, setPieces * 0.05)

  // Card factor (more cards = higher chance of defensive mistakes)
  const cards = buildupEvents.filter(e => e.type === 'yellowcard' || e.type === 'redcard').length
  const cardFactor = Math.min(0.15, cards * 0.05)

  // Window specific weights
  const windowConfig = WINDOW_FACTORS[window.label as keyof typeof WINDOW_FACTORS]
  const windowWeight = windowConfig?.weight || 0.3

  // Calculate total probability
  let probability = baseProbability
    + (pressure * 0.25)
    + (momentum * 0.2)
    + setPieceFactor
    + cardFactor

  // Apply window weight
  probability = probability * windowWeight

  // Cap between 1% and 95%
  return Math.min(0.95, Math.max(0.01, probability))
}

/**
 * Analyze a single match for temporal goal predictions
 */
export function analyzeTemporal(match: Match): WindowAnalysis[] {
  // Validate match data
  if (!match || !match.events?.data || !match.stats?.data) {
    return []
  }

  const events = match.events.data
  const windows: WindowAnalysis[] = []

  // Analyze each predefined window
  PREDICTION_WINDOWS.forEach((window) => {
    const windowEvents = filterEventsByWindow(events, window)
    const buildupEvents = filterEventsByWindow(events, window, true)

    // Skip if match hasn't reached this time window yet
    const currentMinute = match.time?.minute || 0
    if (currentMinute < window.start) {
      return
    }

    // Calculate probability
    const probability = calculateGoalProbability(events, window, match)

    // Calculate supporting metrics
    const pressureIndex = calculatePressureIndex(buildupEvents, null, window.end - window.start)
    const shots = windowEvents.filter(e => e.isDangerous).length
    const totalEvents = windowEvents.length || 1
    const dangerRatio = shots / totalEvents
    const shotFrequency = shots / (window.end - window.start)
    const setPieceCount = windowEvents.filter(e => e.type === 'freekick').length

    // Identify key factors
    const keyFactors = identifyKeyFactors(buildupEvents, window, null)

    // Create window analysis
    windows.push({
      window,
      probability,
      keyFactors,
      pressureIndex,
      dangerRatio,
      shotFrequency,
      setPieceCount,
      goalIntensity: pressureIndex * 0.8, // Default calculation based on pressure index
      patternStrength: Math.min(setPieceCount * 0.5 + shotFrequency * 0.5, 10), // Default calculation based on existing metrics
    })
  })

  return windows
}

/**
 * Enhance match prediction with temporal analysis
 */
export function enhanceWithTemporalAnalysis(
  matchPrediction: MatchPrediction,
  match: Match,
): MatchPrediction {
  // Skip if missing required data
  if (!match || !match.events?.data) {
    return matchPrediction
  }

  const events = match.events.data
  const windows = analyzeTemporal(match)

  // Get team IDs
  const homeTeamId = match.localteamId?.toString()
  const awayTeamId = match.visitorteamId?.toString()

  // Enhance prediction with temporal analysis
  const enhancedPrediction: MatchPrediction = {
    ...matchPrediction,
    temporalGoalProbability: {
      windows,
      keyMoments: {
        preWindowGoals: events.filter(e => e.type === 'goal'),
        pressureBuildUp: events.filter(e => e.isDangerous),
        defensiveErrors: events.filter(e => e.type === 'yellowcard' || e.type === 'redcard'),
      },
      teamComparison: {
        home: homeTeamId
          ? calculateTeamWindowStats(
              events,
              PREDICTION_WINDOWS[PREDICTION_WINDOWS.length - 1],
              homeTeamId,
            )
          : {
              pressureIntensity: 0,
              defensiveActions: 0,
              transitionSpeed: 0,
              setPieceEfficiency: 0,
            },
        away: awayTeamId
          ? calculateTeamWindowStats(
              events,
              PREDICTION_WINDOWS[PREDICTION_WINDOWS.length - 1],
              awayTeamId,
            )
          : {
              pressureIntensity: 0,
              defensiveActions: 0,
              transitionSpeed: 0,
              setPieceEfficiency: 0,
            },
      },
      momentumAnalysis: {
        attackMomentum: calculateAttackMomentum(events, PREDICTION_WINDOWS[PREDICTION_WINDOWS.length - 1]),
        defenseStability: 0.5, // Would need more detailed defensive tracking
        fatigueIndex: 0.3 * (match.time?.minute || 0) / 90, // Simple fatigue model based on match time
      },
      lastUpdated: new Date().toISOString(),
    },
  }

  return enhancedPrediction
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
