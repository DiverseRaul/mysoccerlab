// Pure helpers for formatting and comparing practice sessions.
// Kept side-effect-free so they can be unit-tested with Vitest.

export const METRIC_TYPES = ['count', 'ratio', 'time', 'distance', 'speed', 'shot_map']

export function metricTypeLabel(type) {
  switch (type) {
    case 'count':    return 'Count'
    case 'ratio':    return 'Hits / attempts'
    case 'time':     return 'Time'
    case 'distance': return 'Distance'
    case 'speed':    return 'Speed'
    case 'shot_map': return 'Goal map'
    default:         return type || ''
  }
}

// One-line description shown as helper text in the drill form so users
// don't have to guess what each type means.
export function metricTypeDescription(type) {
  switch (type) {
    case 'count':    return 'A single number per session (juggles, reps, push-ups).'
    case 'ratio':    return 'Two numbers — hits out of total attempts (e.g. 25 / 50 passes).'
    case 'time':     return 'A time in seconds. Tick “lower is better” for sprints.'
    case 'distance': return 'A distance per session (long pass range, kick distance).'
    case 'speed':    return 'A top speed per session (km/h or mph — use the unit field).'
    case 'shot_map': return 'Shots with optional positions on the goal — heatmap of where they went.'
    default:         return ''
  }
}

// Label for the optional target field, which depends on what kind of
// score it’s compared against (accuracy %, time, count, etc.).
export function targetLabel(type) {
  switch (type) {
    case 'count':    return 'Target count (optional)'
    case 'ratio':
    case 'shot_map': return 'Target accuracy % (optional)'
    case 'time':     return 'Target time (optional)'
    case 'distance': return 'Target distance (optional)'
    case 'speed':    return 'Target speed (optional)'
    default:         return 'Target (optional)'
  }
}

// Shot-map drills behave like ratios for scoring/formatting purposes —
// primary_value = goals scored, secondary_value = total shots attempted.
const isRatioLike = (type) => type === 'ratio' || type === 'shot_map'

function fmtNum(n, decimals = 0) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  const num = Number(n)
  return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString()
}

export function accuracyPct(session) {
  if (!session) return null
  const p = Number(session.primary_value)
  const s = Number(session.secondary_value)
  if (!Number.isFinite(p) || !Number.isFinite(s) || s <= 0) return null
  return Math.round((p / s) * 1000) / 10
}

export function formatValue(session, drill) {
  if (!session || !drill) return '—'
  const unit = drill.unit ? ` ${drill.unit}` : ''
  if (isRatioLike(drill.metric_type)) {
    const pct = accuracyPct(session)
    const base = `${fmtNum(session.primary_value)} / ${fmtNum(session.secondary_value)}`
    return pct === null ? base : `${base} (${pct}%)`
  }
  switch (drill.metric_type) {
    case 'count':
      return `${fmtNum(session.primary_value)}${unit}`
    case 'time':
      return `${fmtNum(session.primary_value, 2)}${drill.unit ? ` ${drill.unit}` : 's'}`
    case 'distance':
      return `${fmtNum(session.primary_value, 1)}${drill.unit ? ` ${drill.unit}` : ' m'}`
    case 'speed':
      return `${fmtNum(session.primary_value, 1)}${drill.unit ? ` ${drill.unit}` : ' km/h'}`
    default:
      return `${fmtNum(session.primary_value)}${unit}`
  }
}

// Numeric score used for comparing sessions of the same drill.
// For ratio drills, accuracy % is the meaningful comparator.
export function sessionScore(session, drill) {
  if (!session) return null
  if (isRatioLike(drill?.metric_type)) return accuracyPct(session)
  const v = Number(session.primary_value)
  return Number.isFinite(v) ? v : null
}

// Sort sessions ascending by date (oldest → newest).
export function sortByDateAsc(sessions) {
  return [...(sessions || [])].sort(
    (a, b) => new Date(a.session_date) - new Date(b.session_date)
  )
}

// Trend = score of latest session vs the one before it.
// Returns { direction: 'up' | 'down' | 'flat' | 'none', delta: number | null }.
// Direction respects drill.lower_is_better (a lower sprint time is an 'up' trend).
export function computeTrend(sessions, drill) {
  const sorted = sortByDateAsc(sessions)
  if (sorted.length < 2) return { direction: 'none', delta: null }
  const latest = sessionScore(sorted[sorted.length - 1], drill)
  const prev   = sessionScore(sorted[sorted.length - 2], drill)
  if (latest === null || prev === null) return { direction: 'none', delta: null }
  const rawDelta = latest - prev
  if (rawDelta === 0) return { direction: 'flat', delta: 0 }
  const improved = drill?.lower_is_better ? rawDelta < 0 : rawDelta > 0
  return { direction: improved ? 'up' : 'down', delta: rawDelta }
}

// Personal best across all provided sessions for the drill.
export function personalBest(sessions, drill) {
  if (!sessions || sessions.length === 0) return null
  const lowerBetter = !!drill?.lower_is_better
  let best = null
  for (const s of sessions) {
    const score = sessionScore(s, drill)
    if (score === null) continue
    if (best === null) { best = s; continue }
    const bestScore = sessionScore(best, drill)
    if (lowerBetter ? score < bestScore : score > bestScore) best = s
  }
  return best
}

export function latestSession(sessions) {
  return sortByDateAsc(sessions).slice(-1)[0] || null
}
