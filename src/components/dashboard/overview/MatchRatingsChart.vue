<template>
  <BentoItem :delay="900" extra-class="bento-item--wide trends-tile">
    <div class="tile-header">
      <h4>Match Ratings History (Last 10 Matches)</h4>
      <div class="rating-badges">
        <span class="badge">Avg: {{ averageRating }}</span>
        <span class="badge highlight">Best: {{ highestRating }}</span>
        <span class="badge" :title="consistencyTitle">{{ consistencyLabel }}</span>
      </div>
    </div>
    <BarChart :bars="bars" scale="rating" show-grid clickable @bar-click="onBarClick" />
    <p class="chart-hint">Tap a bar to open that match</p>
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

const emit = defineEmits(['open-match'])

const onBarClick = (bar) => { if (bar?.key != null) emit('open-match', bar.key) }

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

// Consistency = standard deviation of the recent ratings. A smaller spread means
// steadier form; we surface it as a plain-language label plus the raw ± value.
const ratingStdDev = computed(() => {
  const ratings = recentMatches.value.map(m => parseFloat(calculateMatchRating(m)))
  if (ratings.length < 2) return null
  const mean = ratings.reduce((s, r) => s + r, 0) / ratings.length
  const variance = ratings.reduce((s, r) => s + (r - mean) ** 2, 0) / ratings.length
  return Math.sqrt(variance)
})

const consistencyLabel = computed(() => {
  const sd = ratingStdDev.value
  if (sd === null) return 'Consistency: —'
  const word = sd < 0.5 ? 'Steady' : sd < 1 ? 'Variable' : 'Streaky'
  return `${word} ±${sd.toFixed(1)}`
})

const consistencyTitle = computed(() => {
  const sd = ratingStdDev.value
  if (sd === null) return 'Need at least 2 matches to measure consistency'
  return `Your last ${recentMatches.value.length} ratings vary by about ±${sd.toFixed(2)} around the average (lower = steadier form).`
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

.chart-hint {
  margin: 10px 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  text-align: center;
}
</style>
