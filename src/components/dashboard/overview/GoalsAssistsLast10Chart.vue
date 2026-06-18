<template>
  <BentoItem :delay="1000" extra-class="bento-item--wide trends-tile">
    <div class="tile-header">
      <h4>Goals & Assists (Last 10 Matches)</h4>
      <div class="rating-badges">
        <span class="badge">Avg/match: {{ averagePerMatch }}</span>
      </div>
    </div>
    <div class="ga-legend">
      <span class="ga-legend__item"><span class="ga-dot ga-dot--goal"></span>Goals</span>
      <span class="ga-legend__item"><span class="ga-dot ga-dot--assist"></span>Assists</span>
    </div>
    <BarChart :bars="bars" :max="maxValue" show-grid />
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import BarChart from './BarChart.vue'

const props = defineProps({
  matches: { type: Array, required: true }
})

const recentMatches = computed(() => {
  const sorted = [...props.matches].sort(
    (a, b) => new Date(b.match_date) - new Date(a.match_date)
  )
  return sorted.slice(0, 10)
})

const bars = computed(() =>
  recentMatches.value.map(match => {
    const goals = match.my_goals || 0
    const assists = match.assists || 0
    return {
      key: match.id,
      value: goals + assists,
      // displayValue keeps the total label on top of the stacked bar.
      displayValue: goals + assists,
      label: match.opponent,
      segments: [
        { value: goals, colorClass: 'goal-seg' },
        { value: assists, colorClass: 'assist-seg' }
      ]
    }
  })
)

const maxValue = computed(() => {
  if (recentMatches.value.length === 0) return 1
  return Math.max(...recentMatches.value.map(m => (m.my_goals || 0) + (m.assists || 0)), 1)
})

const averagePerMatch = computed(() => {
  if (recentMatches.value.length === 0) return '0.0'
  const total = recentMatches.value.reduce(
    (sum, m) => sum + (m.my_goals || 0) + (m.assists || 0), 0
  )
  return (total / recentMatches.value.length).toFixed(1)
})
</script>

<style scoped>
.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.tile-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.rating-badges {
  display: flex;
  gap: 8px;
}

.ga-legend { display: flex; gap: 16px; margin-bottom: 4px; }
.ga-legend__item { display: inline-flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); color: var(--color-text-muted); }
.ga-dot { width: 10px; height: 10px; border-radius: 2px; }
.ga-dot--goal { background: var(--color-accent); }
.ga-dot--assist { background: var(--color-card-yellow); }

.badge {
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}
</style>
