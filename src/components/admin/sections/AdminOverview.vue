<template>
  <section class="asec">
    <h2 class="asec__title">Overview</h2>

    <div v-if="statsError" class="asec__notice">
      <strong>Stats unavailable.</strong> Deploy the <code>admin-stats</code> edge function to see live analytics
      (no secret needed — Supabase injects the service-role key automatically). Content editing still works.
    </div>

    <div v-else-if="!stats" class="asec__loading">Loading analytics…</div>

    <template v-else>
      <p class="asec__hint">Figures exclude test accounts.</p>

      <template v-for="group in metricGroups" :key="group.title">
        <h3 class="asec__group">{{ group.title }}</h3>
        <div class="asec__metrics">
          <div v-for="m in group.cards" :key="m.label" class="asec__metric" :title="m.hint || ''">
            <span class="asec__metric-value">{{ m.value }}<small v-if="m.suffix">{{ m.suffix }}</small></span>
            <span class="asec__metric-label">{{ m.label }}</span>
          </div>
        </div>
      </template>

      <div class="asec__cols">
        <div class="asec__card">
          <div class="asec__card-head">
            <span class="asec__card-title">New sign-ups · last 14 days</span>
            <span class="asec__card-sum">{{ signupTotal }} total</span>
          </div>
          <div class="asec__bars">
            <div
              v-for="(d, i) in stats.signupSeries"
              :key="i"
              class="asec__bar-wrap"
              @mouseenter="hover = i"
              @mouseleave="hover = null"
            >
              <span class="asec__bar-val" :class="{ 'is-zero': d.count === 0 }">{{ d.count }}</span>
              <div class="asec__bar" :class="{ 'is-active': hover === i }" :style="{ height: barHeight(d.count) }"></div>
              <span class="asec__bar-day">{{ dayLabel(d.date) }}</span>
              <div v-if="hover === i" class="asec__tip">{{ fullDate(d.date) }}: {{ d.count }} sign-up{{ d.count === 1 ? '' : 's' }}</div>
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
              <span><span class="asec__dot asec__dot--pro"></span>Pro · {{ t.proUsers }}</span>
              <span><span class="asec__dot asec__dot--free"></span>Free · {{ t.freeUsers }}</span>
            </div>
            <p class="asec__split-note">{{ t.conversionPct }}% conversion</p>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const stats = ref(null)
const statsError = ref(false)
const hover = ref(null)

// Always show a number (0), never a blank/dash, once stats have loaded.
const n = (v) => (v ?? 0)
const t = computed(() => stats.value?.totals || {})

const metricGroups = computed(() => {
  const x = t.value
  return [
    {
      title: 'People',
      cards: [
        { label: 'Total users', value: n(x.totalUsers) },
        { label: 'New · today', value: n(x.newUsersToday) },
        { label: 'New · 7d', value: n(x.newUsers7) },
        { label: 'New · 30d', value: n(x.newUsers30) },
        { label: 'Pro users', value: n(x.proUsers) },
        { label: 'Conversion', value: n(x.conversionPct), suffix: '%', hint: 'Share of users on Pro' },
        { label: 'Public profiles', value: n(x.publicUsers) },
        { label: 'Admins', value: n(x.adminUsers) }
      ]
    },
    {
      title: 'Match activity',
      cards: [
        { label: 'Total matches', value: n(x.totalMatches) },
        { label: 'Matches · 7d', value: n(x.matches7) },
        { label: 'Matches · 30d', value: n(x.matches30) },
        { label: 'Avg / user', value: n(x.avgMatchesPerUser), hint: 'Average matches logged per user' },
        { label: 'Total goals', value: n(x.totalGoals) },
        { label: 'Total shots', value: n(x.totalShots) }
      ]
    },
    {
      title: 'Training',
      cards: [
        { label: 'Drills', value: n(x.totalDrills) },
        { label: 'Sessions', value: n(x.totalSessions) },
        { label: 'Sessions · 7d', value: n(x.sessions7) }
      ]
    },
    {
      title: 'Engagement',
      cards: [
        { label: 'AI conversations', value: n(x.aiConversations) },
        { label: 'AI messages', value: n(x.aiMessages) },
        { label: 'Follow links', value: n(x.relationships) },
        { label: 'Waitlist', value: n(x.waitlist) }
      ]
    }
  ]
})

const proPct = computed(() => {
  const total = t.value.totalUsers || 0
  return total ? Math.round(((t.value.proUsers || 0) / total) * 100) : 0
})

const signupTotal = computed(() => (stats.value?.signupSeries || []).reduce((s, d) => s + d.count, 0))
const maxSignup = computed(() => Math.max(1, ...(stats.value?.signupSeries || []).map((d) => d.count)))
const barHeight = (count) => `${Math.max(3, (count / maxSignup.value) * 100)}%`
const dayLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' })
const fullDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

onMounted(async () => {
  if (props.previewMode) {
    stats.value = {
      totals: {
        totalUsers: 128, newUsersToday: 3, newUsers7: 14, newUsers30: 47,
        proUsers: 19, freeUsers: 109, conversionPct: 14.8, publicUsers: 73, adminUsers: 2,
        totalMatches: 412, matches7: 28, matches30: 121, avgMatchesPerUser: 3.2,
        totalGoals: 286, totalShots: 904,
        totalDrills: 64, totalSessions: 318, sessions7: 22,
        aiConversations: 56, aiMessages: 612, relationships: 88, waitlist: 12
      },
      signupSeries: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.parse('2026-06-04') + i * 864e5).toISOString().slice(0, 10),
        count: [0, 1, 2, 0, 3, 5, 1, 2, 0, 4, 6, 1, 3, 2][i]
      }))
    }
    return
  }
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
.asec__title { margin: 0 0 var(--space-3); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__hint { margin: 0 0 var(--space-5); color: var(--color-text-faint); font-size: var(--font-size-xs); }

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

.asec__group { margin: var(--space-4) 0 var(--space-3); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-faint); font-weight: var(--font-weight-semibold); }

.asec__metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
.asec__metric {
  display: flex; flex-direction: column; gap: 2px;
  padding: var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.asec__metric-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-heavy); color: var(--color-accent); line-height: 1; }
.asec__metric-value small { font-size: var(--font-size-sm); margin-left: 1px; }
.asec__metric-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

.asec__cols { display: grid; grid-template-columns: 1fr; gap: var(--space-3); margin-top: var(--space-3); }
.asec__card {
  padding: var(--space-5);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.asec__card-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.asec__card-title { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.asec__card-sum { font-size: var(--font-size-xs); color: var(--color-accent); font-weight: var(--font-weight-semibold); font-variant-numeric: tabular-nums; }

.asec__bars { display: flex; align-items: flex-end; gap: 4px; height: 130px; margin-top: var(--space-4); position: relative; }
.asec__bar-wrap { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; cursor: default; }
.asec__bar-val { font-size: 0.6rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; margin-bottom: 3px; }
.asec__bar-val.is-zero { color: var(--color-text-faint); }
.asec__bar { width: 100%; max-width: 22px; background: linear-gradient(180deg, var(--color-accent), var(--color-brand-fg)); border-radius: 3px 3px 0 0; transition: height 0.3s ease, filter 0.15s ease; }
.asec__bar.is-active { filter: brightness(1.25); }
.asec__bar-day { font-size: 0.6rem; color: var(--color-text-faint); margin-top: 4px; text-transform: uppercase; }
.asec__tip {
  position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
  white-space: nowrap; z-index: 5;
  background: var(--color-bg-surface-3); color: var(--color-text-primary);
  border: 1px solid var(--color-border-soft); border-radius: var(--radius-sm);
  padding: 4px 8px; font-size: var(--font-size-xs); box-shadow: var(--shadow-md);
}

.asec__split { margin-top: var(--space-4); }
.asec__split-bar { height: 12px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.asec__split-pro { display: block; height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-brand-fg)); }
.asec__split-legend { display: flex; gap: var(--space-4); margin-top: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); }
.asec__split-legend span { display: inline-flex; align-items: center; gap: 6px; }
.asec__split-note { margin: var(--space-2) 0 0; font-size: var(--font-size-xs); color: var(--color-text-faint); }
.asec__dot { width: 9px; height: 9px; border-radius: 50%; }
.asec__dot--pro { background: var(--color-accent); }
.asec__dot--free { background: var(--color-text-faint); }

@media (min-width: 560px) {
  .asec__metrics { grid-template-columns: repeat(4, 1fr); }
  .asec__cols { grid-template-columns: 2fr 1fr; }
}
</style>
