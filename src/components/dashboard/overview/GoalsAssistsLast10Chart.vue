<template>
  <BentoItem :delay="1000" extra-class="bento-item--wide trends-tile">
    <div class="tile-header">
      <h4>Goals & Assists (Last 10 Matches)</h4>
      <div class="rating-badges">
        <span class="badge">Avg: {{ averagePerMatch }}</span>
      </div>
    </div>
    <BarChart :bars="bars" :max="maxValue" />
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
    const total = (match.my_goals || 0) + (match.assists || 0)
    return {
      key: match.id,
      value: total,
      label: match.opponent,
      colorClass: 'goal-fill'
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

.badge {
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}
</style>
