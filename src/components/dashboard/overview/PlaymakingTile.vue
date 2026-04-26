<template>
  <BentoItem :delay="600" extra-class="performance-tile playmaking-tile">
    <div class="tile-header header-spaced">
      <h4>Playmaking</h4>
    </div>

    <div class="playmaking-content">
      <div class="stat-bar-container">
        <div class="bar-header">
          <span class="label-small">Pass Accuracy</span>
          <span class="value-small">{{ passAccuracy }}%</span>
        </div>
        <div class="stacked-bar-container">
          <div class="stacked-bar">
            <div class="bar-segment segment-good" :style="{ width: passAccuracy + '%' }"></div>
            <div class="bar-segment segment-bad" :style="{ width: (100 - passAccuracy) + '%' }"></div>
          </div>
          <div class="bar-legend">
            <div class="legend-item">
              <div class="dot dot-good"></div>
              <span>Good ({{ passAccuracy }}%)</span>
            </div>
            <div class="legend-item">
              <div class="dot dot-bad"></div>
              <span>Bad ({{ 100 - passAccuracy }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-row mini-stats">
        <div class="stat-group">
          <span class="big-stat">{{ totalPasses }}</span>
          <span class="label">Passes</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group">
          <span class="big-stat">{{ totalChancesCreated }}</span>
          <span class="label">Chances</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group">
          <span class="big-stat">{{ totalDribbles }}</span>
          <span class="label">Dribbles</span>
        </div>
      </div>

      <div v-if="showTrendFooter" class="trend-footer">
        <span
          v-if="passAccuracyTrend !== null"
          class="trend-item"
          :class="passAccuracyTrend > 0 ? 'trend-up' : passAccuracyTrend < 0 ? 'trend-down' : 'trend-neutral'"
        >
          {{ passAccuracyTrend > 0 ? '↑' : passAccuracyTrend < 0 ? '↓' : '→' }}
          Pass accuracy {{ passAccuracyTrend > 0 ? '+' : '' }}{{ passAccuracyTrend }}% vs prev 10
        </span>
        <span v-if="parseFloat(chancesPerGame) > 0" class="trend-item trend-neutral">
          Avg {{ chancesPerGame }} chances/game
        </span>
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

const totalSuccessfulPasses = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.successful_passes || 0), 0)
)

const totalUnsuccessfulPasses = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.unsuccessful_passes || 0), 0)
)

const totalPasses = computed(() => totalSuccessfulPasses.value + totalUnsuccessfulPasses.value)

const passAccuracy = computed(() => {
  if (totalPasses.value === 0) return 0
  return Math.round((totalSuccessfulPasses.value / totalPasses.value) * 100)
})

const totalChancesCreated = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.created_chances || 0), 0)
)

const totalDribbles = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.dribbles || 0), 0)
)

const passAccuracyTrend = computed(() => {
  const calcAcc = (arr) => {
    const succ = arr.reduce((sum, m) => sum + (m.successful_passes || 0), 0)
    const fail = arr.reduce((sum, m) => sum + (m.unsuccessful_passes || 0), 0)
    const total = succ + fail
    return total === 0 ? null : Math.round((succ / total) * 100)
  }
  const recent = calcAcc(props.matches.slice(0, 10))
  const prev = calcAcc(props.matches.slice(10, 20))
  if (recent === null || prev === null) return null
  return recent - prev
})

const chancesPerGame = computed(() => {
  if (props.matches.length === 0) return '0'
  return (totalChancesCreated.value / props.matches.length).toFixed(1)
})

const showTrendFooter = computed(() =>
  passAccuracyTrend.value !== null || parseFloat(chancesPerGame.value) > 0
)
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

.header-spaced { margin-bottom: 24px; }

/* Stretch content to fill the tile (especially when it's 2-cols wide) */
.playmaking-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-5);
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

/* ── Pass accuracy bar ───────────────────────────────────── */
.stat-bar-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.label-small { color: var(--color-text-muted); }
.value-small { color: var(--color-text-primary); font-weight: var(--font-weight-bold); font-size: var(--font-size-md); }

.stacked-bar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stacked-bar {
  width: 100%;
  height: 14px;
  background: var(--color-border-soft);
  border-radius: 7px;
  display: flex;
  overflow: hidden;
}

.bar-segment {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.segment-good { background: var(--color-success); }
.segment-bad  { background: var(--color-danger); }

.bar-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-good { background: var(--color-success); }
.dot-bad  { background: var(--color-danger); }

/* ── Mini stats row, but bigger to fill the 2-col tile ──── */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-3) 0;
}

.mini-stats {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

/* Bigger stat numbers — fills the 2-col tile width on desktop */
.big-stat {
  font-size: 2.4rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  background: linear-gradient(135deg, #fff 30%, var(--color-brand-fg) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent);
  flex-shrink: 0;
}

/* ── Trend footer ───────────────────────────────────────── */
.trend-footer {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trend-item {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.trend-up      { color: var(--color-success); }
.trend-down    { color: var(--color-danger); }
.trend-neutral { color: var(--color-text-muted); }

/* On smaller screens the stat numbers shrink so they fit the narrower tile */
@media (max-width: 768px) {
  .big-stat { font-size: 1.8rem; }
}
</style>
