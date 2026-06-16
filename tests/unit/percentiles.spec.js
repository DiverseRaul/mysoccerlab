import { describe, it, expect } from 'vitest'
import { percentileRank, playerMetrics } from '../../src/lib/percentiles'

describe('percentileRank', () => {
  it('returns null on empty data or non-finite value', () => {
    expect(percentileRank([], 5)).toBeNull()
    expect(percentileRank([1, 2, 3], NaN)).toBeNull()
  })

  it('top value ranks ~100, bottom ranks low', () => {
    const vals = [10, 20, 30, 40, 50]
    expect(percentileRank(vals, 50)).toBe(100)
    expect(percentileRank(vals, 10)).toBe(20)
    expect(percentileRank(vals, 30)).toBe(60)
  })

  it('a value above all data is 100', () => {
    expect(percentileRank([1, 2, 3], 99)).toBe(100)
  })

  it('ignores non-numeric entries', () => {
    expect(percentileRank([1, null, 'x', 3], 3)).toBe(100)
  })
})

describe('playerMetrics', () => {
  it('returns null with no matches', () => {
    expect(playerMetrics([], 0)).toBeNull()
    expect(playerMetrics(null, 5)).toBeNull()
  })

  it('computes per-match aggregates and pass accuracy', () => {
    const rows = [
      { successful_passes: 30, unsuccessful_passes: 10, assists: 1, tackles: 2, interceptions: 1, clearances: 0 },
      { successful_passes: 50, unsuccessful_passes: 10, assists: 1, tackles: 0, interceptions: 1, clearances: 2 }
    ]
    const m = playerMetrics(rows, 4)
    expect(m.passAccuracy).toBeCloseTo((80 / 100) * 100, 5) // 80/100
    expect(m.goalsPerMatch).toBe(2)        // 4 goals / 2 games
    expect(m.assistsPerMatch).toBe(1)      // 2 assists / 2 games
    expect(m.defActionsPerMatch).toBe(3)   // (3 + 3) / 2
  })

  it('handles zero passes without dividing by zero', () => {
    const m = playerMetrics([{ assists: 0 }], 0)
    expect(m.passAccuracy).toBe(0)
    expect(m.goalsPerMatch).toBe(0)
  })
})
