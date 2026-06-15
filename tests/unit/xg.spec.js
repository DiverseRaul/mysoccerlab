import { describe, it, expect } from 'vitest'
import { expectedGoal, sumExpectedGoals } from '@/lib/xg'

describe('expectedGoal', () => {
  it('rates a close central chance far higher than a long-range one', () => {
    const sixYardCentral = expectedGoal('50,3')
    const edgeOfBox = expectedGoal('50,15')
    const longRange = expectedGoal('50,35')
    expect(sixYardCentral).toBeGreaterThan(edgeOfBox)
    expect(edgeOfBox).toBeGreaterThan(longRange)
    expect(sixYardCentral).toBeGreaterThan(0.6)
  })

  it('penalises tight angles — a wide shot is worth less than a central one at the same distance', () => {
    const central = expectedGoal('50,10')
    const wide = expectedGoal('15,10')
    expect(central).toBeGreaterThan(wide)
  })

  it('returns a near-zero value from your own half', () => {
    expect(expectedGoal('50,70')).toBeLessThanOrEqual(0.05)
  })

  it('accepts {XPct,YPct} objects and clamps to 0.01–0.99', () => {
    const v = expectedGoal({ XPct: 50, YPct: 1 })
    expect(v).toBeGreaterThanOrEqual(0.01)
    expect(v).toBeLessThanOrEqual(0.99)
  })

  it('returns null for unparseable input', () => {
    expect(expectedGoal(null)).toBeNull()
    expect(expectedGoal('abc')).toBeNull()
  })
})

describe('sumExpectedGoals', () => {
  it('sums xG across items with a field_position, ignoring those without', () => {
    const total = sumExpectedGoals([
      { field_position: '50,5' },
      { field_position: '50,20' },
      { field_position: null }
    ])
    expect(parseFloat(total)).toBeGreaterThan(0)
    expect(total).toMatch(/^\d+\.\d{2}$/)
  })
})
