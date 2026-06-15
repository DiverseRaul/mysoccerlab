import { ParseFieldPosition } from './matchEvents'

/**
 * expectedGoal(fieldPosition)
 *
 * A lightweight expected-goals estimate from where a shot was taken.
 * Logger orientation: the attacking goal is at the TOP, so the goal mouth is at
 * (x = 50, y = 0) in 0–100 pitch percentages. Closer + more central = higher xG.
 *
 * @param {string|{XPct:number,YPct:number}|{x_pct:number,y_pct:number}} fieldPosition
 * @returns {number|null} 0.01–0.99, or null if the position can't be parsed.
 */
export function expectedGoal(fieldPosition) {
  const pos = typeof fieldPosition === 'string' ? ParseFieldPosition(fieldPosition) : fieldPosition
  if (!pos) return null
  const x = pos.XPct ?? pos.x_pct
  const y = pos.YPct ?? pos.y_pct
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  const dx = x - 50               // horizontal offset from goal centre
  const dy = Math.max(0, y)       // distance from the attacking goal line
  const dist = Math.hypot(dx, dy)

  // Tighter angles (toward the byline / wide) see less of the goal.
  const angle = Math.atan2(Math.abs(dx), Math.max(dy, 0.0001))
  const angleFactor = Math.cos(Math.min(angle, Math.PI / 2)) ** 1.5

  const xg = Math.exp(-dist / 13) * (0.35 + 0.65 * angleFactor)
  return Math.max(0.01, Math.min(0.99, Math.round(xg * 100) / 100))
}

/**
 * sumExpectedGoals(items) — total xG across goals/shots that carry a field_position.
 * @returns {string} formatted to 2dp, e.g. "1.34"
 */
export function sumExpectedGoals(items = []) {
  const total = items.reduce((sum, item) => {
    const xg = expectedGoal(item.field_position)
    return sum + (xg || 0)
  }, 0)
  return total.toFixed(2)
}
