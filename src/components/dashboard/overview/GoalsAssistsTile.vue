<template>
  <BentoItem :delay="500" extra-class="performance-tile">
    <div class="tile-header">
      <h4>Goals & Assists</h4>
    </div>
    <div class="stats-row">
      <div class="stat-group">
        <span class="big-number">{{ totalGoals }}</span>
        <span class="label">Goals</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-group">
        <span class="big-number">{{ totalAssists }}</span>
        <span class="label">Assists</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-group">
        <span class="big-number">{{ totalGoals + totalAssists }}</span>
        <span class="label">G+A</span>
      </div>
    </div>

    <div class="chart-content shooting-stats">
      <div class="stat-bar-container">
        <div class="bar-header">
          <span class="label-small">Shooting Accuracy</span>
          <span class="value-small">{{ shotAccuracy }}%</span>
        </div>
        <div class="simple-bar-track">
          <div class="simple-bar-fill" :style="{ width: shotAccuracy + '%' }"></div>
        </div>
      </div>
      <div class="stat-bar-container">
        <div class="bar-header">
          <span class="label-small">Conversion Rate</span>
          <span class="value-small">{{ shotConversionRate }}%</span>
        </div>
        <div class="simple-bar-track">
          <div class="simple-bar-fill fill-gold" :style="{ width: shotConversionRate + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Trend footer: only rendered when at least one insight has data -->
    <div v-if="showTrendFooter" class="trend-footer">
      <span
        v-if="goalsTrend !== null"
        class="trend-item"
        :class="goalsTrend > 0 ? 'trend-up' : goalsTrend < 0 ? 'trend-down' : 'trend-neutral'"
      >
        {{ goalsTrend > 0 ? '↑' : goalsTrend < 0 ? '↓' : '→' }}
        {{ Math.abs(goalsTrend) }} goals vs prev 10
      </span>
      <span v-if="bestScoringStreak.matches > 1" class="trend-item trend-neutral">
        Best streak: {{ bestScoringStreak.goals }}G in {{ bestScoringStreak.matches }} games
      </span>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'

const props = defineProps({
  matches: { type: Array, required: true }
})

const totalGoals = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.my_goals || 0), 0)
)

const totalAssists = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.assists || 0), 0)
)

const totalShotsOnTarget = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.shots_on_target || 0), 0)
)

const totalShotsOffTarget = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.shots_off_target || 0), 0)
)

const totalShots = computed(() => totalShotsOnTarget.value + totalShotsOffTarget.value)

const shotAccuracy = computed(() => {
  if (totalShots.value === 0) return 0
  return Math.min(100, Math.round((totalShotsOnTarget.value / totalShots.value) * 100))
})

const shotConversionRate = computed(() => {
  if (totalShots.value === 0) return 0
  return Math.min(100, Math.round((totalGoals.value / totalShots.value) * 100))
})

const goalsTrend = computed(() => {
  if (props.matches.length < 11) return null
  const recent = props.matches.slice(0, 10).reduce((sum, m) => sum + (m.my_goals || 0), 0)
  const prev   = props.matches.slice(10, 20).reduce((sum, m) => sum + (m.my_goals || 0), 0)
  return recent - prev
})

const bestScoringStreak = computed(() => {
  let maxStreak = 0
  let maxGoals = 0
  let curStreak = 0
  let curGoals = 0
  for (const m of props.matches) {
    if ((m.my_goals || 0) > 0) {
      curStreak++
      curGoals += m.my_goals
      if (curStreak > maxStreak) {
        maxStreak = curStreak
        maxGoals = curGoals
      }
    } else {
      curStreak = 0
      curGoals = 0
    }
  }
  return { matches: maxStreak, goals: maxGoals }
})

const showTrendFooter = computed(() =>
  goalsTrend.value !== null || bestScoringStreak.value.matches > 1
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

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 10px 0;
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.big-number {
  font-size: 2.2rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  background: linear-gradient(135deg, #fff 30%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent);
}

.chart-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.shooting-stats {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px;
}

.stat-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.label-small { color: var(--color-text-muted); }
.value-small { color: var(--color-text-primary); font-weight: var(--font-weight-bold); }

.simple-bar-track {
  width: 100%;
  height: 6px;
  background: var(--color-border-soft);
  border-radius: 3px;
  overflow: hidden;
}

.simple-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-brand-fg));
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.simple-bar-fill.fill-gold {
  background: var(--color-card-yellow);
}

/* ── Trend footer ──────────────────────────────────────────── */
.trend-footer {
  margin-top: var(--space-3);
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
</style>
