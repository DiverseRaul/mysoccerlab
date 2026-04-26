<template>
  <BentoItem :delay="1100" extra-class="bento-item--wide season-stats-tile">
    <div class="tile-header">
      <h4>Season Stats</h4>
      <span v-if="activeSeason?.name" class="active-pill">{{ activeSeason.name }}</span>
    </div>

    <div class="season-stats-layout">
      <!-- Left: active season summary -->
      <div class="summary-grid">
        <div class="summary-cell">
          <span class="summary-val">{{ matchesCount }}</span>
          <span class="summary-lbl">Matches</span>
        </div>
        <div class="summary-cell">
          <span class="summary-val summary-wdl">
            <span class="wdl wdl-w">{{ wins }}</span>
            <span class="wdl-sep">·</span>
            <span class="wdl wdl-d">{{ draws }}</span>
            <span class="wdl-sep">·</span>
            <span class="wdl wdl-l">{{ losses }}</span>
          </span>
          <span class="summary-lbl">Record (W·D·L)</span>
        </div>
        <div class="summary-cell">
          <span class="summary-val">{{ totalGoals }}</span>
          <span class="summary-lbl">Goals</span>
        </div>
        <div class="summary-cell">
          <span class="summary-val">{{ totalAssists }}</span>
          <span class="summary-lbl">Assists</span>
        </div>
        <div class="summary-cell">
          <span class="summary-val" :class="avgRatingAccent">{{ avgRating }}</span>
          <span class="summary-lbl">Avg Rating</span>
        </div>
        <div class="summary-cell">
          <span class="summary-val">{{ passAccuracy }}%</span>
          <span class="summary-lbl">Pass Accuracy</span>
        </div>
      </div>

      <!-- Right: per-season comparison chart -->
      <div class="comparison-pane">
        <div class="chart-title">Goals by season</div>
        <div v-if="comparisonBars.length === 0" class="comparison-empty">
          No seasons logged yet
        </div>
        <div v-else-if="comparisonBars.length === 1" class="comparison-single">
          Add another season to see a comparison
        </div>
        <BarChart
          v-else
          :bars="comparisonBars"
          :max="comparisonMax"
          :label-chars="6"
        />
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import BarChart from './BarChart.vue'
import { calculateMatchRating, getRatingColor } from '../../../lib/rating'

const props = defineProps({
  matches:      { type: Array, required: true },        // active-season-filtered
  allMatches:   { type: Array, default: () => [] },     // unfiltered (all seasons)
  seasons:      { type: Array, default: () => [] },
  activeSeason: { type: Object, default: null }
})

// ── Active season summary ──────────────────────────────────
const matchesCount = computed(() => props.matches.length)

const wins = computed(() =>
  props.matches.filter(m => m.score_for > m.score_against).length
)
const draws = computed(() =>
  props.matches.filter(m => m.score_for === m.score_against).length
)
const losses = computed(() =>
  props.matches.filter(m => m.score_for < m.score_against).length
)

const totalGoals = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.my_goals || 0), 0)
)

const totalAssists = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.assists || 0), 0)
)

const avgRating = computed(() => {
  if (props.matches.length === 0) return '0.00'
  const total = props.matches.reduce(
    (sum, m) => sum + parseFloat(calculateMatchRating(m)),
    0
  )
  return (total / props.matches.length).toFixed(2)
})

const avgRatingAccent = computed(() => getRatingColor(parseFloat(avgRating.value)))

const passAccuracy = computed(() => {
  const succ = props.matches.reduce((s, m) => s + (m.successful_passes || 0), 0)
  const fail = props.matches.reduce((s, m) => s + (m.unsuccessful_passes || 0), 0)
  const total = succ + fail
  if (total === 0) return 0
  return Math.round((succ / total) * 100)
})

// ── Per-season comparison ─────────────────────────────────
// Group allMatches by season_id, sum goals per season.
const goalsBySeason = computed(() => {
  const map = {}
  for (const m of props.allMatches) {
    const sid = m.season_id ?? '__none__'
    map[sid] = (map[sid] || 0) + (m.my_goals || 0)
  }
  return map
})

const comparisonBars = computed(() => {
  if (props.seasons.length === 0) return []
  // Sort seasons by created_at ascending so older → newer reads left to right
  const ordered = [...props.seasons].sort((a, b) =>
    new Date(a.created_at || 0) - new Date(b.created_at || 0)
  )
  return ordered.map(s => ({
    key: s.id,
    label: (s.name || '—').toString(),
    value: goalsBySeason.value[s.id] || 0,
    fill: s.id === props.activeSeason?.id ? 'var(--color-accent)' : 'var(--color-text-muted)'
  }))
})

const comparisonMax = computed(() => {
  const m = comparisonBars.value.reduce((max, b) => Math.max(max, b.value), 0)
  return Math.max(m, 1)
})
</script>

<style scoped>
.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tile-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.active-pill {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}

.season-stats-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  flex: 1;
  width: 100%;
}

@media (min-width: 768px) {
  .season-stats-layout {
    grid-template-columns: 1.2fr 1fr;
    gap: var(--space-6);
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 480px) {
  .summary-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.summary-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-3);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
}

.summary-val {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.summary-val.rating-world-class { color: var(--color-rating-world-class); }
.summary-val.rating-elite       { color: var(--color-rating-elite); }
.summary-val.rating-excellent   { color: var(--color-rating-excellent); }
.summary-val.rating-good        { color: var(--color-rating-good); }
.summary-val.rating-average     { color: var(--color-rating-average); }
.summary-val.rating-poor        { color: var(--color-rating-poor); }
.summary-val.rating-bad         { color: var(--color-rating-bad); }

.summary-wdl {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.wdl-w { color: var(--color-success); }
.wdl-d { color: var(--color-neutral); }
.wdl-l { color: var(--color-danger); }

.wdl-sep {
  color: var(--color-text-faint);
  font-weight: var(--font-weight-regular);
}

.summary-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.comparison-pane {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.chart-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.comparison-empty,
.comparison-single {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-faint);
  font-style: italic;
  min-height: 100px;
}
</style>
