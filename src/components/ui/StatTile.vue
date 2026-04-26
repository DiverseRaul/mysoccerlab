<template>
  <div class="stat-tile" :class="{ 'stat-tile--compact': compact }">
    <div v-if="!compact && hasIcon" class="stat-tile__icon">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <div class="stat-tile__content">
      <span class="stat-tile__value" :class="accent">
        <slot name="value">{{ value }}</slot>
      </span>
      <span class="stat-tile__label">{{ label }}</span>
      <span v-if="trend" class="stat-tile__trend" :class="trendDirection">
        {{ trend }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  icon: { type: String, default: '' },
  trend: { type: [String, Number], default: null },
  accent: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})

const slots = useSlots()
const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon))

const trendDirection = computed(() => {
  if (props.trend === null || props.trend === '') return ''
  const n = parseFloat(props.trend)
  if (Number.isFinite(n)) {
    if (n > 0) return 'stat-tile__trend--up'
    if (n < 0) return 'stat-tile__trend--down'
  }
  return ''
})
</script>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-5);
}

.stat-tile__icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  background: var(--color-bg-surface-3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
  transition: transform 0.3s ease, background 0.3s ease;
}

.stat-tile:hover .stat-tile__icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(76, 218, 156, 0.15);
}

.stat-tile__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.stat-tile__value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  background: linear-gradient(135deg, #fff 30%, var(--color-brand-fg) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}


.stat-tile__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-tile__trend {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-faint);
}

.stat-tile__trend--up   { color: var(--color-success); }
.stat-tile__trend--down { color: var(--color-danger); }

/* Compact variant — used in Matches list rows. */
.stat-tile--compact {
  flex-direction: column;
  gap: 2px;
  padding: 0;
  align-items: center;
}

.stat-tile--compact .stat-tile__value {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  background: none;
  -webkit-text-fill-color: var(--color-text-primary);
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-tile--compact .stat-tile__label {
  font-size: 0.75rem;
  margin-top: 2px;
}

/* Rating-tier classes from rating.js override the gradient. */
.stat-tile__value.rating-world-class,
.stat-tile__value.rating-elite,
.stat-tile__value.rating-excellent,
.stat-tile__value.rating-good,
.stat-tile__value.rating-average,
.stat-tile__value.rating-poor,
.stat-tile__value.rating-bad {
  background: none;
  -webkit-background-clip: initial;
  background-clip: initial;
  -webkit-text-fill-color: currentColor;
}

.stat-tile__value.rating-world-class { color: var(--color-rating-world-class); }
.stat-tile__value.rating-elite       { color: var(--color-rating-elite); }
.stat-tile__value.rating-excellent   { color: var(--color-rating-excellent); }
.stat-tile__value.rating-good        { color: var(--color-rating-good); }
.stat-tile__value.rating-average     { color: var(--color-rating-average); }
.stat-tile__value.rating-poor        { color: var(--color-rating-poor); }
.stat-tile__value.rating-bad         { color: var(--color-rating-bad); }
</style>
