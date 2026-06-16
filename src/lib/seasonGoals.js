// Season goals + pacing. Targets are stored per (user, season) — season key
// 'all' = all-time (avoids NULL-unique issues). `computePacing` is pure/tested.

import { supabase } from './supabase'

export const seasonKey = (seasonId) => (seasonId == null ? 'all' : String(seasonId))

export async function loadGoals(userId, seasonId) {
  const { data } = await supabase
    .from('season_goals')
    .select('goals_target, assists_target, rating_target')
    .eq('user_id', userId)
    .eq('season_id', seasonKey(seasonId))
    .maybeSingle()
  return data || null
}

export async function saveGoals(userId, seasonId, targets) {
  const payload = {
    user_id: userId,
    season_id: seasonKey(seasonId),
    goals_target: targets.goals_target ?? null,
    assists_target: targets.assists_target ?? null,
    rating_target: targets.rating_target ?? null,
    updated_at: new Date().toISOString()
  }
  const { error } = await supabase.from('season_goals').upsert(payload, { onConflict: 'user_id,season_id' })
  if (error) { console.error('saveGoals:', error); return false }
  return true
}

// Fraction (0..1) of the season elapsed by `now`, or null if dates unknown.
export function elapsedFraction(season, now = new Date()) {
  if (!season || !season.start_date || !season.end_date) return null
  const start = new Date(season.start_date).getTime()
  const end = new Date(season.end_date).getTime()
  const t = now.getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return Math.min(1, Math.max(0, (t - start) / (end - start)))
}

// Pure pacing math for one metric.
// Returns { target, actual, pct, expected, state } where state is one of
// 'none' (no target), 'ahead', 'onTrack', 'behind'.
export function computePacing(actual, target, season, now = new Date()) {
  const a = Number(actual) || 0
  const t = Number(target) || 0
  if (t <= 0) return { target: 0, actual: a, pct: 0, expected: null, state: 'none' }

  const pct = Math.min(100, Math.round((a / t) * 100))
  const frac = elapsedFraction(season, now)
  if (frac == null) {
    // No season window — can't pace; just reflect progress.
    return { target: t, actual: a, pct, expected: null, state: a >= t ? 'ahead' : 'onTrack' }
  }
  const expected = t * frac
  let state = 'onTrack'
  if (expected <= 0) state = 'onTrack'
  else if (a >= expected) state = 'ahead'
  else if (a < expected * 0.85) state = 'behind'
  return { target: t, actual: a, pct, expected: Math.round(expected * 10) / 10, state }
}
