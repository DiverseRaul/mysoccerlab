import { describe, it, expect } from 'vitest'
import {
  formatValue,
  computeTrend,
  personalBest,
  accuracyPct,
  sessionScore,
  latestSession,
  metricTypeLabel,
  metricTypeDescription,
  targetLabel
} from '../../src/lib/practiceFormat.js'

const drill = (overrides = {}) => ({
  id: 1,
  name: 'Test drill',
  metric_type: 'count',
  unit: null,
  lower_is_better: false,
  target_value: null,
  ...overrides
})

const session = (overrides = {}) => ({
  id: Math.random(),
  drill_id: 1,
  session_date: '2026-05-01',
  primary_value: 0,
  secondary_value: null,
  ...overrides
})

describe('formatValue', () => {
  it('formats a count with unit', () => {
    expect(formatValue(session({ primary_value: 60 }), drill({ metric_type: 'count', unit: 'juggles' })))
      .toBe('60 juggles')
  })

  it('formats a ratio with accuracy percentage', () => {
    expect(formatValue(
      session({ primary_value: 25, secondary_value: 50 }),
      drill({ metric_type: 'ratio', unit: 'shots' })
    )).toBe('25 / 50 (50%)')
  })

  it('formats a time with two decimals', () => {
    expect(formatValue(session({ primary_value: 6.3 }), drill({ metric_type: 'time' })))
      .toBe('6.30s')
  })

  it('formats a distance with default meters unit', () => {
    expect(formatValue(session({ primary_value: 42.5 }), drill({ metric_type: 'distance' })))
      .toBe('42.5 m')
  })

  it('formats a speed with default km/h unit', () => {
    expect(formatValue(session({ primary_value: 28.7 }), drill({ metric_type: 'speed' })))
      .toBe('28.7 km/h')
  })

  it('returns em-dash for null inputs', () => {
    expect(formatValue(null, drill())).toBe('—')
    expect(formatValue(session(), null)).toBe('—')
  })

  it('handles ratio with zero attempted gracefully', () => {
    expect(formatValue(
      session({ primary_value: 0, secondary_value: 0 }),
      drill({ metric_type: 'ratio' })
    )).toBe('0 / 0')
  })

  it('formats shot_map identically to ratio (goals / shots %)', () => {
    expect(formatValue(
      session({ primary_value: 8, secondary_value: 20 }),
      drill({ metric_type: 'shot_map' })
    )).toBe('8 / 20 (40%)')
  })
})

describe('accuracyPct', () => {
  it('computes 50% for 25/50', () => {
    expect(accuracyPct(session({ primary_value: 25, secondary_value: 50 }))).toBe(50)
  })
  it('returns null when attempted is 0', () => {
    expect(accuracyPct(session({ primary_value: 1, secondary_value: 0 }))).toBeNull()
  })
  it('returns null when values missing', () => {
    expect(accuracyPct(null)).toBeNull()
    expect(accuracyPct(session({ primary_value: 1, secondary_value: null }))).toBeNull()
  })
})

describe('sessionScore', () => {
  it('returns primary value for count drill', () => {
    expect(sessionScore(session({ primary_value: 60 }), drill())).toBe(60)
  })
  it('returns accuracy % for ratio drill', () => {
    expect(sessionScore(
      session({ primary_value: 30, secondary_value: 50 }),
      drill({ metric_type: 'ratio' })
    )).toBe(60)
  })
})

describe('computeTrend', () => {
  it('returns none when fewer than 2 sessions', () => {
    expect(computeTrend([], drill()).direction).toBe('none')
    expect(computeTrend([session({ primary_value: 1 })], drill()).direction).toBe('none')
  })

  it('returns up when later session has higher value (default)', () => {
    const result = computeTrend([
      session({ primary_value: 30, session_date: '2026-05-01' }),
      session({ primary_value: 60, session_date: '2026-07-01' })
    ], drill())
    expect(result.direction).toBe('up')
    expect(result.delta).toBe(30)
  })

  it('returns down when later session has lower value (default)', () => {
    const result = computeTrend([
      session({ primary_value: 60, session_date: '2026-05-01' }),
      session({ primary_value: 40, session_date: '2026-07-01' })
    ], drill())
    expect(result.direction).toBe('down')
  })

  it('flips direction when lower_is_better (sprint time)', () => {
    const sprintDrill = drill({ metric_type: 'time', lower_is_better: true })
    const result = computeTrend([
      session({ primary_value: 7.2, session_date: '2026-05-01' }),
      session({ primary_value: 6.5, session_date: '2026-07-01' })
    ], sprintDrill)
    expect(result.direction).toBe('up')
  })

  it('uses accuracy % for ratio drills', () => {
    const ratioDrill = drill({ metric_type: 'ratio' })
    const result = computeTrend([
      session({ primary_value: 25, secondary_value: 50, session_date: '2026-05-01' }),
      session({ primary_value: 35, secondary_value: 50, session_date: '2026-07-01' })
    ], ratioDrill)
    expect(result.direction).toBe('up')
  })

  it('returns flat when values equal', () => {
    const result = computeTrend([
      session({ primary_value: 50, session_date: '2026-05-01' }),
      session({ primary_value: 50, session_date: '2026-07-01' })
    ], drill())
    expect(result.direction).toBe('flat')
  })

  it('uses date order, not array order', () => {
    const result = computeTrend([
      session({ primary_value: 80, session_date: '2026-07-01' }), // newer first in array
      session({ primary_value: 40, session_date: '2026-05-01' })
    ], drill())
    expect(result.direction).toBe('up')
  })
})

describe('personalBest', () => {
  it('returns null on empty', () => {
    expect(personalBest([], drill())).toBeNull()
  })

  it('returns the highest value for a count drill', () => {
    const best = personalBest([
      session({ id: 'a', primary_value: 20 }),
      session({ id: 'b', primary_value: 80 }),
      session({ id: 'c', primary_value: 50 })
    ], drill())
    expect(best.id).toBe('b')
  })

  it('returns the lowest value when lower_is_better', () => {
    const sprintDrill = drill({ metric_type: 'time', lower_is_better: true })
    const best = personalBest([
      session({ id: 'a', primary_value: 7.5 }),
      session({ id: 'b', primary_value: 6.3 }),
      session({ id: 'c', primary_value: 7.0 })
    ], sprintDrill)
    expect(best.id).toBe('b')
  })

  it('uses accuracy % for ratio drills', () => {
    const ratioDrill = drill({ metric_type: 'ratio' })
    const best = personalBest([
      session({ id: 'a', primary_value: 10, secondary_value: 50 }), // 20%
      session({ id: 'b', primary_value: 25, secondary_value: 50 }), // 50%
      session({ id: 'c', primary_value: 30, secondary_value: 50 })  // 60%
    ], ratioDrill)
    expect(best.id).toBe('c')
  })
})

describe('latestSession', () => {
  it('returns the latest by date regardless of array order', () => {
    const latest = latestSession([
      session({ id: 'old', session_date: '2026-01-01' }),
      session({ id: 'new', session_date: '2026-09-01' }),
      session({ id: 'mid', session_date: '2026-05-01' })
    ])
    expect(latest.id).toBe('new')
  })

  it('returns null on empty', () => {
    expect(latestSession([])).toBeNull()
  })
})

describe('metricTypeLabel', () => {
  it('returns plain-language labels', () => {
    expect(metricTypeLabel('count')).toBe('Count')
    expect(metricTypeLabel('ratio')).toBe('Hits / attempts')
    expect(metricTypeLabel('time')).toBe('Time')
    expect(metricTypeLabel('distance')).toBe('Distance')
    expect(metricTypeLabel('speed')).toBe('Speed')
    expect(metricTypeLabel('shot_map')).toBe('Goal map')
  })
})

describe('metricTypeDescription', () => {
  it('returns a non-empty helper sentence for every supported type', () => {
    for (const t of ['count','ratio','time','distance','speed','shot_map']) {
      expect(metricTypeDescription(t).length).toBeGreaterThan(10)
    }
  })
})

describe('targetLabel', () => {
  it('uses accuracy % wording for ratio and shot_map (the ambiguous cases)', () => {
    expect(targetLabel('ratio')).toMatch(/accuracy/i)
    expect(targetLabel('shot_map')).toMatch(/accuracy/i)
  })

  it('uses type-specific wording for non-ratio types', () => {
    expect(targetLabel('count')).toMatch(/count/i)
    expect(targetLabel('time')).toMatch(/time/i)
    expect(targetLabel('distance')).toMatch(/distance/i)
    expect(targetLabel('speed')).toMatch(/speed/i)
  })
})

describe('shot_map drills (score as ratio)', () => {
  it('sessionScore returns accuracy % for shot_map', () => {
    expect(sessionScore(
      session({ primary_value: 8, secondary_value: 20 }),
      drill({ metric_type: 'shot_map' })
    )).toBe(40)
  })

  it('computeTrend treats shot_map as ratio (improving accuracy = up)', () => {
    const d = drill({ metric_type: 'shot_map' })
    const result = computeTrend([
      session({ primary_value: 5, secondary_value: 25, session_date: '2026-05-01' }), // 20%
      session({ primary_value: 12, secondary_value: 25, session_date: '2026-07-01' }) // 48%
    ], d)
    expect(result.direction).toBe('up')
  })

  it('personalBest uses accuracy for shot_map', () => {
    const d = drill({ metric_type: 'shot_map' })
    const best = personalBest([
      session({ id: 'a', primary_value: 5, secondary_value: 25 }),  // 20%
      session({ id: 'b', primary_value: 15, secondary_value: 25 }), // 60%
      session({ id: 'c', primary_value: 10, secondary_value: 25 })  // 40%
    ], d)
    expect(best.id).toBe('b')
  })
})
