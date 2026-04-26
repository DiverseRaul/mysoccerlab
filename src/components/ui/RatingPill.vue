<template>
  <span class="rating-pill" :class="[sizeClass, colorClass]">
    <span class="rating-pill__value">{{ formattedRating }}</span>
    <span v-if="showLabel" class="rating-pill__label">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getRatingColor, getRatingLabel } from '../../lib/rating'

const props = defineProps({
  rating: {
    type: [Number, String],
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  showLabel: {
    type: Boolean,
    default: false
  }
})

const numericRating = computed(() => {
  const n = parseFloat(props.rating)
  return Number.isFinite(n) ? n : 0
})

const formattedRating = computed(() => numericRating.value.toFixed(2))
const colorClass = computed(() => getRatingColor(numericRating.value))
const label = computed(() => getRatingLabel(numericRating.value))
const sizeClass = computed(() => `rating-pill--${props.size}`)
</script>

<style scoped>
.rating-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-weight: var(--font-weight-heavy);
  line-height: 1;
}

.rating-pill__value {
  font-weight: var(--font-weight-heavy);
}

.rating-pill__label {
  font-size: 0.7em;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
}

.rating-pill--sm .rating-pill__value { font-size: 0.9rem; }
.rating-pill--md .rating-pill__value { font-size: var(--font-size-lg); }
.rating-pill--lg .rating-pill__value { font-size: var(--font-size-3xl); }

/* Rating tier color classes mirror src/lib/rating.js getRatingColor() output. */
.rating-world-class { color: var(--color-rating-world-class); }
.rating-elite       { color: var(--color-rating-elite); }
.rating-excellent   { color: var(--color-rating-excellent); }
.rating-good        { color: var(--color-rating-good); }
.rating-average     { color: var(--color-rating-average); }
.rating-poor        { color: var(--color-rating-poor); }
.rating-bad         { color: var(--color-rating-bad); }
</style>
