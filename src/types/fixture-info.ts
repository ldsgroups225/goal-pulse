// src/types/fixture-info.ts

/**
 * Type definitions for the fixture info API response
 * https://api.betmines.com/betmines/v1/fixtures/info/<fixture_id>?includeSeasonStats=true
 */

export interface FixtureInfoResponse {
  id: number
  league: League
  localTeam: LocalTeam
  visitorTeam: VisitorTeam
  localTeamScore: number
  visitorTeamScore: number
  localTeamSeasonStats: TeamSeasonStats
  visitorTeamSeasonStats: TeamSeasonStats
  probability: Probability
  matchStarted: boolean
  matchEndend: boolean
  matchHT: boolean
  matchSecondHalfStarted: boolean
  minute: number
  timestamp: number
  head2head_detail_list: Head2HeadDetail[]
  additionalData: AdditionalData
  // Odds fields
  odd1: string
  odd2: string
  oddx: string
  oddOver05: string
  oddOver15: string
  oddOver25: string
  oddOver35: string
  oddOver45: string
  oddUnder05: string
  oddUnder15: string
  oddUnder25: string
  oddUnder35: string
  oddUnder45: string
  oddGoal: string
  oddNoGoal: string
}

export interface League {
  id: number
  name: string
  logoUrl?: string
}

export interface LocalTeam {
  id: number
  name: string
  logoPath: string
}

export interface VisitorTeam {
  id: number
  name: string
  logoPath: string
}

export interface AdditionalData {
  stadium?: string
  address?: string
  city?: string
  referee?: string
  weatherType?: string
  weatherTemp?: number
}

export interface Probability {
  home: number
  draw: number
  away: number
  over_0_5_ht: number
  over_1_5_ht: number
  over_1_5: number
  over_2_5: number
  over_3_5: number
  under_0_5_ht: number
  under_1_5_ht: number
  under_1_5: number
  under_2_5: number
  under_3_5: number
  btts: number
  btts_no: number
  HT_over_0_5: number
  HT_over_1_5: number
  HT_under_0_5: number
  HT_under_1_5: number
  AT_over_0_5: number
  AT_over_1_5: number
  AT_under_0_5: number
  AT_under_1_5: number
  over_0_5_2nd_half: number
  over_1_5_2nd_half: number
  under_0_5_2nd_half: number
  under_1_5_2nd_half: number
  gg_ht: number
  ng_ht: number
  gg_2nd_half: number
  ng_2nd_half: number
}

export interface TeamSeasonStats {
  id: number
  team: {
    id: number
    name: string
    logoPath: string
    shortCode: string
  }
  nbMatches: number
  nbHomeMatches: number
  nbAwayMatches: number
  totalGoals: number
  totalHomeGoals: number
  totalAwayGoals: number
  totalConcededGoals: number
  totalHomeConcededGoals: number
  totalAwayConcededGoals: number
  avgTotalGoals: number
  avgTotalHomeGoals: number
  avgTotalAwayGoals: number
  avgTotalConcededGoals: number
  avgTotalHomeConcededGoals: number
  avgTotalAwayConcededGoals: number
  seasonStats?: {
    scoringMinutes: ScoringMinute[]
  }
}

export interface ScoringMinute {
  period: {
    minute: string
    count: string
    percentage: string
  }[]
}

export interface Head2HeadDetail {
  league: {
    data: {
      id: number
      name: string
    }
  }
  localteamId: number
  visitorteamId: number
  scores: {
    localTeamScore: number
    visitorTeamScore: number
    localTeamScoreFT: number
    visitorTeamScoreFT: number
    localTeamScoreHT: number
    visitorTeamScoreHT: number
    ftScore: string
    htScore: string
  }
  time: {
    status: string
    minute: number
    startingAt: {
      timestamp: number
      date: string
      time: string
      dateTime: string
    }
  }
  stats?: {
    data: Array<{
      teamId: number
      goals: number
      shots: {
        total: number
        ongoal: number
        offgoal: number
      }
    }>
  }
}
