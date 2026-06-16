import { describe, it, expect } from 'vitest'
import { computePacing, elapsedFraction, seasonKey } from '../../src/lib/seasonGoals'

const season = { start_date: '2026-01-01', end_date: '2026-12-31' }

describe('seasonKey', () => {
  it('maps null/undefined to all-time key, else stringifies', () => {
    expect(seasonKey(null)).toBe('all')
    expect(seasonKey(undefined)).toBe('all')
    expect(seasonKey(42)).toBe('42')
    expect(seasonKey('s1')).toBe('s1')
  })
})

describe('elapsedFraction', () => {
  it('is ~0.5 at mid-season and clamps to [0,1]', () => {
    const mid = elapsedFraction(season, new Date('2026-07-02'))
    expect(mid).toBeGreaterThan(0.45)
    expect(mid).toBeLessThan(0.55)
    expect(elapsedFraction(season, new Date('2025-01-01'))).toBe(0)
    expect(elapsedFraction(season, new Date('2027-01-01'))).toBe(1)
  })
  it('returns null without valid dates', () => {
    expect(elapsedFraction(null)).toBeNull()
    expect(elapsedFraction({ start_date: null, end_date: null })).toBeNull()
  })
})

describe('computePacing', () => {
  it('returns none when there is no target', () => {
    const p = computePacing(3, 0, season, new Date('2026-07-02'))
    expect(p.state).toBe('none')
  })

  it('is "ahead" when actual beats the expected-by-now', () => {
    // target 10 over a year, mid-season expected ~5; actual 7 → ahead
    const p = computePacing(7, 10, season, new Date('2026-07-02'))
    expect(p.expected).toBeGreaterThan(4)
    expect(p.expected).toBeLessThan(6)
    expect(p.state).toBe('ahead')
    expect(p.pct).toBe(70)
  })

  it('is "behind" when actual lags expected', () => {
    const p = computePacing(2, 10, season, new Date('2026-07-02'))
    expect(p.state).toBe('behind')
  })

  it('without season dates, paces as on-track and caps pct at 100', () => {
    const p = computePacing(15, 10, null, new Date('2026-07-02'))
    expect(p.expected).toBeNull()
    expect(p.pct).toBe(100)
    expect(p.state).toBe('ahead')
  })
})
