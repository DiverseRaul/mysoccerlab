<template>
  <div class="quick-log" data-testid="quick-log-controls">
    <p class="quick-log__title">Off-pitch events</p>
    <div class="quick-log__grid">
      <div
        v-for="Control in Controls"
        :key="Control.Stat"
        class="quick-log__group"
      >
        <span class="quick-log__label">{{ Control.Label }}</span>
        <div class="quick-log__buttons">
          <button
            type="button"
            class="quick-log__btn quick-log__btn--minus"
            :aria-label="`Decrease ${Control.Label}`"
            @click="Change(Control, -1)"
          >−</button>
          <span class="quick-log__value" :data-testid="`quick-log-${Control.Stat}`">{{ Control.Value }}</span>
          <button
            type="button"
            class="quick-log__btn quick-log__btn--plus"
            :aria-label="`Increase ${Control.Label}`"
            @click="Change(Control, 1)"
          >+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const Props = defineProps({
  ActiveMatch: { type: Object, default: () => ({}) },
  IsGoalkeeperMode: { type: Boolean, default: false },
  GoalkeeperStats: { type: Object, default: null }
})

const Emit = defineEmits(['Increment', 'IncrementGk'])

const Read = (Key) => Props.ActiveMatch?.[Key] || 0
const ReadGk = (Key) => Props.GoalkeeperStats?.[Key] || 0

const Controls = computed(() => {
  const List = [
    { Stat: 'score_for', Label: 'Our Goal', Source: 'match', Value: Read('score_for') },
    { Stat: 'score_against', Label: 'Their Goal', Source: 'match', Value: Read('score_against') },
    { Stat: 'own_goals', Label: 'Own Goal', Source: 'match', Value: Read('own_goals') },
    { Stat: 'yellow_card', Label: 'Yellow Card', Source: 'match', Value: Read('yellow_card') },
    { Stat: 'red_card', Label: 'Red Card', Source: 'match', Value: Read('red_card') }
  ]

  if (Props.IsGoalkeeperMode) {
    List.push(
      { Stat: 'saves', Label: 'Saves', Source: 'gk', Value: ReadGk('saves') },
      { Stat: 'catches', Label: 'Catches', Source: 'gk', Value: ReadGk('catches') },
      { Stat: 'punches', Label: 'Punches', Source: 'gk', Value: ReadGk('punches') },
      { Stat: 'penalties_saved', Label: 'Pens Saved', Source: 'gk', Value: ReadGk('penalties_saved') },
      { Stat: 'errors_led_to_goal', Label: 'Error → Goal', Source: 'gk', Value: ReadGk('errors_led_to_goal') }
    )
  }

  return List
})

const Change = (Control, Delta) => {
  if (Control.Source === 'gk') Emit('IncrementGk', { Stat: Control.Stat, Delta })
  else Emit('Increment', { Stat: Control.Stat, Delta })
}
</script>

<style scoped>
.quick-log {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.quick-log__title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-log__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-3);
}

.quick-log__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
}

.quick-log__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}

.quick-log__buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.quick-log__btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.quick-log__btn--plus:hover {
  background: var(--color-success-bg);
  border-color: var(--color-accent-border);
  color: var(--color-success);
}

.quick-log__btn--minus:hover {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.quick-log__value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  min-width: 24px;
  text-align: center;
}
</style>
