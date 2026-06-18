<template>
  <BentoItem :delay="950" extra-class="practice-recent-tile">
    <div class="tile-header">
      <h4>Recent Practice</h4>
      <span v-if="latest" class="when">{{ formatDate(latest.session_date) }}</span>
    </div>

    <div v-if="loading" class="tile-body tile-body--muted">Loading…</div>

    <div v-else-if="!latest" class="tile-body tile-body--cta">
      <p>Track drills like juggles, shots outside the box, sprints…</p>
      <a class="cta-link" href="#" @click.prevent="goPractice">Start tracking →</a>
    </div>

    <div v-else class="tile-body">
      <div class="drill-name">{{ latestDrill?.name || 'Practice session' }}</div>
      <div class="value-row">
        <span class="value">{{ formatValue(latest, latestDrill) }}</span>
        <span
          v-if="trend.direction !== 'none'"
          class="trend"
          :class="`trend--${trend.direction}`"
        >{{ trendIcon }}</span>
      </div>
      <div v-if="pb" class="pb-line">PB {{ formatValue(pb, latestDrill) }}</div>
      <a class="cta-link cta-link--footer" href="#" @click.prevent="goPractice">Open practice →</a>
    </div>
  </BentoItem>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BentoItem from './BentoItem.vue'
import { supabase } from '../../../lib/supabase'
import {
  formatValue,
  computeTrend,
  personalBest,
  latestSession
} from '../../../lib/practiceFormat'

const emit = defineEmits(['go-to-drills'])

const drills = ref([])
const sessions = ref([])
const loading = ref(true)

const latest = computed(() => latestSession(sessions.value))
const latestDrill = computed(() => {
  if (!latest.value) return null
  return drills.value.find(d => d.id === latest.value.drill_id) || null
})

const sessionsForLatestDrill = computed(() => {
  if (!latestDrill.value) return []
  return sessions.value.filter(s => s.drill_id === latestDrill.value.id)
})

const pb = computed(() => personalBest(sessionsForLatestDrill.value, latestDrill.value))
const trend = computed(() => computeTrend(sessionsForLatestDrill.value, latestDrill.value))

const trendIcon = computed(() =>
  trend.value.direction === 'up' ? '↑'
  : trend.value.direction === 'down' ? '↓'
  : '→'
)

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const goPractice = () => {
  // Navigate to the Practice tracker (a different dashboard mode + tab). The
  // dashboard owns that state, so bubble an event up rather than poking the DOM.
  emit('go-to-drills')
}

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: drillsData } = await supabase
      .from('practice_drills')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
    drills.value = drillsData || []
    if (drills.value.length === 0) return

    const { data: sessionsData } = await supabase
      .from('practice_sessions')
      .select('*')
      .in('drill_id', drills.value.map(d => d.id))
      .order('session_date', { ascending: true })
    sessions.value = sessionsData || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tile-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.when {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tile-body { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.tile-body--muted { color: var(--color-text-muted); }
.tile-body--cta { color: var(--color-text-muted); font-size: var(--font-size-sm); }

.cta-link {
  color: var(--color-accent);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  margin-top: 6px;
}
.cta-link:hover { text-decoration: underline; }
.cta-link--footer { margin-top: auto; padding-top: 8px; font-size: var(--font-size-sm); }

.drill-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.value {
  font-size: 1.7rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
}

.trend { font-size: 1.2rem; font-weight: var(--font-weight-bold); }
.trend--up { color: var(--color-success); }
.trend--down { color: var(--color-danger); }
.trend--flat { color: var(--color-warning); }

.pb-line {
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
}
</style>
