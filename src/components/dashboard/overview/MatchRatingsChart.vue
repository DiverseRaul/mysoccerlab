<template>
  <BentoItem :delay="900" extra-class="bento-item--wide trends-tile">
    <div class="tile-header">
      <h4>Match Ratings History (Last 10 Matches)</h4>
      <div class="rating-badges">
        <span class="badge">Avg: {{ averageRating }}</span>
        <span class="badge highlight">Best: {{ highestRating }}</span>
      </div>
    </div>
    <BarChart :bars="bars" scale="rating" />
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import BarChart from './BarChart.vue'
import { calculateMatchRating, getRatingColor } from '../../../lib/rating'

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
    const rating = calculateMatchRating(match)
    return {
      key: match.id,
      value: parseFloat(rating),
      displayValue: rating,
      label: match.opponent,
      colorClass: getRatingColor(parseFloat(rating))
    }
  })
)

const averageRating = computed(() => {
  if (recentMatches.value.length === 0) return '0.00'
  const total = recentMatches.value.reduce(
    (sum, m) => sum + parseFloat(calculateMatchRating(m)),
    0
  )
  return (total / recentMatches.value.length).toFixed(2)
})

const highestRating = computed(() => {
  if (recentMatches.value.length === 0) return '0.00'
  const ratings = recentMatches.value.map(m => parseFloat(calculateMatchRating(m)))
  return Math.max(...ratings).toFixed(2)
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
  letter-spacing: 0.5px;
}

.badge.highlight {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
</style>
