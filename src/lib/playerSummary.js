import { calculateMatchRating, getRatingColor } from './rating'
import { sumExpectedGoals } from './xg'
import { ParseFieldPosition } from './matchEvents'

/**
 * Headline season/career stats (rating, goals, xG, W-D-L).
 * @param {Array} matches — match rows (with my_goals/assists/score_* folded in)
 * @param {Array} goals   — goal rows (with field_position) for xG
 * @param {Array} shots   — shot rows (with field_position) for xG
 */
export function buildHeroStats(matches = [], goals = [], shots = []) {
  const count = matches.length
  let ratingSum = 0
  let goalsTotal = 0
  let assistsTotal = 0
  let wins = 0, draws = 0, losses = 0

  for (const m of matches) {
    ratingSum += parseFloat(calculateMatchRating(m))
    goalsTotal += m.my_goals || 0
    assistsTotal += m.assists || 0
    const f = m.score_for ?? 0
    const a = m.score_against ?? 0
    if (f > a) wins++
    else if (f < a) losses++
    else draws++
  }

  const avg = count ? ratingSum / count : 0
  const avgRating = count ? avg.toFixed(2) : '—'

  return {
    matchesCount: count,
    avgRating,
    ratingTier: count ? getRatingColor(avg) : '',
    goals: goalsTotal,
    assists: assistsTotal,
    xg: sumExpectedGoals([...goals, ...shots]),
    wins,
    draws,
    losses,
    winRate: count ? Math.round((wins / count) * 100) : 0
  }
}

/**
 * Merge every mapped action into a flat [{x_pct,y_pct}] list for HeatmapCanvas:
 * tracked heatmap points + shot/goal origins, across many matches.
 */
export function buildSeasonHeatmapPoints(goals = [], shots = [], heatmapRows = []) {
  const out = []
  for (const p of heatmapRows) {
    const x = Number(p.x_pct)
    const y = Number(p.y_pct)
    if (Number.isFinite(x) && Number.isFinite(y)) out.push({ x_pct: x, y_pct: y })
  }
  for (const g of goals) {
    const pos = ParseFieldPosition(g.field_position)
    if (pos) out.push({ x_pct: pos.XPct, y_pct: pos.YPct })
  }
  for (const s of shots) {
    const pos = ParseFieldPosition(s.field_position)
    if (pos) out.push({ x_pct: pos.XPct, y_pct: pos.YPct })
  }
  return out
}

const PASS_TYPES = new Set(['successful_passes', 'unsuccessful_passes'])
// A pass is "progressive" when it moves the ball meaningfully toward goal (top, y=0).
const PROGRESSIVE_DELTA = 12

/**
 * Pass arrows from heatmap rows that recorded a destination (x2_pct/y2_pct).
 * @returns {Array<{x_pct,y_pct,x2_pct,y2_pct,progressive,success}>}
 */
export function buildPassArrows(heatmapRows = []) {
  const out = []
  for (const p of heatmapRows) {
    if (!PASS_TYPES.has(p.event_type)) continue
    const x = Number(p.x_pct), y = Number(p.y_pct)
    const x2 = p.x2_pct == null || p.x2_pct === '' ? NaN : Number(p.x2_pct)
    const y2 = p.y2_pct == null || p.y2_pct === '' ? NaN : Number(p.y2_pct)
    if (![x, y, x2, y2].every(Number.isFinite)) continue
    out.push({
      x_pct: x, y_pct: y, x2_pct: x2, y2_pct: y2,
      progressive: y2 < y - PROGRESSIVE_DELTA,
      success: p.event_type === 'successful_passes'
    })
  }
  return out
}

export function progressivePassCount(heatmapRows = []) {
  return buildPassArrows(heatmapRows).filter((p) => p.progressive).length
}
