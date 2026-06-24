<template>
  <BentoItem :delay="0" extra-class="header-stat-tile">
    <StatTile label="Matches" :value="matchesCount">
      <template #icon>⚽</template>
      <template #footer>
        <div v-if="recentForm.length" class="hs-form" aria-label="Recent form">
          <span
            v-for="(r, i) in recentForm"
            :key="i"
            class="hs-form__dot"
            :class="'hs-form__dot--' + r"
            :title="r.toUpperCase()"
          ></span>
        </div>
      </template>
    </StatTile>
  </BentoItem>

  <!-- Win Record: combines Wins + Win Rate into one tile -->
  <BentoItem :delay="100" extra-class="header-stat-tile">
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

  <BentoItem :delay="200" extra-class="header-stat-tile">
    <StatTile label="Avg Rating" :value="averageRating" :accent="ratingAccent">
      <template #icon>⭐</template>
      <template #footer>
        <svg v-if="ratingSpark" class="hs-spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
          <polyline class="hs-spark__line" :points="ratingSpark" />
        </svg>
      </template>
    </StatTile>
  </BentoItem>

  <!-- Last Match: most recent match's rating + result badge -->
  <BentoItem :delay="300" extra-class="header-stat-tile">
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

// Last 5 results (oldest → newest, left to right) as W/D/L for the form dots.
const recentForm = computed(() =>
  props.matches
    .slice(0, 5)
    .map((m) => {
      const sf = m.score_for ?? 0
      const sa = m.score_against ?? 0
      return sf > sa ? 'w' : sf < sa ? 'l' : 'd'
    })
    .reverse()
)

// Mini sparkline of the last (up to) 8 match ratings, normalised to a 0–100 ×
// 0–26 viewBox. Needs ≥2 points to draw a line.
const ratingSpark = computed(() => {
  const ratings = props.matches
    .slice(0, 8)
    .map((m) => parseFloat(calculateMatchRating(m)))
    .reverse()
  if (ratings.length < 2) return ''
  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const span = max - min || 1
  const stepX = 100 / (ratings.length - 1)
  return ratings
    .map((r, i) => {
      const x = i * stepX
      const y = 24 - ((r - min) / span) * 22 - 1
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

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
/* The header tiles share one compact layout — the BentoItem (.header-stat-tile)
   provides the padding now, so the inner content is paddingless and tight. */
:deep(.stat-tile) {
  padding: 0;
  gap: var(--space-2);
}

/* ── Win Record tile ──────────────────────────────────────────── */
.record-tile,
.last-match-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
  padding: 0;
  height: 100%;
}

.record-icon,
.last-match-icon,
:deep(.stat-tile__icon) {
  font-size: 1.4rem;
  width: 42px;
  height: 42px;
  background: var(--color-bg-surface-3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.3s ease;
  margin-bottom: 2px;
}

.record-tile:hover .record-icon,
.last-match-tile:hover .last-match-icon {
  transform: scale(1.1) rotate(5deg);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
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
  background: linear-gradient(to bottom, transparent, var(--color-border-soft) 20%, var(--color-border-soft) 80%, transparent);
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

/* ── Footer micro-viz (Matches form dots / Avg Rating sparkline) ──────── */
.hs-form {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

.hs-form__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-faint);
}

.hs-form__dot--w { background: var(--color-success); }
.hs-form__dot--d { background: var(--color-neutral); }
.hs-form__dot--l { background: var(--color-danger); }

.hs-spark {
  width: 72px;
  height: 22px;
  margin-top: 8px;
  overflow: visible;
}

.hs-spark__line {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
</style>
