// Pro-grant duration helpers — pure, shared by the client and the admin edge
// function. Kept dependency-free so the Deno function can inline-copy the logic
// if needed and so the math is unit-testable with a fixed `now`.

const DAY = 86400000

// Pro grant duration tokens the admin UI offers.
export const PRO_DURATIONS = [
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '1y', label: '1 year' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'custom', label: 'Custom date' }
]

// Ban duration tokens (separate set — bans are usually shorter).
export const BAN_DURATIONS = [
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: 'permanent', label: 'Permanent' }
]

// Map a Pro-duration token to an ISO end timestamp (or null = permanent).
export function durationToEndsAt(duration, now = new Date(), customEndsAt = null) {
  const base = now instanceof Date ? now : new Date(now)
  if (!duration || duration === 'permanent') return null
  if (duration === 'custom') return customEndsAt ? new Date(customEndsAt).toISOString() : null
  const d = new Date(base.getTime())
  switch (duration) {
    case '1w': return new Date(base.getTime() + 7 * DAY).toISOString()
    case '1m': d.setMonth(d.getMonth() + 1); return d.toISOString()
    case '3m': d.setMonth(d.getMonth() + 3); return d.toISOString()
    case '1y': d.setFullYear(d.getFullYear() + 1); return d.toISOString()
    default: return null
  }
}

// Whether a tier+expiry combination currently grants Pro. A null/empty endsAt
// means a permanent grant; a past endsAt means the grant has lapsed → free.
export function isProActive(tier, endsAt, now = new Date()) {
  if (tier !== 'pro') return false
  if (!endsAt) return true
  const end = new Date(endsAt).getTime()
  if (Number.isNaN(end)) return true
  const t = (now instanceof Date ? now : new Date(now)).getTime()
  return end > t
}

// Map a ban-duration token to a Go duration string for Supabase Auth's
// `ban_duration`. 'none' lifts the ban; permanent → ~100 years.
export function banDurationToGoString(duration) {
  switch (duration) {
    case 'none': return 'none'
    case '1d': return '24h'
    case '1w': return '168h'
    case '1m': return '720h'
    case 'permanent':
    case null:
    case undefined: return '876000h'
    default: return '876000h'
  }
}
