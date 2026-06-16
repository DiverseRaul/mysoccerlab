<template>
  <div class="training-overview" data-testid="training-overview">
    <!-- Loading skeleton -->
    <div v-if="loading" class="to-skel">
      <div class="to-skel__tiles">
        <Skeleton v-for="n in 4" :key="n" height="104px" radius="var(--radius-md)" />
      </div>
      <Skeleton height="220px" radius="var(--radius-md)" />
    </div>

    <!-- Empty: no drills yet -->
    <EmptyState
      v-else-if="drills.length === 0"
      icon="🎯"
      title="Start training"
      message="Track any drill — juggles, sprints, shooting accuracy — and watch yourself improve over time. No match needed."
      data-testid="training-overview-empty"
    >
      <button type="button" class="to-cta" @click="emit('go-to-drills')">
        Create your first drill
      </button>
    </EmptyState>

    <template v-else>
      <!-- Headline stats -->
      <div class="to-tiles">
        <div class="to-tile">
          <StatTile label="Active drills" :value="totals.activeDrills">
            <template #icon>🎯</template>
          </StatTile>
        </div>
        <div class="to-tile">
          <StatTile label="Sessions logged" :value="totals.totalSessions">
            <template #icon>📈</template>
          </StatTile>
        </div>
        <div class="to-tile">
          <StatTile label="Day streak" :value="streak">
            <template #icon>🔥</template>
          </StatTile>
        </div>
        <div class="to-tile">
          <StatTile label="Drills peaking" :value="totals.pbDrills">
            <template #icon>🏅</template>
          </StatTile>
        </div>
      </div>

      <div class="to-grid">
        <!-- Recent activity -->
        <section class="to-card">
          <header class="to-card__head">
            <h3>Recent activity</h3>
            <button type="button" class="to-link" @click="emit('go-to-drills')">All drills →</button>
          </header>
          <ul v-if="recent.length" class="to-activity">
            <li v-for="s in recent" :key="s.id" class="to-activity__row">
              <div class="to-activity__main">
                <span class="to-activity__drill">{{ drillName(s.drill_id) }}</span>
                <span class="to-activity__value">{{ formatValue(s, drillById[s.drill_id]) }}</span>
              </div>
              <span class="to-activity__date">{{ formatDate(s.session_date) }}</span>
            </li>
          </ul>
          <p v-else class="to-muted">No sessions logged yet — log one from a drill to start tracking.</p>
        </section>

        <!-- Per-drill progress -->
        <section class="to-card">
          <header class="to-card__head">
            <h3>Your drills</h3>
            <button type="button" class="to-add" @click="emit('go-to-drills')">+ New drill</button>
          </header>
          <div class="to-drills">
            <button
              v-for="drill in drills"
              :key="drill.id"
              type="button"
              class="to-drill"
              :data-testid="`training-overview-drill-${drill.id}`"
              @click="emit('go-to-drills')"
            >
              <div class="to-drill__top">
                <span class="to-drill__name">{{ drill.name }}</span>
                <span class="to-drill__type">{{ metricTypeLabel(drill.metric_type) }}</span>
              </div>
              <div class="to-drill__bottom">
                <span v-if="latestFor(drill)" class="to-drill__latest">
                  {{ formatValue(latestFor(drill), drill) }}
                </span>
                <span v-else class="to-drill__latest to-drill__latest--empty">No sessions</span>
                <span class="to-drill__trend" :class="`trend--${trendFor(drill).direction}`">
                  {{ trendIcon(trendFor(drill).direction) }}
                </span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'
import StatTile from '../../ui/StatTile.vue'
import Skeleton from '../../ui/Skeleton.vue'
import EmptyState from '../../ui/EmptyState.vue'
import {
  formatValue,
  metricTypeLabel,
  computeTrend,
  latestSession,
  practiceStreak,
  practiceTotals,
  recentSessions
} from '../../../lib/practiceFormat'

defineProps({
  userName: { type: String, default: '' }
})

const emit = defineEmits(['go-to-drills'])

const drills = ref([])
const sessions = ref([])
const loading = ref(true)

const drillById = computed(() => {
  const map = {}
  for (const d of drills.value) map[d.id] = d
  return map
})

const sessionsByDrill = computed(() => {
  const map = {}
  for (const s of sessions.value) {
    if (!map[s.drill_id]) map[s.drill_id] = []
    map[s.drill_id].push(s)
  }
  return map
})

const totals = computed(() => practiceTotals(drills.value, sessions.value))
const streak = computed(() => practiceStreak(sessions.value))
const recent = computed(() => recentSessions(sessions.value, 6))

const drillName = (id) => drillById.value[id]?.name || 'Drill'
const sessionsFor = (drill) => sessionsByDrill.value[drill.id] || []
const latestFor = (drill) => latestSession(sessionsFor(drill))
const trendFor = (drill) => computeTrend(sessionsFor(drill), drill)
const trendIcon = (dir) => (dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'flat' ? '→' : '')

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const loadAll = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { data: drillsData, error: drillsError } = await supabase
      .from('practice_drills')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
    if (drillsError) { console.error('Error loading drills:', drillsError); return }
    drills.value = drillsData || []

    if (drills.value.length === 0) { sessions.value = []; return }

    const drillIds = drills.value.map(d => d.id)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .in('drill_id', drillIds)
      .order('session_date', { ascending: true })
    if (sessionsError) { console.error('Error loading sessions:', sessionsError); return }
    sessions.value = sessionsData || []
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.training-overview { color: var(--color-text-primary); }

.to-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.to-tile {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}

.to-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

.to-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-5);
}

.to-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.to-card__head h3 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.to-link, .to-add {
  background: none;
  border: none;
  color: var(--color-accent);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 0;
}

.to-activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }

.to-activity__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-soft);
}
.to-activity__row:last-child { border-bottom: none; }

.to-activity__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.to-activity__drill { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
.to-activity__value { font-size: var(--font-size-sm); color: var(--color-accent); font-weight: var(--font-weight-bold); }
.to-activity__date { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }

.to-muted { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.to-drills { display: flex; flex-direction: column; gap: var(--space-3); }

.to-drill {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.to-drill:hover { border-color: var(--color-accent-border); transform: translateY(-1px); }

.to-drill__top { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.to-drill__name { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
.to-drill__type {
  font-size: var(--font-size-xs);
  background: var(--color-bg-surface-3);
  color: var(--color-text-muted);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
.to-drill__bottom { display: flex; justify-content: space-between; align-items: center; }
.to-drill__latest { font-size: var(--font-size-sm); color: var(--color-accent); font-weight: var(--font-weight-bold); }
.to-drill__latest--empty { color: var(--color-text-faint); font-style: italic; font-weight: var(--font-weight-normal); }
.to-drill__trend { font-size: 1rem; font-weight: var(--font-weight-bold); }

.trend--up { color: var(--color-success); }
.trend--down { color: var(--color-danger); }
.trend--flat { color: var(--color-warning); }
.trend--none { color: var(--color-text-faint); }

.to-cta {
  background: var(--color-accent);
  color: var(--color-on-accent);
  border: none;
  padding: 10px var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: inherit;
}
.to-cta:hover { background: var(--color-accent-strong); }

.to-skel { display: flex; flex-direction: column; gap: var(--space-5); }
.to-skel__tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }

@media (max-width: 768px) {
  .to-tiles { grid-template-columns: repeat(2, 1fr); }
  .to-skel__tiles { grid-template-columns: repeat(2, 1fr); }
  .to-grid { grid-template-columns: 1fr; }
}
</style>
