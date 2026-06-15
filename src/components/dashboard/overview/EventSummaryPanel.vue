<template>
  <div class="event-summary" data-testid="event-summary-panel">
    <p class="event-summary__title">Match Summary</p>
    <div class="event-summary__grid">
      <div
        v-for="Item in Items"
        :key="Item.Key"
        class="event-summary__tile"
        :class="`event-summary__tile--${Item.Category}`"
      >
        <span class="event-summary__value" :data-testid="`event-summary-${Item.Key}`">{{ Item.Value }}</span>
        <span class="event-summary__label">{{ Item.Label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const Props = defineProps({
  ActiveMatch: { type: Object, default: () => ({}) },
  GoalCount: { type: Number, default: 0 },
  ShotCount: { type: Number, default: 0 },
  IsGoalkeeperMode: { type: Boolean, default: false },
  GoalkeeperStats: { type: Object, default: null }
})

const Read = (Key) => Props.ActiveMatch?.[Key] || 0
const ReadGk = (Key) => Props.GoalkeeperStats?.[Key] || 0

const Items = computed(() => {
  const Base = [
    { Key: 'goals', Label: 'Goals', Category: 'positive', Value: Props.GoalCount },
    { Key: 'assists', Label: 'Assists', Category: 'positive', Value: Read('assists') },
    { Key: 'shots', Label: 'Shots', Category: 'neutral', Value: Props.ShotCount },
    { Key: 'successful_passes', Label: 'Passes', Category: 'positive', Value: Read('successful_passes') },
    { Key: 'unsuccessful_passes', Label: 'Bad Passes', Category: 'negative', Value: Read('unsuccessful_passes') },
    { Key: 'dribbles', Label: 'Dribbles', Category: 'positive', Value: Read('dribbles') },
    { Key: 'created_chances', Label: 'Chances', Category: 'positive', Value: Read('created_chances') },
    { Key: 'tackles', Label: 'Tackles', Category: 'defensive', Value: Read('tackles') },
    { Key: 'interceptions', Label: 'Interceptions', Category: 'defensive', Value: Read('interceptions') },
    { Key: 'clearances', Label: 'Clearances', Category: 'defensive', Value: Read('clearances') },
    { Key: 'fouls', Label: 'Fouls', Category: 'negative', Value: Read('fouls') }
  ]

  if (Props.IsGoalkeeperMode) {
    Base.push(
      { Key: 'saves', Label: 'Saves', Category: 'defensive', Value: ReadGk('saves') },
      { Key: 'catches', Label: 'Catches', Category: 'defensive', Value: ReadGk('catches') },
      { Key: 'punches', Label: 'Punches', Category: 'defensive', Value: ReadGk('punches') },
      { Key: 'penalties_saved', Label: 'Pens Saved', Category: 'positive', Value: ReadGk('penalties_saved') }
    )
  }

  return Base
})
</script>

<style scoped>
.event-summary {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.event-summary__title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-summary__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: var(--space-2);
}

.event-summary__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-top: 2px solid var(--color-neutral);
}

.event-summary__tile--positive { border-top-color: var(--color-success); }
.event-summary__tile--defensive { border-top-color: var(--color-info); }
.event-summary__tile--negative { border-top-color: var(--color-danger); }
.event-summary__tile--neutral { border-top-color: var(--color-neutral); }

.event-summary__value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.1;
}

.event-summary__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
