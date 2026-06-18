// Client wrapper for the `admin` service-role edge function. Every admin screen
// goes through here — never builds its own fetch. Each call sends the caller's
// JWT so the function can verify is_admin before doing anything.
//
// callAdmin throws on transport/HTTP failure. A failure to even reach the
// function (not deployed yet) surfaces as `err.notDeployed === true` so screens
// can show the "deploy the admin function" notice, mirroring AdminOverview.

import { supabase } from './supabase'

async function callAdmin(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  let res
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ action, payload })
    })
  } catch (e) {
    const err = new Error('Admin function unreachable')
    err.notDeployed = true
    throw err
  }
  let body = null
  try { body = await res.json() } catch { /* non-JSON */ }
  if (!res.ok) {
    // 404 = function not deployed; other non-2xx = real error from the function.
    const err = new Error(body?.error || `Admin request failed (${res.status})`)
    if (res.status === 404) err.notDeployed = true
    err.status = res.status
    throw err
  }
  return body?.data
}

// ── Reads ──────────────────────────────────────────────────────────────────
export const listUsers   = (payload) => callAdmin('listUsers', payload)
export const getUser      = (id) => callAdmin('getUser', { id })
export const listMatches  = (payload) => callAdmin('listMatches', payload)
export const getMatch     = (id) => callAdmin('getMatch', { id })
export const listDrills   = (payload) => callAdmin('listDrills', payload)
export const listPractice = (payload) => callAdmin('listPractice', payload)
export const getWaitlist   = () => callAdmin('getWaitlist')
export const getAuditLog   = (payload) => callAdmin('getAuditLog', payload)

// ── Mutations ────────────────────────────────────────────────────────────────
export const updateProfile    = (id, patch) => callAdmin('updateProfile', { id, patch })
export const updateMatchStats = (id, patch) => callAdmin('updateMatchStats', { id, patch })
export const deleteMatch      = (id) => callAdmin('deleteMatch', { id, confirm: true })
export const deleteWaitlist    = (id) => callAdmin('deleteWaitlist', { id })
export const deleteSession     = (id) => callAdmin('deleteSession', { id })
export const deleteDrill       = (id) => callAdmin('deleteDrill', { id, confirm: true })
export const updateGoal        = (id, patch) => callAdmin('updateGoal', { id, patch })
export const deleteGoal        = (id) => callAdmin('deleteGoal', { id })
export const updateShot        = (id, patch) => callAdmin('updateShot', { id, patch })
export const deleteShot        = (id) => callAdmin('deleteShot', { id })
export const setTier          = (id, tier, duration, customEndsAt) => callAdmin('setTier', { id, tier, duration, customEndsAt })
export const banUser          = (id, duration) => callAdmin('banUser', { id, duration })
export const unbanUser        = (id) => callAdmin('unbanUser', { id })
export const toggleAdmin      = (id, value) => callAdmin('toggleAdmin', { id, value })

export { callAdmin }
