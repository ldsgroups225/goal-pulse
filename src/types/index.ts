export interface MatchEvent {
  fixtureId: number
  id: number
  minute: number
  playerId?: number
  playerName?: string
  reason?: string
  result?: string
  teamId: string
  type: 'goal' | 'yellowcard' | 'redcard' | 'substitution' | 'freekick' | 'offside' | 'var' | 'shot' | 'corner'
  extraMinute?: number
  isDangerous?: boolean
  x?: number
  y?: number
}

export interface MatchStats {
  attacks: {
    attacks: number
    dangerous_attacks: number
  }
  ballSafe: number
  corners: number
  fixtureId: number
  goals: number
  injuries: number
  penalties: number
  possessiontime: number
  redcards: number
  shots: {
    offgoal: number
    ongoal: number
    total: number
  }
  substitutions: number
  teamId: number
  yellowcards: number
}

export interface Team {
  data: {
    countryId: number
    currentSeasonId: number
    founded: number
    id: number
    legacyId: number
    logoPath: string
    name: string
    nationalTeam: boolean
    venueId: number
  }
}

export interface League {
  data: {
    id: number
    name: string
    type: string
    logoPath: string
    countryId: number
    currentSeasonId: number
    currentRoundId: number
    currentStageId: number
    isCup: boolean
    legacyId: number
    country: {
      data: {
        name: string
        image_path: string
      }
    }
    additionalProperties: {
      entry: Array<{
        key: string
        value: any
      }>
    }
  }
}

export interface MatchScores {
  ftScore: string
  htScore: string
  localTeamScore: number
  visitorTeamScore: number
}

export interface MatchTime {
  minute: number
  status: string
  startingAt: {
    date: string
    dateTime: string
    time: string
    timestamp: number
    timezone: string
  }
}

export interface Match {
  id: number
  leagueId: number
  seasonId: number
  stageId: number
  roundId: number
  localteamId: number
  visitorteamId: number
  venueId: number
  commentaries: boolean
  deleted: boolean
  time: MatchTime
  scores: MatchScores
  league: League
  localTeam: Team
  visitorTeam: Team
  stats: {
    data: MatchStats[]
  }
  events: {
    data: MatchEvent[]
  }
  standings: {
    localteamPoosition: number
    visitorteamPosition: number
  }
  winningOddsCalculated: boolean
  weatherReport?: {
    clouds: string
    code: string
    humidity: string
    icon: string
    temperature: {
      temp: number
      unit: string
    }
    temperatureCelcius: {
      temp: number
      unit: string
    }
    type: string
    wind: {
      degree: number
      speed: string
    }
  }
  temporalStats?: {
    windows: TemporalWindow[]
    metrics: TemporalStats[]
  }
  momentumHistory?: {
    attack: number[]
    defense: number[]
  }
  fatigueEstimation?: {
    home: number
    away: number
  }
  criticalZones?: {
    leftChannel: number
    centerBox: number
    rightChannel: number
  }
}

export interface LiveScoreResponse {
  [key: string]: Match
}

export interface MatchPrediction {
  fixtureId: number
  league: {
    name: string
    country: string
    logoUrl: string
  }
  teams: {
    home: {
      name: string
      logoUrl: string
      score: number
    }
    away: {
      name: string
      logoUrl: string
      score: number
    }
  }
  status: {
    minute: number
    status: string
    isLive: boolean
  }
  prediction: {
    winProbability: {
      home: number
      draw: number
      away: number
    }
    recommendedBet: string
    confidence: number
    reasons: string[]
    goals: {
      over15: number
      over25: number
      over35: number
      btts: number
    }
  }
  stats: {
    possession: {
      home: number
      away: number
    }
    shots: {
      home: {
        total: number
        onTarget: number
        offTarget: number
      }
      away: {
        total: number
        onTarget: number
        offTarget: number
      }
    }
    attacks: {
      home: {
        total: number
        dangerous: number
      }
      away: {
        total: number
        dangerous: number
      }
    }
    cards: {
      home: {
        yellow: number
        red: number
      }
      away: {
        yellow: number
        red: number
      }
    }
    corners: {
      home: number
      away: number
    }
  }
  temporalGoalProbability?: {
    windows: WindowAnalysis[]
    keyMoments: {
      preWindowGoals: MatchEvent[]
      pressureBuildUp: MatchEvent[]
      defensiveErrors: MatchEvent[]
    }
    teamComparison: {
      home: TeamWindowStats
      away: TeamWindowStats
    }
    momentumAnalysis: {
      attackMomentum: number
      defenseStability: number
      fatigueIndex: number
    }
    lastUpdated: string
  }
  lastUpdated: string
}

export interface TemporalWindow {
  start: number
  end: number
  label: string
}

export interface WindowAnalysis {
  window: TemporalWindow
  probability: number
  keyFactors: string[]
  pressureIndex: number
  dangerRatio: number
  shotFrequency: number
  setPieceCount: number
  goalIntensity: number
  patternStrength: number
  effectiveProbability?: number
}

export interface TemporalStats {
  window: TemporalWindow
  shots: number
  shotsOnTarget: number
  dangerousAttacks: number
  corners: number
  freekicks: number
  cards: number
  expectedGoals: number
}

export interface TeamWindowStats {
  pressureIntensity: number
  defensiveActions: number
  transitionSpeed: number
  setPieceEfficiency: number
}
