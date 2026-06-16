// Coach/Scout share link — an unguessable, revocable token stored on the
// user's own profile (own-user RLS covers these writes). The public read-only
// dashboard is served by the `shared-dashboard` edge function, which only
// returns data when share_enabled is true — so disabling revokes access
// instantly without changing the token, and regenerating rotates it.

import { supabase } from './supabase'

// ~192 bits of entropy, URL-safe.
function randomToken(bytesLen = 24) {
  const bytes = new Uint8Array(bytesLen)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function getShareState() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { token: null, enabled: false }
  const { data } = await supabase
    .from('user_profiles')
    .select('share_token, share_enabled')
    .eq('user_id', user.id)
    .single()
  return { token: data?.share_token || null, enabled: !!data?.share_enabled }
}

// Turn sharing on, minting a token if the user doesn't have one yet.
export async function enableShare() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_profiles')
    .select('share_token')
    .eq('user_id', user.id)
    .single()
  const token = data?.share_token || randomToken()
  await supabase.from('user_profiles').update({ share_token: token, share_enabled: true }).eq('user_id', user.id)
  return token
}

// Rotate the token (old links stop working immediately).
export async function regenerateShare() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const token = randomToken()
  await supabase.from('user_profiles').update({ share_token: token, share_enabled: true }).eq('user_id', user.id)
  return token
}

// Revoke access without discarding the token.
export async function disableShare() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_profiles').update({ share_enabled: false }).eq('user_id', user.id)
}

export function shareUrl(token) {
  if (!token) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/share/${token}`
}
