import { supabase } from './supabase'

// True when the current URL still carries OAuth callback params that
// supabase-js hasn't finished exchanging for a session yet.
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
  if (!HasOAuthCallbackParams()) return null

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
