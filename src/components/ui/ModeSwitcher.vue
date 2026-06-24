<template>
  <div class="mode-switcher" role="tablist" aria-label="Dashboard mode" data-testid="mode-switcher">
    <button
      v-for="m in modes"
      :key="m.key"
      type="button"
      role="tab"
      class="mode-switcher__btn"
      :class="{ 'is-active': modelValue === m.key }"
      :aria-selected="modelValue === m.key"
      :data-testid="`mode-${m.key}`"
      @click="emit('update:modelValue', m.key)"
    >
      <span class="mode-switcher__label">{{ m.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: 'matches' }
})
const emit = defineEmits(['update:modelValue'])

const modes = [
  { key: 'matches', label: 'Matches', icon: '⚽' },
  { key: 'training', label: 'Training', icon: '🎯' }
]
</script>

<style scoped>
.mode-switcher {
  position: relative;
  display: inline-flex;
  padding: 4px;
  gap: 0;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
}

/* Lighter (accent-soft) pill with a green border that slides between modes. */
.mode-switcher::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-accent-border);
  transition: transform 0.42s cubic-bezier(0.5, 1.5, 0.4, 1);
  z-index: 0;
}
.mode-switcher:has(.mode-switcher__btn:last-of-type.is-active)::before {
  transform: translateX(100%);
}

.mode-switcher__btn {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 92px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: var(--font-weight-semibold);
  padding: 15px 36px;
  min-height: 54px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.25s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
}

@media (hover: hover) {
  .mode-switcher__btn:not(.is-active):hover { color: var(--color-text-secondary); }
}

.mode-switcher__btn:active { transform: scale(0.93); }

.mode-switcher__btn.is-active {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .mode-switcher { display: flex; width: 100%; }
  .mode-switcher__btn { flex: 1; justify-content: center; }
}
</style>
