<template>
  <BentoItem :delay="1100" extra-class="bento-item--wide trends-tile">
    <div class="tile-header">
      <div class="header-with-select">
        <h4>Last 25 Matches</h4>
        <select v-model="selectedStat" class="stat-select">
          <option v-for="opt in statOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="rating-badges">
        <span class="badge">Avg: {{ averageStat }}</span>
      </div>
    </div>
    <BarChart :bars="bars" :max="maxValue" :scrollable="true" :label-chars="2" />
  </BentoItem>
</template>

<script setup>
import { computed, ref } from 'vue'
import BentoItem from './BentoItem.vue'
import BarChart from './BarChart.vue'

const props = defineProps({
  matches: { type: Array, required: true }
})

const selectedStat = ref('lost_possessions')

const statOptions = [
  { label: 'Possession Lost', value: 'lost_possessions' },
  { label: 'Shots on Target', value: 'shots_on_target' },
  { label: 'Shots off Target', value: 'shots_off_target' },
  { label: 'Successful Passes', value: 'successful_passes' },
  { label: 'Unsuccessful Passes', value: 'unsuccessful_passes' },
  { label: 'Tackles', value: 'tackles' },
  { label: 'Interceptions', value: 'interceptions' },
  { label: 'Clearances', value: 'clearances' },
  { label: 'Dribbles', value: 'dribbles' },
  { label: 'Created Chances', value: 'created_chances' },
  { label: 'Fouls', value: 'fouls' }
]

const recentMatches = computed(() => {
  const sorted = [...props.matches].sort(
    (a, b) => new Date(b.match_date) - new Date(a.match_date)
  )
  return sorted.slice(0, 25).map(match => ({
    ...match,
    statValue: match[selectedStat.value] || 0
  }))
})

const bars = computed(() =>
  recentMatches.value.map(match => ({
    key: match.id,
    value: match.statValue,
    label: match.opponent
  }))
)

const maxValue = computed(() => {
  if (recentMatches.value.length === 0) return 1
  return Math.max(...recentMatches.value.map(m => m.statValue), 1)
})

const averageStat = computed(() => {
  if (recentMatches.value.length === 0) return '0.0'
  const total = recentMatches.value.reduce((sum, m) => sum + m.statValue, 0)
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

.header-with-select {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-select {
  background: var(--color-bg-surface-3);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
}

.stat-select:focus {
  outline: none;
  border-color: var(--color-accent-border);
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
