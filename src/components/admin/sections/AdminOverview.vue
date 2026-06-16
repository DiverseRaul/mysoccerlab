<template>
  <section class="asec">
    <h2 class="asec__title">Overview</h2>

    <div v-if="statsError" class="asec__notice">
      <strong>Stats unavailable.</strong> Deploy the <code>admin-stats</code> edge function to see live analytics
      (no secret needed — Supabase injects the service-role key automatically). Content editing still works.
    </div>

    <template v-else-if="stats">
      <div class="asec__metrics">
        <div v-for="m in metricCards" :key="m.label" class="asec__metric">
          <span class="asec__metric-value">{{ m.value }}</span>
          <span class="asec__metric-label">{{ m.label }}</span>
        </div>
      </div>

      <div class="asec__cols">
        <div class="asec__card">
          <span class="asec__card-title">New sign-ups · last 14 days</span>
          <div class="asec__bars">
            <div v-for="(d, i) in stats.signupSeries" :key="i" class="asec__bar-wrap" :title="`${d.date}: ${d.count}`">
              <div class="asec__bar" :style="{ height: barHeight(d.count) }"></div>
            </div>
          </div>
        </div>
        <div class="asec__card">
          <span class="asec__card-title">Pro vs Free</span>
          <div class="asec__split">
            <div class="asec__split-bar">
              <span class="asec__split-pro" :style="{ width: proPct + '%' }"></span>
            </div>
            <div class="asec__split-legend">
              <span><span class="asec__dot asec__dot--pro"></span>Pro · {{ stats.totals.proUsers }}</span>
              <span><span class="asec__dot asec__dot--free"></span>Free · {{ freeUsers }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="asec__loading">Loading analytics…</div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const stats = ref(null)
const statsError = ref(false)

const metricCards = computed(() => {
  const t = stats.value?.totals || {}
  return [
    { label: 'Total users', value: t.totalUsers ?? '—' },
    { label: 'New · 7d', value: t.newUsers7 ?? '—' },
    { label: 'New · 30d', value: t.newUsers30 ?? '—' },
    { label: 'Total matches', value: t.totalMatches ?? '—' },
    { label: 'Matches · 7d', value: t.matches7 ?? '—' },
    { label: 'Matches · 30d', value: t.matches30 ?? '—' },
    { label: 'Total goals', value: t.totalGoals ?? '—' },
    { label: 'AI conversations', value: t.aiConversations ?? '—' },
    { label: 'AI messages', value: t.aiMessages ?? '—' },
    { label: 'Pro users', value: t.proUsers ?? '—' },
    { label: 'Waitlist', value: t.waitlist ?? '—' },
    { label: 'Followers links', value: t.relationships ?? '—' }
  ]
})

const freeUsers = computed(() => Math.max(0, (stats.value?.totals?.totalUsers || 0) - (stats.value?.totals?.proUsers || 0)))
const proPct = computed(() => {
  const total = stats.value?.totals?.totalUsers || 0
  return total ? Math.round(((stats.value.totals.proUsers || 0) / total) * 100) : 0
})

const maxSignup = computed(() => Math.max(1, ...(stats.value?.signupSeries || []).map((d) => d.count)))
const barHeight = (count) => `${Math.max(6, (count / maxSignup.value) * 100)}%`

onMounted(async () => {
  if (props.previewMode) { statsError.value = true; return }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token}`
      }
    })
    if (!res.ok) throw new Error('stats failed')
    stats.value = await res.json()
  } catch {
    statsError.value = true
  }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }

.asec__notice {
  padding: var(--space-4);
  background: var(--color-warning-bg);
  border: 1px solid rgba(255, 183, 77, 0.35);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: var(--font-size-sm);
}
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }
.asec__loading { color: var(--color-text-muted); padding: var(--space-5); text-align: center; }

.asec__metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
.asec__metric {
  display: flex; flex-direction: column; gap: 2px;
  padding: var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.asec__metric-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-heavy); color: var(--color-accent); line-height: 1; }
.asec__metric-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

.asec__cols { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }
.asec__card {
  padding: var(--space-5);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.asec__card-title { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.asec__bars { display: flex; align-items: flex-end; gap: 4px; height: 110px; margin-top: var(--space-3); }
.asec__bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.asec__bar { width: 100%; background: linear-gradient(180deg, var(--color-accent), var(--color-brand-fg)); border-radius: 3px 3px 0 0; transition: height 0.3s ease; }

.asec__split { margin-top: var(--space-4); }
.asec__split-bar { height: 12px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.asec__split-pro { display: block; height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-brand-fg)); }
.asec__split-legend { display: flex; gap: var(--space-4); margin-top: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); }
.asec__split-legend span { display: inline-flex; align-items: center; gap: 6px; }
.asec__dot { width: 9px; height: 9px; border-radius: 50%; }
.asec__dot--pro { background: var(--color-accent); }
.asec__dot--free { background: var(--color-text-faint); }

@media (min-width: 560px) {
  .asec__metrics { grid-template-columns: repeat(4, 1fr); }
  .asec__cols { grid-template-columns: 2fr 1fr; }
}
</style>
