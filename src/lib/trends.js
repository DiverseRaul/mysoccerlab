// Micro-trend & slump detection (pure). Compares a recent window of matches
// against the prior baseline and surfaces notable behavioural shifts as plain
// alerts. Deliberately conservative — needs enough matches and a real delta.

import { calculateMatchRating } from './rating'

const RECENT = 3            // most recent N matches
const MIN_MATCHES = 6       // need at least this many to say anything

const passAcc = (m) => {
  const ok = m.successful_passes || 0
  const bad = m.unsuccessful_passes || 0
  const total = ok + bad
  return total ? (ok / total) * 100 : null
}
const shots = (m) => (m.shots_on_target || 0) + (m.shots_off_target || 0)
const rating = (m) => parseFloat(calculateMatchRating(m)) || 0

const avg = (arr, fn) => {
  const vals = arr.map(fn).filter((v) => v !== null && Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const round = (n) => Math.round(n)
const round1 = (n) => Math.round(n * 10) / 10

// matches: array of loaded match objects (any order; we sort by match_date asc).
// Returns up to `limit` alerts: { key, dir: 'up'|'down', severity: 'good'|'bad'|'info', text }.
export function detectTrends(matches, limit = 3) {
  const list = [...(matches || [])]
    .filter((m) => m && m.match_date)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
  if (list.length < MIN_MATCHES) return []

  const recent = list.slice(-RECENT)
  const baseline = list.slice(0, -RECENT)

  const alerts = []

  // Rating (form / slump)
  const rNow = avg(recent, rating)
  const rBase = avg(baseline, rating)
  if (rNow != null && rBase != null && Math.abs(rNow - rBase) >= 0.6) {
    const up = rNow > rBase
    alerts.push({
      key: 'rating', dir: up ? 'up' : 'down', severity: up ? 'good' : 'bad',
      text: `Your average rating is ${up ? 'up' : 'down'} to ${round1(rNow)} over your last ${RECENT} games (was ${round1(rBase)}). ${up ? 'You’re on a hot streak.' : 'A dip — worth a reset.'}`
    })
  }

  // Pass accuracy
  const pNow = avg(recent, passAcc)
  const pBase = avg(baseline, passAcc)
  if (pNow != null && pBase != null && Math.abs(pNow - pBase) >= 8) {
    const up = pNow > pBase
    alerts.push({
      key: 'pass', dir: up ? 'up' : 'down', severity: up ? 'good' : 'bad',
      text: `Pass accuracy ${up ? 'climbed' : 'dropped'} ${round(Math.abs(pNow - pBase))}% (now ${round(pNow)}%) over your last ${RECENT} games.`
    })
  }

  // Shot volume
  const sNow = avg(recent, shots)
  const sBase = avg(baseline, shots)
  if (sNow != null && sBase != null && sBase >= 1 && Math.abs(sNow - sBase) / sBase >= 0.5) {
    const up = sNow > sBase
    alerts.push({
      key: 'shots', dir: up ? 'up' : 'down', severity: 'info',
      text: `You’re ${up ? 'shooting a lot more' : 'shooting less'} lately — ${round1(sNow)} shots/game vs ${round1(sBase)} before.${pNow != null && pBase != null && pNow < pBase && up ? ' With passing down, you may be forcing it.' : ''}`
    })
  }

  // Goals
  const gNow = avg(recent, (m) => m.my_goals || 0)
  const gBase = avg(baseline, (m) => m.my_goals || 0)
  if (gNow != null && gBase != null && Math.abs(gNow - gBase) >= 0.6) {
    const up = gNow > gBase
    alerts.push({
      key: 'goals', dir: up ? 'up' : 'down', severity: up ? 'good' : 'bad',
      text: `Goals per game ${up ? 'up' : 'down'} to ${round1(gNow)} recently (was ${round1(gBase)}).`
    })
  }

  // Most significant first-ish: bad news before info, but keep order stable enough.
  alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
  return alerts.slice(0, limit)
}

function severityRank(s) {
  return s === 'bad' ? 0 : s === 'good' ? 1 : 2
}
