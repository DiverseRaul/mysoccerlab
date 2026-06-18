<template>
  <div class="drill-detail" data-testid="practice-drill-detail">
    <header class="detail-header">
      <button class="back-btn" type="button" @click="$emit('back')">
        ← Back to drills
      </button>
      <div class="actions">
        <button class="btn btn-secondary" type="button" @click="$emit('edit-drill')">Edit</button>
        <button class="btn btn-danger" type="button" @click="$emit('delete-drill')">Delete</button>
      </div>
    </header>

    <div class="title-row">
      <div class="title-block">
        <h2>{{ drill.name }}</h2>
        <p class="meta">
          {{ metricTypeLabel(drill.metric_type) }}<span v-if="drill.unit"> · {{ drill.unit }}</span>
          <span v-if="drill.lower_is_better"> · lower is better</span>
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary log-btn"
        data-testid="practice-log-session-btn"
        @click="$emit('log-session')"
      >+ Log session</button>
    </div>

    <div class="kpi-row">
      <div class="kpi">
        <span class="kpi-label">Latest</span>
        <span class="kpi-value">{{ latest ? formatValue(latest, drill) : '—' }}</span>
        <span class="kpi-sub" v-if="latest">{{ formatDate(latest.session_date) }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Personal best</span>
        <span class="kpi-value kpi-value--pb">{{ pb ? formatValue(pb, drill) : '—' }}</span>
        <span class="kpi-sub" v-if="pb">{{ formatDate(pb.session_date) }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Target</span>
        <span class="kpi-value">{{ drill.target_value !== null && drill.target_value !== undefined ? drill.target_value : '—' }}</span>
        <span class="kpi-sub" v-if="drill.target_value !== null && drill.target_value !== undefined && drill.unit">{{ drill.unit }}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Sessions</span>
        <span class="kpi-value">{{ sessions.length }}</span>
      </div>
    </div>

    <p v-if="drill.notes" class="notes">{{ drill.notes }}</p>

    <DrillLineChart :drill="drill" :sessions="sessions" />

    <section v-if="drill.metric_type === 'shot_map'" class="map-section">
      <h3>Shot map</h3>
      <p v-if="placements.length === 0" class="map-empty">
        No shots marked yet. When logging a session, toggle <em>“Mark each shot on the goal map”</em> to build a heatmap.
      </p>
      <template v-else>
        <!-- Filters: by session, foot, and outcome -->
        <div class="map-filters" data-testid="shot-map-filters">
          <label class="map-filter">
            <span>Session</span>
            <select v-model="filterSession" class="map-filter__select" data-testid="filter-session">
              <option :value="null">All sessions</option>
              <option v-for="s in sortedDesc" :key="s.id" :value="s.id">
                {{ formatDate(s.session_date) }}
              </option>
            </select>
          </label>
          <div class="map-filter">
            <span>Foot</span>
            <div class="map-filter__pills">
              <button
                v-for="f in FOOT_FILTERS"
                :key="f.value"
                type="button"
                class="filter-pill"
                :class="{ active: filterFoot === f.value }"
                :data-testid="`filter-foot-${f.value}`"
                @click="filterFoot = f.value"
              >{{ f.label }}</button>
            </div>
          </div>
          <div class="map-filter">
            <span>Outcome</span>
            <div class="map-filter__pills">
              <button
                v-for="o in OUTCOME_FILTERS"
                :key="o.value"
                type="button"
                class="filter-pill"
                :class="{ active: filterOutcome === o.value }"
                :data-testid="`filter-outcome-${o.value}`"
                @click="filterOutcome = o.value"
              >{{ o.label }}</button>
            </div>
          </div>
        </div>

        <p v-if="filteredPlacements.length === 0" class="map-empty">No shots match these filters.</p>
        <template v-else>
          <ShotAnalytics :placements="filteredPlacements" />
          <PracticeGoalMap
            :placements="filteredPlacements"
            :interactive="false"
            :show-heatmap="showHeatmap"
            :show-markers="showMarkers"
            @update:showHeatmap="showHeatmap = $event"
            @update:showMarkers="showMarkers = $event"
          />
        </template>
      </template>
    </section>

    <div class="log-section">
      <h3>Session log</h3>
      <div v-if="sortedDesc.length === 0" class="empty-log">
        No sessions yet — log one to start tracking improvement.
      </div>
      <table v-else class="log-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
            <th>Notes</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in sortedDesc"
            :key="s.id"
            :data-testid="`practice-session-row-${s.id}`"
          >
            <td>{{ formatDate(s.session_date) }}</td>
            <td class="value-cell">
              {{ formatValue(s, drill) }}
              <span v-if="pb && pb.id === s.id" class="pb-tag">PB</span>
            </td>
            <td class="notes-cell">{{ s.notes || '' }}</td>
            <td class="row-action">
              <button
                type="button"
                class="row-edit"
                aria-label="Edit session"
                :data-testid="`practice-session-edit-${s.id}`"
                @click="$emit('edit-session', s)"
              >Edit</button>
              <button
                type="button"
                class="row-delete"
                aria-label="Delete session"
                @click="confirmDelete(s)"
              >×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DrillLineChart from './DrillLineChart.vue'
import PracticeGoalMap from './PracticeGoalMap.vue'
import ShotAnalytics from './ShotAnalytics.vue'

const showHeatmap = ref(true)
const showMarkers = ref(true)
import {
  formatValue,
  personalBest,
  latestSession,
  metricTypeLabel,
  sortByDateAsc
} from '../../../lib/practiceFormat'

const props = defineProps({
  drill: { type: Object, required: true },
  sessions: { type: Array, default: () => [] },
  placements: { type: Array, default: () => [] }
})

const emit = defineEmits(['back', 'log-session', 'edit-drill', 'delete-drill', 'delete-session', 'edit-session'])

const FOOT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
]
const OUTCOME_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'goal', label: 'Goal' },
  { value: 'save', label: 'Save' },
  { value: 'post', label: 'Post' },
  { value: 'miss', label: 'Miss' }
]
const filterSession = ref(null)
const filterFoot = ref('all')
const filterOutcome = ref('all')

const filteredPlacements = computed(() =>
  props.placements.filter((p) => {
    if (filterSession.value !== null && p.session_id !== filterSession.value) return false
    if (filterFoot.value !== 'all' && p.foot !== filterFoot.value) return false
    if (filterOutcome.value !== 'all' && p.outcome !== filterOutcome.value) return false
    return true
  })
)

const latest = computed(() => latestSession(props.sessions))
const pb = computed(() => personalBest(props.sessions, props.drill))
const sortedDesc = computed(() => sortByDateAsc(props.sessions).reverse())

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const confirmDelete = (session) => {
  if (window.confirm(`Delete the ${formatDate(session.session_date)} session?`)) {
    emit('delete-session', session.id)
  }
}
</script>

<style scoped>
.drill-detail { color: var(--color-text-primary); }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.back-btn {
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
}

.back-btn:hover { background: var(--color-bg-surface-2); }

.actions { display: flex; gap: var(--space-2); }

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.title-block h2 { margin: 0; font-size: var(--font-size-xl); }
.meta { margin: 4px 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.kpi {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.kpi-value { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.kpi-value--pb { color: var(--color-accent); }
.kpi-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.notes {
  margin: 0 0 var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.map-section {
  margin-top: var(--space-6);
  padding: var(--space-4);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-soft);
}

.map-section h3 { margin: 0 0 var(--space-3); font-size: var(--font-size-md); }

.map-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  align-items: center;
}
.map-filter { display: flex; align-items: center; gap: 8px; }
.map-filter > span { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

/* Space the analytics panel off the goal map below it. */
.map-section :deep(.goal-map) { margin-top: var(--space-4); }
.map-filter__select {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-family: inherit;
  font-size: var(--font-size-sm);
}
.map-filter__pills { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-pill {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.filter-pill.active { background: var(--color-accent); color: var(--color-on-accent); border-color: var(--color-accent); }

.map-empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
  text-align: center;
  padding: var(--space-4);
  font-style: italic;
}

.log-section { margin-top: var(--space-6); }
.log-section h3 { margin: 0 0 var(--space-3); font-size: var(--font-size-md); }

.empty-log {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-5);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
  font-style: italic;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.log-table th, .log-table td {
  padding: 10px var(--space-3);
  text-align: left;
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border-subtle);
}

.log-table th { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
.log-table tr:last-child td { border-bottom: none; }

.value-cell { font-weight: var(--font-weight-bold); color: var(--color-accent); }
.notes-cell { color: var(--color-text-muted); }

.pb-tag {
  margin-left: var(--space-2);
  font-size: var(--font-size-xs);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-accent-border);
  font-weight: var(--font-weight-bold);
}

.row-action { width: 96px; white-space: nowrap; text-align: right; }

.row-edit {
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-right: 6px;
  font-family: inherit;
}
.row-edit:hover { border-color: var(--color-accent-border); color: var(--color-accent); }

.row-delete {
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;
}

.row-delete:hover { color: var(--color-danger); }

.btn {
  padding: 8px var(--space-4);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  font-family: inherit;
}

.btn-primary { background: var(--color-accent); color: var(--color-bg-page); }
.btn-primary:hover { background: var(--color-accent-strong); }

.btn-secondary {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-soft);
}
.btn-secondary:hover { background: var(--color-bg-surface-3); }

.btn-danger { background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger); }
.btn-danger:hover { background: var(--color-danger); color: #fff; }

.log-btn { padding: 10px var(--space-5); }
</style>
