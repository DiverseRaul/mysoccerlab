<template>
  <BentoItem :delay="700" extra-class="performance-tile">
    <div class="tile-header header-spaced">
      <h4>Defensive Actions</h4>
    </div>
    <div class="chart-content">
      <div v-if="totalDefensiveActions === 0" class="empty-state">
        No defensive actions logged
      </div>
      <div v-else class="donut-chart-container">
        <svg viewBox="0 0 200 200" class="donut-svg">
          <path
            v-for="(slice, i) in donutPaths"
            :key="i"
            :d="slice.path"
            :class="['donut-segment', slice.colorClass]"
          />
          <text x="100" y="95" text-anchor="middle" class="donut-total-label">Total</text>
          <text x="100" y="115" text-anchor="middle" class="donut-total-value">{{ totalDefensiveActions }}</text>
        </svg>
        <div class="donut-legend">
          <div v-for="(slice, i) in donutPaths" :key="i" class="legend-item">
            <div class="dot" :class="slice.colorClass"></div>
            <span>{{ slice.label }} ({{ slice.value }})</span>
          </div>
        </div>
      </div>

      <!-- Discipline rows: stacked vertically so they fit any tile width -->
      <div class="cards-stack">
        <div class="card-item">
          <span class="card-icon">🟨</span>
          <span class="card-lbl">Yellow Cards</span>
          <span class="card-val card-val--yellow">{{ totalYellowCards }}</span>
        </div>
        <div class="card-item">
          <span class="card-icon">🟥</span>
          <span class="card-lbl">Red Cards</span>
          <span class="card-val card-val--red">{{ totalRedCards }}</span>
        </div>
        <div class="card-item">
          <span class="card-icon">⚠</span>
          <span class="card-lbl">Fouls</span>
          <span class="card-val card-val--muted">{{ totalFouls }}</span>
        </div>
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'

const props = defineProps({
  matches: { type: Array, required: true }
})

const totalTackles = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.tackles || 0), 0)
)

const totalInterceptions = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.interceptions || 0), 0)
)

const totalClearances = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.clearances || 0), 0)
)

const totalDefensiveActions = computed(
  () => totalTackles.value + totalInterceptions.value + totalClearances.value
)

const totalYellowCards = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.yellow_card || 0), 0)
)

const totalRedCards = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.red_card || 0), 0)
)

const totalFouls = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.fouls || 0), 0)
)

const donutConfig = { size: 200, center: 100, radius: 80, hole: 50 }

const donutPaths = computed(() => {
  const total = totalDefensiveActions.value
  if (total === 0) return []

  let startAngle = -Math.PI / 2
  const data = [
    { value: totalTackles.value, colorClass: 'donut-color-tackles', label: 'Tackles' },
    { value: totalInterceptions.value, colorClass: 'donut-color-interceptions', label: 'Interceptions' },
    { value: totalClearances.value, colorClass: 'donut-color-clearances', label: 'Clearances' }
  ]

  return data.map(item => {
    if (item.value === 0) return null
    const sliceAngle = (item.value / total) * 2 * Math.PI
    const endAngle = startAngle + sliceAngle

    const x1 = donutConfig.center + donutConfig.radius * Math.cos(startAngle)
    const y1 = donutConfig.center + donutConfig.radius * Math.sin(startAngle)
    const x2 = donutConfig.center + donutConfig.radius * Math.cos(endAngle)
    const y2 = donutConfig.center + donutConfig.radius * Math.sin(endAngle)
    const x3 = donutConfig.center + donutConfig.hole * Math.cos(endAngle)
    const y3 = donutConfig.center + donutConfig.hole * Math.sin(endAngle)
    const x4 = donutConfig.center + donutConfig.hole * Math.cos(startAngle)
    const y4 = donutConfig.center + donutConfig.hole * Math.sin(startAngle)

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0
    const path = [
      `M ${x1} ${y1}`,
      `A ${donutConfig.radius} ${donutConfig.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${donutConfig.hole} ${donutConfig.hole} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')

    startAngle = endAngle
    return { ...item, path }
  }).filter(Boolean)
})
</script>

<style scoped>
.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tile-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-spaced { margin-bottom: 30px; }

.chart-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.donut-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.donut-svg {
  width: 100%;
  max-width: 180px;
  height: auto;
}

.donut-segment {
  transition: opacity 0.3s ease;
}

.donut-total-label {
  fill: var(--color-text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.donut-total-value {
  fill: var(--color-text-primary);
  font-size: 1.6rem;
  font-weight: var(--font-weight-heavy);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.donut-color-tackles       { fill: var(--color-accent);  background: var(--color-accent); }
.donut-color-interceptions { fill: var(--color-warning); background: var(--color-warning); }
.donut-color-clearances    { fill: var(--color-info);    background: var(--color-info); }

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-style: italic;
  padding-bottom: var(--space-3);
}

/* ── Discipline rows (stacked) ─────────────────────────── */
.cards-stack {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-item {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: 6px var(--space-2);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
}

.card-icon {
  font-size: 0.95rem;
  line-height: 1;
  text-align: center;
}

.card-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.card-val {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  justify-self: end;
}

.card-val--yellow { color: var(--color-card-yellow); }
.card-val--red    { color: var(--color-danger); }
.card-val--muted  { color: var(--color-warning); }
</style>
