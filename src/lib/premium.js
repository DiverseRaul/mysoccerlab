// Lab Pro entitlements — a tiny reactive singleton (no Pinia, matching the
// app's no-store pattern). Any component can `import { isPro } from '../lib/premium'`.
//
// Billing is MOCK for now: activatePro()/cancelPro() flip the tier on the
// user's profile directly (allowed by the own-user UPDATE RLS policy). The
// single seam a real Stripe Checkout flow would replace is activatePro().

import { ref, computed } from 'vue'
import { supabase } from './supabase'
import { isProActive } from './proDuration'

const tier = ref('free')
const accentColor = ref('')
const secondaryColor = ref('')
const admin = ref(false)
const earlyAccess = ref(false)
let loadedFor = null

export const isPro = computed(() => tier.value === 'pro')
export const isAdmin = computed(() => admin.value === true)
export const canSeeBeta = computed(() => isPro.value || earlyAccess.value)
export { tier, accentColor, secondaryColor, earlyAccess }

export const PRO_PRICE = { monthly: '$3.99', yearly: '$39.99', yearlyPerMonth: '$3.33', save: '30%' }

// Apply (or clear) the Pro custom accent colour. The whole green family in
// tokens.css is derived from --color-accent via color-mix, so overriding this
// single token recolours every brand/UI surface app-wide. Pitch grass and the
// rating-tier spectrum are intentionally NOT derived, so they stay green.
export function applyAccent() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const primary = isPro.value ? accentColor.value : ''
  if (primary) {
    root.style.setProperty('--color-accent', primary)
  } else {
    root.style.removeProperty('--color-accent')
  }

  // Clear legacy per-token overrides from earlier versions of this feature so
  // they don't shadow the new color-mix-derived tokens.
  for (const v of ['--color-accent-soft', '--color-accent-border', '--color-success', '--color-brand', '--color-brand-fg']) {
    root.style.removeProperty(v)
  }
}

export async function loadEntitlements(userId) {
  if (!userId) {
    tier.value = 'free'
    accentColor.value = ''
    secondaryColor.value = ''
    admin.value = false
    earlyAccess.value = false
    loadedFor = null
    applyAccent()
    return
  }
  if (loadedFor === userId) return
  // Try the full set; if migration 0021 isn't applied yet (missing columns),
  // fall back to the base columns so Pro/admin still resolve.
  let { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_ends_at, accent_color, secondary_color, is_admin, early_access')
    .eq('user_id', userId)
    .single()
  if (error) {
    ({ data } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_ends_at, accent_color, is_admin')
      .eq('user_id', userId)
      .single())
  }
  // Honour timed grants: an expired subscription_ends_at reads as free.
  tier.value = isProActive(data?.subscription_tier, data?.subscription_ends_at) ? 'pro' : 'free'
  accentColor.value = data?.accent_color || ''
  secondaryColor.value = data?.secondary_color || ''
  admin.value = data?.is_admin === true
  earlyAccess.value = data?.early_access === true
  loadedFor = userId
  applyAccent()
}

export async function activatePro() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_profiles')
    .update({ subscription_tier: 'pro', subscription_started_at: new Date().toISOString() })
    .eq('user_id', user.id)
  if (error) { console.error('activatePro:', error); return false }
  tier.value = 'pro'
  applyAccent()
  return true
}

export async function cancelPro() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_profiles')
    .update({ subscription_tier: 'free', subscription_ends_at: new Date().toISOString() })
    .eq('user_id', user.id)
  if (error) { console.error('cancelPro:', error); return false }
  tier.value = 'free'
  applyAccent()
  return true
}

export async function setAccent(color) {
  accentColor.value = color || ''
  applyAccent()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('user_profiles').update({ accent_color: color || null }).eq('user_id', user.id)
  }
}

// Club colours: primary + secondary in one go.
export async function setColors(primary, secondary) {
  accentColor.value = primary || ''
  secondaryColor.value = secondary || ''
  applyAccent()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('user_profiles')
      .update({ accent_color: primary || null, secondary_color: secondary || null })
      .eq('user_id', user.id)
  }
}

export async function setEarlyAccess(on) {
  earlyAccess.value = !!on
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('user_profiles').update({ early_access: !!on }).eq('user_id', user.id)
  }
}
