<template>
  <div class="shot-map-section">
    <header class="section-header">
      <div>
        <h3>Shot Map Analytics</h3>
        <p class="section-subtitle">Visualize your shooting accuracy and goal placement</p>
      </div>
    </header>

    <!-- Filters row -->
    <div class="filters-row">
      <select v-model="selectedMatchId" class="match-select">
        <option :value="null">All Matches</option>
        <option
          v-for="m in sortedMatches"
          :key="m.id"
          :value="m.id"
        >vs {{ m.opponent || 'Unknown' }} • {{ formatDate(m.date) }}</option>
      </select>
      <div class="type-pills">
        <button
          v-for="f in shotFilters"
          :key="f.value"
          :class="['type-pill', { active: shotTypeFilter === f.value }]"
          @click="shotTypeFilter = f.value"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Stat row -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--shots">📊</div>
        <div class="stat-card__content">
          <span class="stat-card__value">{{ totalShots }}</span>
          <span class="stat-card__label">Total Shots</span>
          <span class="stat-card__breakdown">
            {{ totalOnTarget }} on • {{ totalOffTarget }} off
          </span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--goals">⚽</div>
        <div class="stat-card__content">
          <span class="stat-card__value">{{ totalGoals }}</span>
          <span class="stat-card__label">Goals</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--accuracy">🎯</div>
        <div class="stat-card__content">
          <span class="stat-card__value">{{ shotAccuracy }}%</span>
          <span class="stat-card__label">Accuracy</span>
        </div>
      </div>
    </div>

    <!-- View toggle -->
    <div class="view-toggle">
      <button
        @click="shotMapView = 'goal'"
        :class="['toggle-btn', { active: shotMapView === 'goal' }]"
      >
        Goal Placement
      </button>
      <button
        @click="shotMapView = 'field'"
        :class="['toggle-btn', { active: shotMapView === 'field' }]"
      >
        Shot Origins
      </button>
    </div>

    <!-- Goal Placement view -->
    <div v-if="shotMapView === 'goal'" class="view-wrapper">
      <div class="goal-frame">
        <div class="goal-net">
          <div
            v-for="i in 9"
            :key="i"
            class="goal-cell"
            :class="{ 'goal-cell--has-data': getQuadrantShots(i) + getQuadrantGoals(i) > 0 }"
          >
            <div class="goal-cell__data">
              <span v-if="getQuadrantGoals(i) > 0" class="cell-pill cell-pill--goal">
                {{ getQuadrantGoals(i) }}
              </span>
              <span v-if="getQuadrantShots(i) > 0" class="cell-pill cell-pill--shot">
                {{ getQuadrantShots(i) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="!hasQuadrantData" class="empty-overlay">
          <span class="empty-overlay__icon">🥅</span>
          <p>No shot placements logged yet</p>
          <p class="empty-overlay__hint">Pick a quadrant when logging on-target shots</p>
        </div>
      </div>
      <div class="legend">
        <span class="legend-item">
          <span class="legend-dot legend-dot--goal"></span>Goals
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-dot--shot"></span>Shots on Target
        </span>
      </div>
    </div>

    <!-- Shot Origins view -->
    <div v-else class="view-wrapper">
      <div class="origin-field-wrapper">
        <ShotField mode="origin" :show-placeholder="false" class="origin-field">
          <template #overlay>
            <svg
              v-if="hasOriginData"
              class="trajectories"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                v-for="(shot, i) in onTargetShots"
                :key="'sl-' + i"
                :x1="getCoords(shot).x"
                :y1="getCoords(shot).y"
                :x2="getGoalTargetX(shot)"
                y2="0"
                class="trajectory trajectory--shot"
              />
              <line
                v-for="(goal, i) in goalsWithPos"
                :key="'gl-' + i"
                :x1="getCoords(goal).x"
                :y1="getCoords(goal).y"
                :x2="getGoalTargetX(goal)"
                y2="0"
                class="trajectory trajectory--goal"
              />
            </svg>

            <div v-if="hasOriginData" class="markers">
              <div
                v-for="(shot, i) in shotsWithPos"
                :key="'sm-' + i"
                class="marker marker--shot"
                :class="{ 'marker--off': !shot.on_target }"
                :style="markerStyle(shot)"
                @mouseenter="showTooltip(shot, 'shot', $event)"
                @mouseleave="hideTooltip"
                @click.stop="clickMarker(shot, 'shot', $event)"
              ></div>
              <div
                v-for="(goal, i) in goalsWithPos"
                :key="'gm-' + i"
                class="marker marker--goal"
                :style="markerStyle(goal)"
                @mouseenter="showTooltip(goal, 'goal', $event)"
                @mouseleave="hideTooltip"
                @click.stop="clickMarker(goal, 'goal', $event)"
              ></div>
            </div>

            <div v-else class="empty-overlay">
              <span class="empty-overlay__icon">⚽</span>
              <p>No shot origins logged yet</p>
              <p class="empty-overlay__hint">Tap the field while logging shots to mark origin</p>
            </div>
          </template>
        </ShotField>
      </div>

      <div v-if="hasOriginData" class="legend">
        <span class="legend-item">
          <span class="legend-dot legend-dot--goal"></span>Goals ({{ goalsWithPos.length }})
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-dot--shot"></span>On Target ({{ onTargetShots.length }})
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-dot--off"></span>Off Target ({{ offTargetShots.length }})
        </span>
      </div>
    </div>

  </div>

  <!-- Teleported to body so BentoItem's hover transform doesn't offset position:fixed -->
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="tooltip.visible"
        class="shot-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <span class="tooltip-type">{{ tooltip.typeIcon }} {{ tooltip.typeLabel }}</span>
        <span class="tooltip-match">vs {{ tooltip.opponent }}</span>
        <span class="tooltip-meta">{{ tooltip.date }} • {{ tooltip.result }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ShotField from './ui/ShotField.vue'

const props = defineProps({
  allShotsData: { type: Array, required: true },
  allGoalsData:  { type: Array, required: true },
  matches:       { type: Array, required: true }
})

const shotMapView    = ref('goal')
const selectedMatchId = ref(null)
const shotTypeFilter  = ref('all')

const shotFilters = [
  { value: 'all',        label: 'All' },
  { value: 'goals',      label: 'Goals' },
  { value: 'on_target',  label: 'On Target' },
  { value: 'off_target', label: 'Off Target' }
]

// ── Match lookup map ────────────────────────────────────────
const matchMap = computed(() => {
  const map = {}
  for (const m of props.matches) {
    const sf = m.score_for  ?? 0
    const sa = m.score_against ?? 0
    map[m.id] = {
      opponent: m.opponent || 'Unknown',
      date:     m.date ? formatDate(m.date) : '—',
      result:   sf > sa ? 'W' : sf < sa ? 'L' : 'D',
      score:    `${sf}–${sa}`
    }
  }
  return map
})

const sortedMatches = computed(() =>
  [...props.matches].sort((a, b) => new Date(b.date) - new Date(a.date))
)

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Filtered data ───────────────────────────────────────────
const filteredGoals = computed(() => {
  let data = props.allGoalsData
  if (selectedMatchId.value !== null) {
    data = data.filter(g => g.match_id === selectedMatchId.value)
  }
  if (shotTypeFilter.value !== 'all' && shotTypeFilter.value !== 'goals') return []
  return data
})

const filteredShots = computed(() => {
  let data = props.allShotsData
  if (selectedMatchId.value !== null) {
    data = data.filter(s => s.match_id === selectedMatchId.value)
  }
  if (shotTypeFilter.value === 'goals')      return []
  if (shotTypeFilter.value === 'on_target')  return data.filter(s => s.on_target)
  if (shotTypeFilter.value === 'off_target') return data.filter(s => !s.on_target)
  return data
})

// ── Aggregate stats (reflect active filters) ───────────────
const totalShots    = computed(() => filteredShots.value.length + filteredGoals.value.length)
const totalOnTarget = computed(() =>
  filteredShots.value.filter(s => s.on_target).length + filteredGoals.value.length
)
const totalOffTarget = computed(() => filteredShots.value.filter(s => !s.on_target).length)
const totalGoals     = computed(() => filteredGoals.value.length)
const shotAccuracy   = computed(() => {
  if (totalShots.value === 0) return 0
  return Math.round((totalOnTarget.value / totalShots.value) * 100)
})

// ── Quadrant counts (Goal Placement view) ──────────────────
const getQuadrantShots = (q) =>
  filteredShots.value.filter(s => s.quadrant === q && s.on_target).length
const getQuadrantGoals = (q) => filteredGoals.value.filter(g => g.quadrant === q).length
const hasQuadrantData  = computed(() =>
  filteredShots.value.some(s => s.quadrant) || filteredGoals.value.some(g => g.quadrant)
)

// ── Origin data (Shot Origins view) ────────────────────────
const hasFieldPosition = (item) =>
  typeof item.field_position === 'string' && item.field_position.includes(',')

const shotsWithPos   = computed(() => filteredShots.value.filter(hasFieldPosition))
const goalsWithPos   = computed(() => filteredGoals.value.filter(hasFieldPosition))
const onTargetShots  = computed(() => shotsWithPos.value.filter(s => s.on_target))
const offTargetShots = computed(() => shotsWithPos.value.filter(s => !s.on_target))
const hasOriginData  = computed(
  () => shotsWithPos.value.length > 0 || goalsWithPos.value.length > 0
)

// ── Coordinate helpers ──────────────────────────────────────
const getCoords = (item) => {
  const [x, y] = item.field_position.split(',').map(Number)
  return { x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 }
}

const markerStyle = (item) => {
  const { x, y } = getCoords(item)
  return { left: `${x}%`, top: `${y}%` }
}

const getGoalTargetX = (item) => {
  if (!item.quadrant) return 50
  const column = ((item.quadrant - 1) % 3) + 1
  if (column === 1) return 37
  if (column === 3) return 63
  return 50
}

// ── Tooltip ─────────────────────────────────────────────────
const tooltip = ref({
  visible:   false,
  typeIcon:  '',
  typeLabel: '',
  opponent:  '',
  date:      '',
  result:    '',
  x:         0,
  y:         0,
  _matchId:  null
})

function buildTooltipData(item, type) {
  const info = matchMap.value[item.match_id] || {}
  return {
    typeIcon:  type === 'goal' ? '⚽' : item.on_target ? '🎯' : '✗',
    typeLabel: type === 'goal' ? 'Goal' : item.on_target ? 'On Target' : 'Off Target',
    opponent:  info.opponent || 'Unknown',
    date:      info.date     || '—',
    result:    info.result && info.score ? `${info.result} ${info.score}` : '—',
    _matchId:  item.match_id
  }
}

function showTooltip(item, type, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  Object.assign(tooltip.value, {
    visible: true,
    x: rect.left + rect.width / 2,
    y: rect.top,
    ...buildTooltipData(item, type)
  })
}

function hideTooltip() {
  tooltip.value.visible = false
}

function clickMarker(item, type, event) {
  if (tooltip.value.visible && tooltip.value._matchId === item.match_id &&
      tooltip.value.typeLabel === buildTooltipData(item, type).typeLabel) {
    hideTooltip()
  } else {
    showTooltip(item, type, event)
  }
}

function handleDocumentClick(e) {
  if (!e.target.closest('.marker') && !e.target.closest('.shot-tooltip')) {
    hideTooltip()
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick))
</script>

<style scoped>
.shot-map-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  height: 100%;
  color: var(--color-text-primary);
}

/* ── Header ───────────────────────────────────────────────── */
.section-header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.section-header h3 {
  margin: 0 0 4px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.section-subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* ── Filters ──────────────────────────────────────────────── */
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.match-select {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  padding: 8px 12px;
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  min-width: 0;
  flex: 1 1 200px;
  max-width: 320px;
  transition: border-color 0.2s ease;
  appearance: auto;
}

.match-select:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.type-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.type-pill {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;
  white-space: nowrap;
}

.type-pill:hover {
  border-color: var(--color-accent-border);
  color: var(--color-text-secondary);
}

.type-pill.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

/* ── Stat row ─────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.stat-card {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.stat-card:hover {
  background: var(--color-bg-surface-3);
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}

.stat-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.stat-card__icon--shots    { background: var(--color-info-bg);    color: var(--color-info); }
.stat-card__icon--goals    { background: var(--color-success-bg); color: var(--color-success); }
.stat-card__icon--accuracy { background: var(--color-warning-bg); color: var(--color-warning); }

.stat-card__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-card__value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-card__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
  margin-top: 3px;
}

.stat-card__breakdown {
  font-size: 0.65rem;
  color: var(--color-text-faint);
  margin-top: 3px;
}

/* ── View toggle ──────────────────────────────────────────── */
.view-toggle {
  background: var(--color-bg-surface-2);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  display: inline-flex;
  gap: 2px;
  align-self: center;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}

.toggle-btn:hover:not(.active) {
  color: var(--color-text-secondary);
}

/* ── View wrapper (shared by both views) ──────────────────── */
.view-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  width: 100%;
}

/* ── Goal Placement view ──────────────────────────────────── */
.goal-frame {
  position: relative;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-field);
  border: 6px solid var(--color-border-strong);
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  box-shadow: var(--shadow-md), inset 0 0 50px rgba(0, 0, 0, 0.5);
}

.goal-frame::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -6px;
  right: -6px;
  height: 4px;
  background: var(--color-border-strong);
  border-radius: 0 0 2px 2px;
}

.goal-net {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.goal-cell {
  border: 1px dashed var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.25s ease;
}

.goal-cell--has-data {
  background: var(--color-accent-soft);
}

.goal-cell__data {
  display: flex;
  gap: 4px;
  z-index: 2;
}

.cell-pill {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-heavy);
  box-shadow: var(--shadow-sm);
}

.cell-pill--goal { background: var(--color-success); color: var(--color-bg-page); }
.cell-pill--shot { background: var(--color-info);    color: #fff; }

/* ── Shot Origins view ────────────────────────────────────── */
.origin-field-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.origin-field {
  width: 100%;
}

.trajectories {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.trajectory {
  fill: none;
  stroke-width: 0.4;
}

.trajectory--shot { stroke: rgba(59, 130, 246, 0.4); }
.trajectory--goal { stroke: rgba(76, 218, 156, 0.55); stroke-width: 0.5; }

.markers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.marker {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.55);
  transform: translate(-50%, -50%);
  z-index: 5;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.marker:hover {
  transform: translate(-50%, -50%) scale(1.4);
  z-index: 10;
}

.marker--shot {
  background: var(--color-info);
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.marker--shot.marker--off {
  background: var(--color-danger);
  box-shadow: 0 0 6px rgba(239, 83, 80, 0.5);
}

.marker--goal {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(76, 218, 156, 0.6);
  width: 16px;
  height: 16px;
  z-index: 6;
}

/* ── Empty state overlay (shared by both views) ───────────── */
.empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  text-align: center;
  padding: var(--space-5);
  color: var(--color-text-muted);
  z-index: 5;
}

.empty-overlay__icon {
  font-size: 2.4rem;
  opacity: 0.5;
  margin-bottom: var(--space-2);
}

.empty-overlay p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.empty-overlay__hint {
  font-size: var(--font-size-xs) !important;
  color: var(--color-text-faint);
}

/* ── Legend (shared) ──────────────────────────────────────── */
.legend {
  display: flex;
  gap: var(--space-5);
  flex-wrap: wrap;
  justify-content: center;
  padding-top: var(--space-2);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
}

.legend-dot--goal { background: var(--color-success); }
.legend-dot--shot { background: var(--color-info); }
.legend-dot--off  { background: var(--color-danger); }

/* ── Shot tooltip ─────────────────────────────────────────── */
.shot-tooltip {
  position: fixed;
  transform: translate(-50%, calc(-100% - 10px));
  z-index: 9999;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 3px;
  pointer-events: none;
  min-width: 160px;
  max-width: 220px;
}

.tooltip-type {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.tooltip-match {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.tooltip-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Tooltip transition ───────────────────────────────────── */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-100% - 4px));
}

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .match-select {
    max-width: 100%;
    flex: 1 1 auto;
  }

  .type-pills {
    justify-content: flex-start;
  }

  .stat-grid {
    gap: var(--space-2);
  }

  .stat-card {
    padding: var(--space-3);
    gap: var(--space-2);
  }

  .stat-card__icon {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .stat-card__value {
    font-size: var(--font-size-base);
  }

  .goal-frame,
  .origin-field-wrapper {
    max-width: 100%;
  }

  .legend {
    gap: var(--space-3);
    font-size: var(--font-size-xs);
  }

  .toggle-btn {
    padding: 8px 14px;
    font-size: var(--font-size-xs);
  }

  .marker {
    width: 16px;
    height: 16px;
  }

  .marker--goal {
    width: 18px;
    height: 18px;
  }
}
</style>
