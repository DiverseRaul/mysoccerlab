// Export / import a player's own data as a portable JSON file.
// Export pulls every own-user row; import re-inserts them under the current
// account, remapping primary keys so foreign keys (season_id, match_id,
// drill_id, session_id) stay consistent.

import { supabase } from './supabase'

// Order matters for export readability; import order is handled explicitly.
const EXPORT_TABLES = [
  'seasons', 'matches', 'goals', 'shots', 'goalkeeper_match_stats',
  'match_heatmap_points', 'practice_drills', 'practice_sessions', 'practice_shot_placements'
]

export async function exportUserData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You need to be signed in to export.')
  const payload = { app: 'mysoccerlab', version: 1, exportedAt: new Date().toISOString(), tables: {} }
  for (const t of EXPORT_TABLES) {
    const { data, error } = await supabase.from(t).select('*').eq('user_id', user.id)
    payload.tables[t] = error ? [] : (data || [])
  }
  return payload
}

export function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)) }
      catch { reject(new Error('That file isn’t valid JSON.')) }
    }
    reader.onerror = () => reject(new Error('Couldn’t read that file.'))
    reader.readAsText(file)
  })
}

export function summarize(payload) {
  const t = payload?.tables || {}
  return {
    seasons: (t.seasons || []).length,
    matches: (t.matches || []).length,
    goals: (t.goals || []).length,
    shots: (t.shots || []).length,
    practiceDrills: (t.practice_drills || []).length,
    practiceSessions: (t.practice_sessions || []).length
  }
}

export function isValidExport(payload) {
  return !!payload && payload.app === 'mysoccerlab' && payload.tables && typeof payload.tables === 'object'
}

// Strip server-managed columns; caller sets user_id + remapped FKs.
function clean(row, drop = []) {
  const out = { ...row }
  delete out.id
  delete out.user_id
  delete out.created_at
  delete out.updated_at
  for (const k of drop) delete out[k]
  return out
}

// Insert rows that need their new PK captured (one-by-one to build the id map).
async function insertMapped(table, rows, build, map) {
  for (const r of rows) {
    const payload = build(r)
    if (!payload) continue
    const { data, error } = await supabase.from(table).insert(payload).select('id').single()
    if (!error && data) map[r.id] = data.id
  }
}

// Insert child rows in bulk (no PK capture needed).
async function insertChildren(table, rows) {
  if (rows.length) await supabase.from(table).insert(rows)
}

// Returns a summary of what was imported. `onStep(label)` for progress UI.
export async function importUserData(payload, onStep = () => {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You need to be signed in to import.')
  if (!isValidExport(payload)) throw new Error('That isn’t a My Soccer Lab export file.')
  const T = payload.tables
  const uid = user.id
  const seasonMap = {}, matchMap = {}, drillMap = {}, sessionMap = {}

  onStep('Seasons')
  await insertMapped('seasons', T.seasons || [], (s) => ({ ...clean(s), user_id: uid }), seasonMap)

  onStep('Matches')
  await insertMapped('matches', T.matches || [], (m) => {
    const row = { ...clean(m), user_id: uid }
    if (m.season_id != null) row.season_id = seasonMap[m.season_id] ?? null
    return row
  }, matchMap)

  onStep('Match events')
  for (const tbl of ['goals', 'shots', 'goalkeeper_match_stats', 'match_heatmap_points']) {
    const rows = (T[tbl] || [])
      .map((r) => { const mid = matchMap[r.match_id]; return mid ? { ...clean(r), user_id: uid, match_id: mid } : null })
      .filter(Boolean)
    await insertChildren(tbl, rows)
  }

  onStep('Practice')
  await insertMapped('practice_drills', T.practice_drills || [], (d) => ({ ...clean(d), user_id: uid }), drillMap)
  await insertMapped('practice_sessions', T.practice_sessions || [], (s) => {
    const did = drillMap[s.drill_id]
    return did ? { ...clean(s), user_id: uid, drill_id: did } : null
  }, sessionMap)
  const placements = (T.practice_shot_placements || [])
    .map((p) => {
      const sid = sessionMap[p.session_id], did = drillMap[p.drill_id]
      return sid ? { ...clean(p), user_id: uid, session_id: sid, drill_id: did ?? null } : null
    })
    .filter(Boolean)
  await insertChildren('practice_shot_placements', placements)

  return {
    matches: Object.keys(matchMap).length,
    seasons: Object.keys(seasonMap).length,
    drills: Object.keys(drillMap).length,
    sessions: Object.keys(sessionMap).length
  }
}
