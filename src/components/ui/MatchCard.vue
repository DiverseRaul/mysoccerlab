<template>
  <!-- ROW: used in Matches list -->
  <div
    v-if="variant === 'row'"
    class="match-card match-card--row"
    :class="`match-card--result-${resultKey}`"
    :data-result="resultLetter"
  >
    <div class="match-card__header">
      <div class="match-card__opponent">
        <h4>{{ match.opponent }}</h4>
        <div class="match-card__meta">
          <span class="match-card__date">{{ formattedDate }}</span>
          <span
            v-if="highlight"
            class="match-card__chip"
            :title="`${highlight.label} this match`"
          >
            <span class="match-card__chip-icon">{{ highlight.icon }}</span>
            <span class="match-card__chip-label">{{ highlight.label }}</span>
          </span>
        </div>
      </div>
      <div class="match-card__score-result">
        <p class="match-card__score-text">{{ match.score_for }} - {{ match.score_against }}</p>
        <ResultBadge :result="resultKey" />
      </div>
    </div>

    <div class="match-card__row-stats">
      <StatTile compact label="Goals" :value="match.my_goals || 0" />
      <StatTile compact label="Assists" :value="match.assists || 0" />
      <div class="match-card__rating-cell">
        <span v-if="isBest" class="match-card__star" title="Season best">★</span>
        <StatTile compact label="Rating" :value="ratingFormatted" :accent="ratingAccent" />
      </div>
      <slot name="trailing" />
    </div>

    <div v-if="hasSparkline" class="match-card__sparkline-wrap">
      <div class="match-card__sparkline-title">Rating · last {{ ratingHistory.length }} matches</div>
      <svg
        class="match-card__sparkline"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <!-- Faint baseline at rating 6 -->
        <line x1="0" y1="19.2" x2="100" y2="19.2" class="match-card__spark-baseline" />
        <polyline
          :points="sparkPoints"
          class="match-card__spark-line"
          :class="ratingAccent"
        />
        <!-- Dot at every point -->
        <circle
          v-for="(p, i) in sparkData"
          :key="`dot-${i}`"
          :cx="p.x"
          :cy="p.y"
          :r="i === sparkData.length - 1 ? 2.4 : 1.6"
          class="match-card__spark-dot"
          :class="[ratingAccent, { 'match-card__spark-dot--current': i === sparkData.length - 1 }]"
        />
      </svg>
      <div class="match-card__sparkline-labels">
        <div
          v-for="(item, i) in ratingHistory"
          :key="`lbl-${i}`"
          class="match-card__sparkline-label"
          :class="{ 'match-card__sparkline-label--current': i === ratingHistory.length - 1 }"
          :title="item.opponent || ''"
        >{{ truncateOpponent(item.opponent) }}</div>
      </div>
    </div>
  </div>

  <!-- TILE: Overview "best match" -->
  <div
    v-else-if="variant === 'tile'"
    class="match-card match-card--tile"
  >
    <div class="match-card__tile-row">
      <span class="match-card__opp-name">{{ match.opponent }}</span>
      <span class="match-card__score-text" :class="resultClass">
        {{ match.score_for }} - {{ match.score_against }}
      </span>
    </div>
    <div class="match-card__tile-row">
      <span class="match-card__date-muted">{{ formattedDate }}</span>
      <RatingPill :rating="rating" size="sm" />
    </div>
  </div>

  <!-- INLINE: AI Coach message card -->
  <div
    v-else
    class="match-card match-card--inline"
  >
    <div class="match-card__inline-header">
      <div class="match-card__title">vs {{ match.opponent }}</div>
      <div class="match-card__date-muted">{{ formattedDate }}</div>
    </div>
    <div class="match-card__inline-score">
      <span class="match-card__score-num">{{ match.score_for }}</span>
      <span class="match-card__score-sep">–</span>
      <span class="match-card__score-num">{{ match.score_against }}</span>
    </div>
    <ResultBadge :result="resultKey" />
    <div class="match-card__rating-row">
      <span class="match-card__rating-caption">Rating</span>
      <RatingPill :rating="rating" size="md" />
    </div>
    <div class="match-card__inline-stats">
      <StatTile compact label="Goals" :value="match.my_goals || 0" />
      <StatTile compact label="Assists" :value="match.assists || 0" />
      <StatTile compact label="Chances" :value="match.created_chances || 0" />
      <StatTile compact label="Pass Acc" :value="`${passAccuracy}%`" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ResultBadge from './ResultBadge.vue'
import RatingPill from './RatingPill.vue'
import StatTile from './StatTile.vue'
import { calculateMatchRating, getRatingColor } from '../../lib/rating'

const props = defineProps({
  match: { type: Object, required: true },
  variant: {
    type: String,
    default: 'row',
    validator: (v) => ['row', 'tile', 'inline'].includes(v)
  },
  isBest: { type: Boolean, default: false },
  rating: { type: [Number, String], default: null },
  highlight: { type: Object, default: null },        // { icon, label } from matchHighlights
  // Ascending-order rating history for the sparkline. Each item is
  // { rating: number, opponent: string }. Newest match is the last item.
  // Plain numbers are accepted for backward compat.
  ratingHistory: { type: Array, default: () => [] }
})

const computedRating = computed(() => {
  if (props.rating !== null && props.rating !== '') return props.rating
  return calculateMatchRating(props.match)
})

const rating = computedRating

const ratingFormatted = computed(() => {
  const v = parseFloat(rating.value)
  return Number.isFinite(v) ? v.toFixed(1) : '—'
})

const ratingAccent = computed(() => {
  const v = parseFloat(rating.value)
  return Number.isFinite(v) ? getRatingColor(v) : ''
})

const resultKey = computed(() => {
  const m = props.match
  if (m.score_for > m.score_against) return 'win'
  if (m.score_for < m.score_against) return 'loss'
  return 'draw'
})

// Single-letter form for tests / data attributes
const resultLetter = computed(() => {
  const k = resultKey.value
  return k === 'win' ? 'W' : k === 'loss' ? 'L' : 'D'
})

const resultClass = computed(() => {
  const r = resultKey.value
  if (r === 'win') return 'text-win'
  if (r === 'loss') return 'text-loss'
  return 'text-draw'
})

const formattedDate = computed(() => {
  if (!props.match.match_date) return ''
  return new Date(props.match.match_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const passAccuracy = computed(() => {
  const succ = props.match.successful_passes || 0
  const fail = props.match.unsuccessful_passes || 0
  const total = succ + fail
  if (total === 0) return 0
  return Math.round((succ / total) * 100)
})

// ── Sparkline ──────────────────────────────────────────
const hasSparkline = computed(() =>
  props.variant === 'row' && Array.isArray(props.ratingHistory) && props.ratingHistory.length >= 2
)

const sparkData = computed(() => {
  // Each history item is either a number (legacy) or { rating, opponent }.
  // Map rating 1.0–10.0 → y in a 0–32 viewBox (top is high rating).
  const values = props.ratingHistory.map(item => {
    const r = typeof item === 'number' ? item : item?.rating
    return Math.max(1, Math.min(10, parseFloat(r) || 0))
  })
  const n = values.length
  return values.map((v, i) => ({
    x: n === 1 ? 50 : (i / (n - 1)) * 100,
    y: 32 - ((v - 1) / 9) * 32
  }))
})

const sparkPoints = computed(() =>
  sparkData.value.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
)

// Trim long club names so 6 labels fit under a 300px-wide card. We drop the
// FC / AC / AS / Real prefixes when there's a longer significant word after.
function truncateOpponent(name) {
  if (!name) return '—'
  const trimmed = name.trim()
  const skipPrefixes = /^(fc|cf|ac|as|sc|ss|real|club|atl[eé]tico)\s+/i
  const cleaned = skipPrefixes.test(trimmed) && trimmed.split(/\s+/).length > 1
    ? trimmed.replace(skipPrefixes, '')
    : trimmed
  const firstWord = cleaned.split(/\s+/)[0]
  return firstWord.length > 5 ? firstWord.slice(0, 5) : firstWord
}
</script>

<style scoped>
/* ── Shared chrome ───────────────────────────────────────────── */
.match-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

/* ── Row variant ─────────────────────────────────────────────── */
.match-card--row {
  cursor: pointer;
  position: relative;
  /* Result-tier accent uses the card's left border so it inherits the
     card's border-radius and curves cleanly into the rounded corners. */
  border-left: 4px solid var(--color-neutral);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease,
    box-shadow 0.25s ease;
}

.match-card--result-win  { border-left-color: var(--color-success); }
.match-card--result-loss { border-left-color: var(--color-danger); }
.match-card--result-draw { border-left-color: var(--color-neutral); }

/* Subtle radial gradient that fades in on hover */
.match-card--row::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at top right, var(--color-accent-soft), transparent 65%);
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity 0.3s ease;
}

@media (hover: hover) {
  .match-card--row:hover {
    transform: translateY(-3px);
    /* Tint only the top/right/bottom borders so the result-tier left
       border keeps its color. */
    border-top-color: var(--color-accent-border);
    border-right-color: var(--color-accent-border);
    border-bottom-color: var(--color-accent-border);
    box-shadow:
      0 0 0 1px var(--color-accent-border),
      0 12px 32px rgba(0, 0, 0, 0.45);
  }
  .match-card--row:hover::after {
    opacity: 0.18;
  }
}

/* Mobile: tactile press feedback instead of hover lift */
.match-card--row:active {
  transform: scale(0.99);
  border-top-color: var(--color-accent-border);
  border-right-color: var(--color-accent-border);
  border-bottom-color: var(--color-accent-border);
}

.match-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.match-card__opponent {
  min-width: 0;
  flex: 1;
}

.match-card__opponent h4 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 4px;
  flex-wrap: wrap;
}

.match-card__date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Top-stat highlight chip */
.match-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-card__chip-icon { font-size: 0.85rem; line-height: 1; }
.match-card__chip-label { letter-spacing: 0.2px; }

.match-card__score-result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}

.match-card__score-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.match-card__row-stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: var(--space-4);
  gap: var(--space-3);
}

.match-card__rating-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
}

.match-card__star {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 0.85rem;
  color: var(--color-card-yellow);
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
  z-index: 1;
}

/* ── Sparkline (rating line graph) ────────────────────────── */
.match-card__sparkline-wrap {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}

.match-card__sparkline-title {
  font-size: 0.65rem;
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.match-card__sparkline {
  display: block;
  width: 100%;
  height: 36px;
}

.match-card__spark-baseline {
  stroke: var(--color-border-soft);
  stroke-width: 0.5;
  stroke-dasharray: 2 2;
}

.match-card__spark-line {
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.match-card__spark-dot {
  fill: var(--color-text-muted);
  stroke: var(--color-bg-surface);
  stroke-width: 0.5;
  vector-effect: non-scaling-stroke;
}

.match-card__spark-dot--current {
  stroke: var(--color-text-primary);
  stroke-width: 1.2;
}

/* Rating-tier coloring — line gets stroke only (no fill, otherwise the
   polyline reads as a filled area), dots get stroke + fill. */
.match-card__spark-line.rating-world-class { stroke: var(--color-rating-world-class); fill: none; }
.match-card__spark-line.rating-elite       { stroke: var(--color-rating-elite);       fill: none; }
.match-card__spark-line.rating-excellent   { stroke: var(--color-rating-excellent);   fill: none; }
.match-card__spark-line.rating-good        { stroke: var(--color-rating-good);        fill: none; }
.match-card__spark-line.rating-average     { stroke: var(--color-rating-average);     fill: none; }
.match-card__spark-line.rating-poor        { stroke: var(--color-rating-poor);        fill: none; }
.match-card__spark-line.rating-bad         { stroke: var(--color-rating-bad);         fill: none; }

.match-card__spark-dot.rating-world-class { stroke: var(--color-rating-world-class); fill: var(--color-rating-world-class); }
.match-card__spark-dot.rating-elite       { stroke: var(--color-rating-elite);       fill: var(--color-rating-elite); }
.match-card__spark-dot.rating-excellent   { stroke: var(--color-rating-excellent);   fill: var(--color-rating-excellent); }
.match-card__spark-dot.rating-good        { stroke: var(--color-rating-good);        fill: var(--color-rating-good); }
.match-card__spark-dot.rating-average     { stroke: var(--color-rating-average);     fill: var(--color-rating-average); }
.match-card__spark-dot.rating-poor        { stroke: var(--color-rating-poor);        fill: var(--color-rating-poor); }
.match-card__spark-dot.rating-bad         { stroke: var(--color-rating-bad);         fill: var(--color-rating-bad); }

/* Current dot keeps its tier fill but gets the white outline override */
.match-card__spark-dot--current.rating-world-class,
.match-card__spark-dot--current.rating-elite,
.match-card__spark-dot--current.rating-excellent,
.match-card__spark-dot--current.rating-good,
.match-card__spark-dot--current.rating-average,
.match-card__spark-dot--current.rating-poor,
.match-card__spark-dot--current.rating-bad {
  stroke: var(--color-text-primary);
}

/* Opponent labels under each point */
.match-card__sparkline-labels {
  display: flex;
  margin-top: 4px;
  gap: 2px;
}

.match-card__sparkline-label {
  flex: 1;
  font-size: 0.6rem;
  color: var(--color-text-faint);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
}

.match-card__sparkline-label--current {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

/* ── Tile variant ────────────────────────────────────────────── */
.match-card--tile {
  gap: var(--space-2);
  padding: var(--space-4);
}

.match-card__tile-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
}

.match-card__opp-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.match-card__date-muted {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}

.text-win  { color: var(--color-success); }
.text-loss { color: var(--color-danger); }
.text-draw { color: var(--color-neutral); }

/* ── Inline variant (AI Coach) ───────────────────────────────── */
.match-card--inline {
  border-color: var(--color-accent-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  max-width: 340px;
  gap: var(--space-3);
  box-shadow: var(--shadow-md);
  align-items: stretch;
}

.match-card__inline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.match-card__inline-score {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  justify-content: center;
}

.match-card__score-num {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.match-card__score-sep {
  font-size: var(--font-size-xl);
  color: var(--color-text-disabled);
  font-weight: 300;
}

.match-card__rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: var(--space-3);
}

.match-card__rating-caption {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.match-card__inline-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.match-card__inline-stats :deep(.stat-tile--compact) {
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
  padding: var(--space-2) 4px;
}

/* Center the inline result badge */
.match-card--inline > :deep(.result-badge) {
  align-self: center;
}
</style>
