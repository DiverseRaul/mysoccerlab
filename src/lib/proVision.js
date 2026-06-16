// Pro Vision media metering — soft monthly cap on AI media uploads.
// Client-side counter (spoofable, fine for beta); a server check can move into
// the ai-coach edge function later.

import { supabase } from './supabase'

export const MONTHLY_LIMIT = 15

export const currentPeriod = () => new Date().toISOString().slice(0, 7) // 'YYYY-MM'

export async function getUsage(userId) {
  if (!userId) return 0
  const { data } = await supabase
    .from('pro_media_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('period', currentPeriod())
    .maybeSingle()
  return data?.count || 0
}

export async function incrementUsage(userId) {
  if (!userId) return 0
  const period = currentPeriod()
  const current = await getUsage(userId)
  const next = current + 1
  const { error } = await supabase
    .from('pro_media_usage')
    .upsert({ user_id: userId, period, count: next }, { onConflict: 'user_id,period' })
  if (error) console.error('incrementUsage:', error)
  return next
}
