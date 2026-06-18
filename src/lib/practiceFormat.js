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

// ── Cross-drill aggregates (Training Overview) ──────────────────────────────
// All side-effect-free. Dates are the DATE strings ('YYYY-MM-DD') stored on
// sessions; `today` is injectable so the streak logic is deterministic to test.

// Normalise either a 'YYYY-MM-DD' string or a Date to a local-day key, avoiding
// the UTC-parse shift that `new Date('YYYY-MM-DD')` introduces.
function toDayKey(value) {
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Current streak = consecutive calendar days (ending today or yesterday) that
// have at least one logged session. Returns 0 if the last session is older than
// yesterday (the streak has lapsed). `today` defaults to now but is injectable.
export function practiceStreak(sessions, today = new Date()) {
  if (!sessions || sessions.length === 0) return 0
  const days = new Set(sessions.map(s => toDayKey(s.session_date)).filter(Boolean))
  if (days.size === 0) return 0

  let cursor
  if (days.has(toDayKey(today))) cursor = new Date(today)
  else if (days.has(toDayKey(addDays(today, -1)))) cursor = addDays(today, -1)
  else return 0

  let streak = 0
  while (days.has(toDayKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

// Monday-based week key for a date string/Date (local), e.g. '2026-06-15'.
function weekStartKey(value) {
  const d = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // back to Monday
  return toDayKey(d)
}

// Current streak of consecutive CALENDAR WEEKS (Mon–Sun) with at least one
// session, ending this week or last week. Weekly (not daily) because most people
// don't train every single day — a week with any session keeps the streak alive.
export function practiceWeekStreak(sessions, today = new Date()) {
  if (!sessions || sessions.length === 0) return 0
  const weeks = new Set(sessions.map(s => weekStartKey(s.session_date)).filter(Boolean))
  if (weeks.size === 0) return 0

  const thisMonday = new Date(today)
  thisMonday.setHours(0, 0, 0, 0)
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7))

  let cursor
  if (weeks.has(weekStartKey(thisMonday))) cursor = thisMonday
  else if (weeks.has(weekStartKey(addDays(thisMonday, -7)))) cursor = addDays(thisMonday, -7)
  else return 0

  let streak = 0
  while (weeks.has(weekStartKey(cursor))) {
    streak++
    cursor = addDays(cursor, -7)
  }
  return streak
}

// Headline counters for the Training Overview. `pbDrills` counts drills whose
// most recent session is also their personal best (i.e. currently peaking) —
// needs ≥2 sessions to be meaningful.
export function practiceTotals(drills, sessions) {
  const list = drills || []
  const byDrill = {}
  for (const s of sessions || []) {
    if (!byDrill[s.drill_id]) byDrill[s.drill_id] = []
    byDrill[s.drill_id].push(s)
  }
  let pbDrills = 0
  for (const drill of list) {
    const ds = byDrill[drill.id] || []
    if (ds.length < 2) continue
    const pb = personalBest(ds, drill)
    const latest = latestSession(ds)
    if (pb && latest && pb.id === latest.id) pbDrills++
  }
  return {
    activeDrills: list.length,
    totalSessions: (sessions || []).length,
    pbDrills,
  }
}

// Compact, already-formatted practice summary for the AI Coach. Sent to the
// edge function so it can build a PRACTICE LOG without re-deriving anything.
// One entry per drill: latest value, personal best, trend, accuracy, volume.
export function practiceCoachSummary(drills, sessions) {
  const byDrill = {}
  for (const s of sessions || []) {
    if (!byDrill[s.drill_id]) byDrill[s.drill_id] = []
    byDrill[s.drill_id].push(s)
  }
  return (drills || []).map(drill => {
    const ds = byDrill[drill.id] || []
    const latest = latestSession(ds)
    const best = personalBest(ds, drill)
    const trend = computeTrend(ds, drill)
    return {
      name: drill.name,
      metricType: drill.metric_type,
      unit: drill.unit || null,
      target: drill.target_value ?? null,
      lowerIsBetter: !!drill.lower_is_better,
      sessions: ds.length,
      latest: latest ? formatValue(latest, drill) : null,
      latestDate: latest?.session_date || null,
      best: best ? formatValue(best, drill) : null,
      accuracy: latest ? accuracyPct(latest) : null,
      trend: trend.direction,
    }
  })
}

// The n most recent sessions across all drills, newest first. Ties on the same
// date fall back to insertion id (later-created first) so order is stable.
export function recentSessions(sessions, n = 5) {
  return [...(sessions || [])]
    .sort((a, b) =>
      new Date(b.session_date) - new Date(a.session_date) || (b.id || 0) - (a.id || 0)
    )
    .slice(0, n)
}
