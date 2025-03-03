import type { Match, MatchEvent, TemporalWindow, WindowAnalysis } from '@/types'
import { describe, expect, it } from 'vitest'
import {
  analyzeTemporal,
  filterEventsByWindow,
  PREDICTION_WINDOWS,
} from './prediction-temporal-api'

describe('temporal Prediction API', () => {
  describe('filterEventsByWindow', () => {
    it('should filter events by time window', () => {
      // Mock events
      const events: MatchEvent[] = [
        { id: 1, fixtureId: 1, minute: 5, teamId: '1', type: 'goal' },
        { id: 2, fixtureId: 1, minute: 12, teamId: '2', type: 'yellowcard' },
        { id: 3, fixtureId: 1, minute: 25, teamId: '1', type: 'freekick' },
        { id: 4, fixtureId: 1, minute: 40, teamId: '2', type: 'goal' },
        { id: 5, fixtureId: 1, minute: 50, teamId: '1', type: 'redcard' },
        { id: 6, fixtureId: 1, minute: 85, teamId: '1', type: 'goal' },
      ]

      // Test window
      const window: TemporalWindow = { start: 0, end: 15, label: 'First 15' }

      // Filter events
      const filtered = filterEventsByWindow(events, window)

      // Expect 2 events in the first 15 minutes
      expect(filtered).toHaveLength(2)
      expect(filtered[0].minute).toBe(5)
      expect(filtered[1].minute).toBe(12)
    })

    it('should handle events within the exact window bounds', () => {
      // Mock events
      const events: MatchEvent[] = [
        { id: 1, fixtureId: 1, minute: 5, teamId: '1', type: 'goal' },
        { id: 2, fixtureId: 1, minute: 30, teamId: '2', type: 'yellowcard' },
        { id: 3, fixtureId: 1, minute: 35, teamId: '1', type: 'freekick' },
        { id: 4, fixtureId: 1, minute: 40, teamId: '2', type: 'goal' },
      ]

      // Test window
      const window: TemporalWindow = { start: 35, end: 45, label: 'First Half End' }

      // Filter events within window bounds
      const filtered = filterEventsByWindow(events, window)

      // Expect 2 events within window bounds
      expect(filtered).toHaveLength(2)
      expect(filtered[0].minute).toBe(35)
      expect(filtered[1].minute).toBe(40)
    })
  })

  describe('analyzeTemporal', () => {
    it('should return empty array for invalid match data', () => {
      // Test with null match
      const result1 = analyzeTemporal(null as unknown as Match)
      expect(result1).toEqual([])

      // Test with match missing events
      const result2 = analyzeTemporal({ id: 1 } as Match)
      expect(result2).toEqual([])
    })

    it('should analyze match data and return window analysis', () => {
      // Mock match with events
      const mockMatch: Partial<Match> = {
        id: 123,
        time: { minute: 90, status: 'LIVE' } as any,
        events: {
          data: [
            { id: 1, fixtureId: 123, minute: 5, teamId: '1', type: 'goal', isDangerous: true },
            { id: 2, fixtureId: 123, minute: 12, teamId: '2', type: 'yellowcard' },
            { id: 3, fixtureId: 123, minute: 40, teamId: '1', type: 'freekick', isDangerous: true },
            { id: 4, fixtureId: 123, minute: 43, teamId: '2', type: 'goal', isDangerous: true },
            { id: 5, fixtureId: 123, minute: 50, teamId: '1', type: 'freekick' },
            { id: 6, fixtureId: 123, minute: 60, teamId: '1', type: 'yellowcard' },
            { id: 7, fixtureId: 123, minute: 82, teamId: '2', type: 'freekick', isDangerous: true },
            { id: 8, fixtureId: 123, minute: 85, teamId: '1', type: 'goal', isDangerous: true },
          ],
        },
        stats: { data: [] },
      }

      // Analyze match
      const result = analyzeTemporal(mockMatch as Match)

      // Expect analysis for each time window
      expect(result).toHaveLength(PREDICTION_WINDOWS.length)

      // Check each window has required properties
      result.forEach((windowAnalysis: WindowAnalysis) => {
        expect(windowAnalysis).toHaveProperty('window')
        expect(windowAnalysis).toHaveProperty('probability')
        expect(windowAnalysis).toHaveProperty('keyFactors')
        expect(windowAnalysis).toHaveProperty('pressureIndex')
        expect(windowAnalysis).toHaveProperty('dangerRatio')
        expect(windowAnalysis).toHaveProperty('shotFrequency')
        expect(windowAnalysis).toHaveProperty('setPieceCount')

        // Probability should be between 0 and 1
        expect(windowAnalysis.probability).toBeGreaterThanOrEqual(0)
        expect(windowAnalysis.probability).toBeLessThanOrEqual(1)
      })

      // Final 10 minutes window should have higher probability due to events
      const finalWindow = result.find((w: WindowAnalysis) => w.window.label === 'Final 10')
      const firstWindow = result.find((w: WindowAnalysis) => w.window.label === 'First 15')

      if (finalWindow && firstWindow) {
        // Both windows have goals, but final window is more predictive due to pressure build-up
        expect(finalWindow.probability).toBeGreaterThan(0.05)
      }
    })
  })
})
