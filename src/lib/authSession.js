import { supabase } from './supabase'

// True when the current URL still carries OAuth callback params that
// supabase-js hasn't finished exchanging for a session yet.
// True when supabase-js has a persisted session in storage (key like
// `sb-<ref>-auth-token`). If it's there but getSession() returned null, that's
// a rehydration race worth waiting on; if it's absent, the user is genuinely
// signed out and we should bounce immediately (no artificial delay).
const HasStoredSession = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('sb-') && k.includes('auth-token')) return true
    }
  } catch { /* storage unavailable */ }
  return false
}

const HasOAuthCallbackParams = () => {
  if (typeof window === 'undefined') return false
  const Hash = window.location.hash || ''
  const Search = window.location.search || ''
  return (
    Hash.includes('access_token=') ||
    Hash.includes('error_description=') ||
    Search.includes('code=')
  )
}

/**
 * ResolveSession(TimeoutMs?)
 *
 * Returns the current Supabase session, or null when signed out.
 *
 * Unlike a bare getSession()/getUser() call, this waits out the OAuth
 * redirect race: when Google sends the user back to /dashboard the tokens
 * are still in the URL while the page mounts, and an immediate auth check
 * returns null — bouncing a freshly signed-in user to /login. If callback
 * params are present, we wait for onAuthStateChange to deliver the session.
 */
export async function ResolveSession(TimeoutMs = 5000) {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session

  // Cold-start race: on a fresh navigation supabase-js may not have rehydrated
  // the session from storage yet, so the first getSession() returns null even
  // though the user is signed in. Briefly retry before concluding "logged out"
  // — this is what caused pages to render empty / bounce until a refresh.
  if (!HasOAuthCallbackParams()) {
    // No stored session → genuinely signed out; redirect immediately.
    if (!HasStoredSession()) return null
    // Stored session but getSession() came back null → rehydration race; retry.
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 120))
      const { data } = await supabase.auth.getSession()
      if (data.session) return data.session
    }
    return null
  }

  return new Promise((Resolve) => {
    let Subscription = null
    let Timer = null

    const Finish = (Result) => {
      if (Timer) clearTimeout(Timer)
      if (Subscription) Subscription.unsubscribe()
      Resolve(Result)
    }

    Timer = setTimeout(() => Finish(null), TimeoutMs)

    const { data } = supabase.auth.onAuthStateChange((_Event, NewSession) => {
      if (NewSession) Finish(NewSession)
    })
    Subscription = data.subscription
  })
}
