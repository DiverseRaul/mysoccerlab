<template>
  <article class="pitch-card practice-card" :style="EntranceStyle" data-testid="practice-feed-card">
    <header class="pitch-card__head">
      <button type="button" class="pitch-card__author" data-testid="practice-feed-author" @click="emit('view-profile', Item.user_id)">
        <div class="pitch-card__avatar">{{ Initials }}</div>
        <div class="pitch-card__identity">
          <span class="pitch-card__namerow">
            <span class="pitch-card__name">{{ DisplayName }}</span>
            <ProBadge v-if="IsAuthorPro" small />
          </span>
          <span class="pitch-card__meta">{{ Position }} · {{ RelativeDate }}</span>
        </div>
      </button>
      <span class="practice-card__tag">{{ Item.isPB ? '🏅 PB' : '🎯 Training' }}</span>
    </header>

    <div class="practice-card__body">
      <div class="practice-card__icon" aria-hidden="true">{{ MetricIcon }}</div>
      <div class="practice-card__detail">
        <span class="practice-card__verb">{{ Item.isPB ? 'New personal best in' : 'Logged' }}</span>
        <span class="practice-card__drill">{{ Item.drill.name }}</span>
        <span class="practice-card__value">{{ Item.valueText }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import ProBadge from './ProBadge.vue'
import { metricTypeLabel } from '../../lib/practiceFormat'

const Props = defineProps({
  Item: { type: Object, required: true },
  Index: { type: Number, default: 0 }
})
const emit = defineEmits(['view-profile'])

const profile = computed(() => Props.Item.profile || {})
const DisplayName = computed(() => profile.value.player_name || 'Player')
const Position = computed(() => profile.value.position || 'Player')
const IsAuthorPro = computed(() => {
  const t = profile.value.subscription_tier
  return t && t !== 'free'
})
const Initials = computed(() => (DisplayName.value || '?').substring(0, 2).toUpperCase())

const MetricIcon = computed(() => {
  switch (Props.Item.drill?.metric_type) {
    case 'shot_map': return '🥅'
    case 'time': return '⏱️'
    case 'distance': return '📏'
    case 'speed': return '⚡'
    case 'ratio': return '🎯'
    default: return '⚽'
  }
})

const RelativeDate = computed(() => {
  const d = Props.Item.date
  if (!d) return ''
  const date = new Date(`${d}T00:00:00`)
  const days = Math.round((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

const EntranceStyle = computed(() => ({ animationDelay: `${Math.min(Props.Index, 8) * 60}ms` }))
// metricTypeLabel kept available for future detail expansion.
void metricTypeLabel
</script>

<style scoped>
.pitch-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  animation: card-rise 0.4s ease both;
}

.pitch-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.pitch-card__author {
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  min-width: 0;
}

.pitch-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  flex: 0 0 auto;
}

.pitch-card__identity { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pitch-card__namerow { display: inline-flex; align-items: center; gap: 6px; }
.pitch-card__name { font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.pitch-card__meta { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.practice-card__tag {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-border);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.practice-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.practice-card__icon {
  font-size: 1.8rem;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-3);
  border-radius: var(--radius-md);
}

.practice-card__detail { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.practice-card__verb { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.practice-card__drill { font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.practice-card__value { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-accent); }

@keyframes card-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
