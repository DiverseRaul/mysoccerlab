import { describe, it, expect } from 'vitest'
import { detectTrends } from '../../src/lib/trends'

// Helper: build a match on a given day index with stats.
const mk = (day, stats) => ({
  match_date: `2026-01-${String(day).padStart(2, '0')}`,
  position_played: 'Central Midfielder',
  ...stats
})

describe('detectTrends', () => {
  it('returns nothing with fewer than 6 matches', () => {
    const matches = [1, 2, 3, 4, 5].map((d) => mk(d, { successful_passes: 30, unsuccessful_passes: 5 }))
    expect(detectTrends(matches)).toEqual([])
  })

  it('flags a pass-accuracy drop in the recent window', () => {
    // 5 baseline games ~90% passing, then 3 recent ~60%.
    const baseline = [1, 2, 3, 4, 5].map((d) => mk(d, { successful_passes: 45, unsuccessful_passes: 5 }))
    const recent = [6, 7, 8].map((d) => mk(d, { successful_passes: 30, unsuccessful_passes: 20 }))
    const alerts = detectTrends([...baseline, ...recent])
    const pass = alerts.find((a) => a.key === 'pass')
    expect(pass).toBeTruthy()
    expect(pass.dir).toBe('down')
    expect(pass.severity).toBe('bad')
  })

  it('does not flag pass accuracy when stable', () => {
    const matches = Array.from({ length: 8 }, (_, i) => mk(i + 1, { successful_passes: 40, unsuccessful_passes: 10 }))
    const alerts = detectTrends(matches)
    expect(alerts.find((a) => a.key === 'pass')).toBeFalsy()
  })

  it('sorts bad-news alerts before info, and caps the count', () => {
    const baseline = [1, 2, 3, 4, 5].map((d) => mk(d, { successful_passes: 45, unsuccessful_passes: 5, my_goals: 2, shots_on_target: 4 }))
    const recent = [6, 7, 8].map((d) => mk(d, { successful_passes: 20, unsuccessful_passes: 30, my_goals: 0, shots_on_target: 1 }))
    const alerts = detectTrends([...baseline, ...recent], 2)
    expect(alerts.length).toBeLessThanOrEqual(2)
    if (alerts.length) expect(alerts[0].severity === 'bad' || alerts[0].severity === 'good').toBe(true)
  })
})
