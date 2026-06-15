import { describe, it, expect } from 'vitest'
import { buildHeroStats, buildSeasonHeatmapPoints, buildPassArrows, progressivePassCount } from '@/lib/playerSummary'

describe('buildHeroStats', () => {
  const matches = [
    { position_played: 'Striker', score_for: 3, score_against: 1, my_goals: 2, assists: 1 },
    { position_played: 'Striker', score_for: 0, score_against: 2, my_goals: 0, assists: 0 },
    { position_played: 'Striker', score_for: 1, score_against: 1, my_goals: 1, assists: 0 }
  ]

  it('aggregates matches, goals, assists and W-D-L', () => {
    const s = buildHeroStats(matches, [], [])
    expect(s.matchesCount).toBe(3)
    expect(s.goals).toBe(3)
    expect(s.assists).toBe(1)
    expect(s).toMatchObject({ wins: 1, draws: 1, losses: 1, winRate: 33 })
  })

  it('produces a formatted avg rating + tier class', () => {
    const s = buildHeroStats(matches, [], [])
    expect(s.avgRating).toMatch(/^\d+\.\d{2}$/)
    expect(s.ratingTier).toMatch(/^rating-/)
  })

  it('sums xG from goals + shots with field positions', () => {
    const s = buildHeroStats(matches, [{ field_position: '50,5' }], [{ field_position: '50,20' }])
    expect(parseFloat(s.xg)).toBeGreaterThan(0)
  })

  it('handles an empty player gracefully', () => {
    const s = buildHeroStats([], [], [])
    expect(s.matchesCount).toBe(0)
    expect(s.avgRating).toBe('—')
    expect(s.ratingTier).toBe('')
  })
})

describe('buildSeasonHeatmapPoints', () => {
  it('merges heatmap points with shot/goal origins and skips unparseable', () => {
    const points = buildSeasonHeatmapPoints(
      [{ field_position: '40,30' }, { field_position: null }],
      [{ field_position: '55,60' }],
      [{ x_pct: 10, y_pct: 90 }, { x_pct: 'nan', y_pct: 5 }]
    )
    expect(points).toHaveLength(3)
    expect(points).toContainEqual({ x_pct: 40, y_pct: 30 })
    expect(points).toContainEqual({ x_pct: 10, y_pct: 90 })
  })
})

describe('buildPassArrows / progressivePassCount', () => {
  const rows = [
    { event_type: 'successful_passes', x_pct: 30, y_pct: 80, x2_pct: 50, y2_pct: 40 }, // progressive
    { event_type: 'successful_passes', x_pct: 50, y_pct: 50, x2_pct: 55, y2_pct: 52 }, // sideways/back
    { event_type: 'unsuccessful_passes', x_pct: 20, y_pct: 70, x2_pct: 25, y2_pct: 30 }, // progressive (bad)
    { event_type: 'tackles', x_pct: 40, y_pct: 60, x2_pct: null, y2_pct: null }, // not a pass
    { event_type: 'successful_passes', x_pct: 40, y_pct: 60, x2_pct: null, y2_pct: null } // no destination
  ]

  it('only builds arrows for directional passes', () => {
    const arrows = buildPassArrows(rows)
    expect(arrows).toHaveLength(3)
    expect(arrows.every((a) => Number.isFinite(a.x2_pct))).toBe(true)
  })

  it('flags progressive passes (toward goal beyond the threshold)', () => {
    expect(progressivePassCount(rows)).toBe(2)
  })
})
