<template>
  <div class="match-hero" data-testid="match-hero">
    <div class="match-hero__scoreline">
      <span class="match-hero__team match-hero__team--you">{{ MyTeamLabel }}</span>
      <span class="match-hero__score">{{ Match.score_for ?? 0 }} <span class="match-hero__sep">–</span> {{ Match.score_against ?? 0 }}</span>
      <span class="match-hero__team">{{ OpponentLabel }}</span>
    </div>

    <div class="match-hero__grid">
      <div class="match-hero__stat match-hero__stat--rating">
        <span class="match-hero__icon" aria-hidden="true">⭐</span>
        <span class="match-hero__value" :class="RatingTier">{{ Rating }}</span>
        <span class="match-hero__label">Rating</span>
      </div>
      <div class="match-hero__stat">
        <span class="match-hero__icon" aria-hidden="true">⚽</span>
        <span class="match-hero__value" :class="{ 'is-good': (Match.my_goals || 0) > 0 }">{{ Match.my_goals || 0 }}</span>
        <span class="match-hero__label">Goals</span>
      </div>
      <div class="match-hero__stat">
        <span class="match-hero__icon" aria-hidden="true">🅰️</span>
        <span class="match-hero__value" :class="{ 'is-good': (Match.assists || 0) > 0 }">{{ Match.assists || 0 }}</span>
        <span class="match-hero__label">Assists</span>
      </div>
      <div class="match-hero__stat">
        <span class="match-hero__icon" aria-hidden="true">🎯</span>
        <span class="match-hero__value" :class="PassClass">{{ PassAccuracy }}<span class="match-hero__unit">%</span></span>
        <span class="match-hero__label">Pass</span>
      </div>
      <div class="match-hero__stat">
        <span class="match-hero__icon" aria-hidden="true">🔑</span>
        <span class="match-hero__value" :class="{ 'is-good': (Match.created_chances || 0) > 0 }">{{ Match.created_chances || 0 }}</span>
        <span class="match-hero__label">Chances</span>
      </div>
      <div class="match-hero__stat">
        <span class="match-hero__icon" aria-hidden="true">🛡️</span>
        <span class="match-hero__value" :class="{ 'is-good': (Match.tackles || 0) > 0 }">{{ Match.tackles || 0 }}</span>
        <span class="match-hero__label">Tackles</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const Props = defineProps({
  Match: { type: Object, required: true },
  Rating: { type: [String, Number], default: '0.00' },
  RatingTier: { type: String, default: '' },
  MyTeamLabel: { type: String, default: 'You' }
})

const OpponentLabel = computed(() => {
  const Opponent = (Props.Match.opponent || '').trim()
  return Opponent || 'Opponent'
})

// Mirrors ShareMatchModal's passAccuracy: successful / (successful + unsuccessful).
const PassAccuracy = computed(() => {
  const Good = Props.Match.successful_passes || 0
  const Bad = Props.Match.unsuccessful_passes || 0
  const Total = Good + Bad
  if (Total === 0) return 0
  return Math.round((Good / Total) * 100)
})

// Good/mid/bad tint for pass accuracy so its quality reads without thinking.
const PassClass = computed(() => {
  const Total = (Props.Match.successful_passes || 0) + (Props.Match.unsuccessful_passes || 0)
  if (Total === 0) return ''
  const Pct = PassAccuracy.value
  if (Pct >= 80) return 'is-good'
  if (Pct >= 60) return 'is-mid'
  return 'is-bad'
})
</script>

<style scoped>
.match-hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.match-hero__scoreline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.match-hero__team {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-hero__team--you {
  text-align: right;
  color: var(--color-accent);
}

.match-hero__team:last-child {
  text-align: left;
}

.match-hero__score {
  flex: 0 0 auto;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.match-hero__sep {
  color: var(--color-text-faint);
  font-weight: var(--font-weight-regular);
  margin: 0 2px;
}

.match-hero__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--color-border-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.match-hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: var(--space-3) var(--space-2);
  background: var(--color-bg-surface-2);
}

.match-hero__icon {
  font-size: 0.95rem;
  line-height: 1;
  opacity: 0.85;
}

.match-hero__value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  line-height: 1;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

/* Quality tint: green = good, amber = okay, red = poor. */
.match-hero__value.is-good { color: var(--color-success); }
.match-hero__value.is-mid  { color: var(--color-warning); }
.match-hero__value.is-bad  { color: var(--color-danger); }

.match-hero__unit {
  font-size: 0.6em;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  margin-left: 1px;
}

.match-hero__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Rating tier colors mirror src/lib/rating.js getRatingColor() output. */
.match-hero__value.rating-world-class { color: var(--color-rating-world-class); }
.match-hero__value.rating-elite       { color: var(--color-rating-elite); }
.match-hero__value.rating-excellent   { color: var(--color-rating-excellent); }
.match-hero__value.rating-good        { color: var(--color-rating-good); }
.match-hero__value.rating-average     { color: var(--color-rating-average); }
.match-hero__value.rating-poor        { color: var(--color-rating-poor); }
.match-hero__value.rating-bad         { color: var(--color-rating-bad); }
</style>
