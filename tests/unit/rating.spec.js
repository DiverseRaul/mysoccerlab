import { describe, it, expect } from 'vitest'
import { calculateMatchRating, getRatingColor, getRatingLabel } from '@/lib/rating'

const rate = (match, live) => parseFloat(calculateMatchRating(match, live))

const striker = (overrides = {}, live = null) =>
  rate({ position_played: 'Striker', score_for: 1, score_against: 1, ...overrides }, live)

describe('outfield goal balance (v4 rebalance)', () => {
  it('a single goal lifts a striker into "Good", not "Excellent"', () => {
    // Regression guard: pre-v4 a lone goal produced ~8.25 ("Excellent").
    const r = striker({ score_for: 2, score_against: 1 }, { goals: 1, shotsOn: 1, shotsOff: 0 })
    expect(r).toBeGreaterThanOrEqual(7.0)
    expect(r).toBeLessThan(8.0)
    expect(getRatingLabel(r)).toBe('Good')
  })

  it('a lone goal in a draw with no other end product stays in the low 7s', () => {
    const r = striker({ score_for: 1, score_against: 1 }, { goals: 1, shotsOn: 0, shotsOff: 0 })
    expect(r).toBeGreaterThanOrEqual(6.8)
    expect(r).toBeLessThanOrEqual(7.3)
  })

  it('a brace reaches "Excellent" and a hat-trick "Outstanding"', () => {
    const brace = striker({ score_for: 3, score_against: 1 }, { goals: 2, shotsOn: 2, shotsOff: 1 })
    const hatTrick = striker({ score_for: 4, score_against: 1 }, { goals: 3, shotsOn: 3, shotsOff: 1 })
    expect(getRatingLabel(brace)).toBe('Excellent')
    expect(hatTrick).toBeGreaterThanOrEqual(9.0)
  })

  it('applies diminishing returns: each extra goal adds less than the last', () => {
    const base = { position_played: 'Striker', score_for: 3, score_against: 0 }
    const r0 = rate(base, { goals: 0, shotsOn: 0, shotsOff: 0 })
    const r1 = rate(base, { goals: 1, shotsOn: 0, shotsOff: 0 })
    const r2 = rate(base, { goals: 2, shotsOn: 0, shotsOff: 0 })
    const r3 = rate(base, { goals: 3, shotsOn: 0, shotsOff: 0 })
    expect(r1).toBeGreaterThan(r0)
    expect(r2 - r1).toBeLessThan(r1 - r0)
    expect(r3 - r2).toBeLessThan(r2 - r1)
  })

  it('keeps goal worth more than assist, and assist more than a created chance', () => {
    const base = { position_played: 'Striker', score_for: 1, score_against: 1 }
    const withGoal = rate({ ...base }, { goals: 1, shotsOn: 0, shotsOff: 0 })
    const withAssist = rate({ ...base, assists: 1 }, { goals: 0, shotsOn: 0, shotsOff: 0 })
    const withChance = rate({ ...base, created_chances: 1 }, { goals: 0, shotsOn: 0, shotsOff: 0 })
    expect(withGoal).toBeGreaterThan(withAssist)
    expect(withAssist).toBeGreaterThan(withChance)
  })

  it('rewards strikers more per goal than deeper outfield roles', () => {
    const live = { goals: 1, shotsOn: 1, shotsOff: 0 }
    const fwd = rate({ position_played: 'Striker', score_for: 2, score_against: 1 }, live)
    const cb = rate({ position_played: 'Centre-Back', score_for: 2, score_against: 1 }, live)
    expect(fwd).toBeGreaterThan(cb)
  })
})

describe('overall scale sanity', () => {
  it('an average, uneventful game sits near the 6.0 baseline', () => {
    const r = rate({
      position_played: 'Central Midfielder',
      score_for: 1, score_against: 1,
      successful_passes: 20, unsuccessful_passes: 6
    })
    expect(r).toBeGreaterThan(5.0)
    expect(r).toBeLessThan(7.0)
  })

  it('only a complete all-round performance reaches World Class', () => {
    const r = rate({
      position_played: 'Striker', score_for: 5, score_against: 0,
      assists: 2, created_chances: 3,
      successful_passes: 30, unsuccessful_passes: 3
    }, { goals: 3, shotsOn: 4, shotsOff: 0 })
    expect(getRatingLabel(r)).toBe('World Class')
  })

  it('penalises a conceded penalty (own-box foul) hard', () => {
    const base = { position_played: 'Centre-Back', score_for: 1, score_against: 1, successful_passes: 20, unsuccessful_passes: 4 }
    const clean = rate({ ...base })
    const gavePen = rate({ ...base, penalties_conceded: 1 })
    expect(clean - gavePen).toBeGreaterThan(1.0)
  })

  it('clamps results to the 1.0–10.0 range', () => {
    const disaster = rate({
      position_played: 'Centre-Back', score_for: 0, score_against: 6,
      own_goals: 2, red_card: 1, errors_led_to_goal: 2
    })
    expect(disaster).toBeGreaterThanOrEqual(1.0)
    const perfect = rate({
      position_played: 'Striker', score_for: 9, score_against: 0, assists: 5
    }, { goals: 6, shotsOn: 8, shotsOff: 0 })
    expect(perfect).toBeLessThanOrEqual(10.0)
  })
})

describe('goalkeeper formula', () => {
  it('rewards an earned clean sheet more than an untested one', () => {
    const busy = rate(
      { position_played: 'Goalkeeper', score_for: 1, score_against: 0 },
      { gkStats: { goals_conceded: 0, saves: 7 } }
    )
    const quiet = rate(
      { position_played: 'Goalkeeper', score_for: 1, score_against: 0 },
      { gkStats: { goals_conceded: 0, saves: 0 } }
    )
    expect(busy).toBeGreaterThan(quiet)
  })

  it('treats a saved penalty as a major positive', () => {
    const withSave = rate(
      { position_played: 'Goalkeeper', score_for: 1, score_against: 1 },
      { gkStats: { goals_conceded: 1, saves: 3, penalties_saved: 1 } }
    )
    const withoutSave = rate(
      { position_played: 'Goalkeeper', score_for: 1, score_against: 1 },
      { gkStats: { goals_conceded: 1, saves: 3, penalties_saved: 0 } }
    )
    expect(withSave).toBeGreaterThan(withoutSave + 1.0)
  })
})

describe('getRatingColor / getRatingLabel boundaries', () => {
  it('maps tier thresholds to the right class', () => {
    expect(getRatingColor('9.6')).toBe('rating-world-class')
    expect(getRatingColor('9.0')).toBe('rating-elite')
    expect(getRatingColor('8.0')).toBe('rating-excellent')
    expect(getRatingColor('7.0')).toBe('rating-good')
    expect(getRatingColor('6.0')).toBe('rating-average')
    expect(getRatingColor('5.0')).toBe('rating-poor')
    expect(getRatingColor('3.0')).toBe('rating-bad')
  })

  it('maps tier thresholds to the right label', () => {
    expect(getRatingLabel('9.6')).toBe('World Class')
    expect(getRatingLabel('9.0')).toBe('Outstanding')
    expect(getRatingLabel('8.0')).toBe('Excellent')
    expect(getRatingLabel('7.0')).toBe('Good')
    expect(getRatingLabel('6.5')).toBe('Solid')
    expect(getRatingLabel('6.0')).toBe('Average')
    expect(getRatingLabel('5.5')).toBe('Below Average')
    expect(getRatingLabel('4.0')).toBe('Poor')
    expect(getRatingLabel('2.0')).toBe('Very Poor')
  })
})
