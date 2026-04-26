<template>
  <BentoItem :delay="0">
    <StatTile label="Matches" :value="matchesCount">
      <template #icon>⚽</template>
    </StatTile>
  </BentoItem>

  <!-- Win Record: combines Wins + Win Rate into one tile -->
  <BentoItem :delay="100">
    <div class="record-tile">
      <div class="record-icon">🏆</div>
      <div class="wdl-row">
        <div class="wdl-group">
          <span class="wdl-num wdl-win">{{ wins }}</span>
          <span class="wdl-lbl">W</span>
        </div>
        <div class="wdl-sep"></div>
        <div class="wdl-group">
          <span class="wdl-num wdl-draw">{{ draws }}</span>
          <span class="wdl-lbl">D</span>
        </div>
        <div class="wdl-sep"></div>
        <div class="wdl-group">
          <span class="wdl-num wdl-loss">{{ losses }}</span>
          <span class="wdl-lbl">L</span>
        </div>
      </div>
      <span class="win-rate-sub">{{ winRate }}% win rate</span>
    </div>
  </BentoItem>

  <BentoItem :delay="200">
    <StatTile label="Avg Rating" :value="averageRating" :accent="ratingAccent">
      <template #icon>⭐</template>
    </StatTile>
  </BentoItem>

  <!-- Last Match: most recent match's rating + result badge -->
  <BentoItem :delay="300">
    <div class="last-match-tile">
      <div class="last-match-icon">🔥</div>
      <div class="last-match-row">
        <span
          class="last-match-value"
          :class="lastMatchAccent"
        >{{ lastMatchRating }}</span>
        <span
          v-if="lastMatchResult"
          class="last-match-badge"
          :class="'badge-' + lastMatchResult"
        >{{ lastMatchResult }}</span>
      </div>
      <span class="last-match-label">Last Match</span>
      <span v-if="lastMatchOpponent" class="last-match-opponent">vs {{ lastMatchOpponent }}</span>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import StatTile from '../../ui/StatTile.vue'
import { calculateMatchRating, getRatingColor } from '../../../lib/rating'

const props = defineProps({
  matches: { type: Array, required: true }
})

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

const winRate = computed(() => {
  if (props.matches.length === 0) return 0
  return Math.round((wins.value / props.matches.length) * 100)
})

const averageRating = computed(() => {
  if (props.matches.length === 0) return '0.00'
  const total = props.matches.reduce(
    (sum, m) => sum + parseFloat(calculateMatchRating(m)),
    0
  )
  return (total / props.matches.length).toFixed(2)
})

const ratingAccent = computed(() => getRatingColor(parseFloat(averageRating.value)))

const lastMatch = computed(() => props.matches[0] || null)

const lastMatchRating = computed(() => {
  if (!lastMatch.value) return '—'
  return parseFloat(calculateMatchRating(lastMatch.value)).toFixed(1)
})

const lastMatchAccent = computed(() => {
  if (!lastMatch.value) return ''
  return getRatingColor(parseFloat(calculateMatchRating(lastMatch.value)))
})

const lastMatchOpponent = computed(() => {
  if (!lastMatch.value || !lastMatch.value.opponent) return ''
  const opp = lastMatch.value.opponent
  return opp.length > 14 ? opp.slice(0, 13) + '…' : opp
})

const lastMatchResult = computed(() => {
  if (!lastMatch.value) return ''
  const sf = lastMatch.value.score_for ?? 0
  const sa = lastMatch.value.score_against ?? 0
  if (sf > sa) return 'W'
  if (sf < sa) return 'L'
  return 'D'
})
</script>

<style scoped>
/* ── Win Record tile ──────────────────────────────────────────── */
.record-tile,
.last-match-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5);
  height: 100%;
}

.record-icon,
.last-match-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  background: var(--color-bg-surface-3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.3s ease;
  margin-bottom: var(--space-1);
}

.record-tile:hover .record-icon,
.last-match-tile:hover .last-match-icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(76, 218, 156, 0.15);
}

.wdl-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.wdl-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.wdl-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.wdl-win  { color: var(--color-success); }
.wdl-draw { color: var(--color-neutral); }
.wdl-loss { color: var(--color-danger); }

.wdl-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.wdl-sep {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent);
}

.win-rate-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.3px;
}

/* ── Last Match Rating tile ──────────────────────────────────── */
.last-match-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-heavy);
  line-height: 1;
  color: var(--color-text-primary);
}

.last-match-value.rating-world-class { color: var(--color-rating-world-class); }
.last-match-value.rating-elite       { color: var(--color-rating-elite); }
.last-match-value.rating-excellent   { color: var(--color-rating-excellent); }
.last-match-value.rating-good        { color: var(--color-rating-good); }
.last-match-value.rating-average     { color: var(--color-rating-average); }
.last-match-value.rating-poor        { color: var(--color-rating-poor); }
.last-match-value.rating-bad         { color: var(--color-rating-bad); }

.last-match-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.last-match-opponent {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  letter-spacing: 0.3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-match-row {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.last-match-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-heavy);
}

.badge-W { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-accent-border); }
.badge-D { background: var(--color-neutral-bg); color: var(--color-neutral); border: 1px solid rgba(189, 189, 189, 0.4); }
.badge-L { background: var(--color-danger-bg);  color: var(--color-danger);  border: 1px solid rgba(239, 83, 80, 0.4); }
</style>
