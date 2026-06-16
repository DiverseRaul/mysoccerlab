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
      <span class="mode-switcher__icon" aria-hidden="true">{{ m.icon }}</span>
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
  display: inline-flex;
  padding: 4px;
  gap: 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}

.mode-switcher__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: 8px var(--space-5);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.mode-switcher__btn:hover { color: var(--color-text-primary); }

.mode-switcher__btn.is-active {
  background: var(--color-brand);
  color: var(--color-brand-fg);
  box-shadow: 0 2px 12px color-mix(in srgb, var(--color-accent-deep) 30%, transparent);
}

.mode-switcher__icon { font-size: 1rem; }

@media (max-width: 768px) {
  .mode-switcher { display: flex; width: 100%; }
  .mode-switcher__btn { flex: 1; justify-content: center; }
}
</style>
