// Profile analytics — anonymous view/expand events. We never store who viewed,
// only that a view/expand happened for a target user (privacy by design). Any
// signed-in user may INSERT (RLS); only the owner may read aggregates.

import { supabase } from './supabase'

// Avoid double-counting within a session (e.g. re-opening the same card/profile).
const seen = new Set()

async function logEvent(targetUserId, type, dedupeKey) {
  if (!targetUserId) return
  if (dedupeKey) {
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)
  }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (user.id === targetUserId) return // don't count self-views
    await supabase.from('profile_events').insert({ target_user_id: targetUserId, type })
  } catch { /* analytics are best-effort */ }
}

export const logProfileView = (targetUserId) =>
  logEvent(targetUserId, 'profile_view', `view:${targetUserId}`)

export const logCardExpand = (targetUserId, matchId) =>
  logEvent(targetUserId, 'card_expand', `expand:${matchId}`)

// Owner-only: read aggregate counts for the current user (RLS scopes rows).
export async function getMyAnalytics() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data, error } = await supabase
    .from('profile_events')
    .select('type, created_at')
    .eq('target_user_id', user.id)
  if (error || !data) return { views: 0, expands: 0, views30: 0, expands30: 0 }
  let views = 0, expands = 0, views30 = 0, expands30 = 0
  for (const e of data) {
    const recent = e.created_at >= since
    if (e.type === 'profile_view') { views++; if (recent) views30++ }
    else if (e.type === 'card_expand') { expands++; if (recent) expands30++ }
  }
  return { views, expands, views30, expands30 }
}
