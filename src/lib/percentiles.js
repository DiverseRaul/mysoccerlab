// Percentile helpers for peer comparison — pure, shared by the client and the
// peer-percentiles edge function (inline-copied there since Deno can't import).

// Percentile rank of `value` within `values` (0–100), cumulative "<=" so the
// best value reports ~100 and the worst ~ (1/n)*100. Returns null if no data.
export function percentileRank(values, value) {
  const arr = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (!arr.length || !Number.isFinite(value)) return null
  const countLE = arr.filter((v) => v <= value).length
  return Math.round((countLE / arr.length) * 100)
}

// Aggregate a player's raw match rows into the comparable per-match metrics.
// `matchRows` = [{ successful_passes, unsuccessful_passes, assists, tackles,
//   interceptions, clearances }], `goals` = total goals scored.
export function playerMetrics(matchRows, goals = 0) {
  const rows = matchRows || []
  const games = rows.length
  if (!games) return null
  const sum = (k) => rows.reduce((s, m) => s + (Number(m[k]) || 0), 0)
  const passOk = sum('successful_passes')
  const passBad = sum('unsuccessful_passes')
  const passTotal = passOk + passBad
  return {
    passAccuracy: passTotal ? (passOk / passTotal) * 100 : 0,
    goalsPerMatch: goals / games,
    assistsPerMatch: sum('assists') / games,
    defActionsPerMatch: (sum('tackles') + sum('interceptions') + sum('clearances')) / games
  }
}

export const PERCENTILE_METRICS = [
  { key: 'passAccuracy', label: 'Pass accuracy', unit: '%', digits: 1 },
  { key: 'goalsPerMatch', label: 'Goals / match', unit: '', digits: 2 },
  { key: 'assistsPerMatch', label: 'Assists / match', unit: '', digits: 2 },
  { key: 'defActionsPerMatch', label: 'Defensive actions / match', unit: '', digits: 1 }
]
