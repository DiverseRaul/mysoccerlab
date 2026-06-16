<template>
  <div class="scrollable-tabs" data-testid="scrollable-tabs">
    <button
      v-for="Tab in TabItems"
      :key="Tab.Key"
      type="button"
      class="scrollable-tabs__pill"
      :class="{ 'is-active': Tab.Key === ActiveKey }"
      @click="HandleSelect(Tab.Key)"
    >
      {{ Tab.Label }}
    </button>
  </div>
</template>

<script setup>
const Props = defineProps({
  TabItems: {
    type: Array,
    required: true
  },
  ActiveKey: {
    type: String,
    default: ''
  }
})

const Emit = defineEmits(['select'])

const HandleSelect = (Key) => {
  if (Key !== Props.ActiveKey) Emit('select', Key)
}
</script>

<style scoped>
.scrollable-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-2);
  padding: var(--space-1);
  background: var(--color-bg-surface-2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.scrollable-tabs::-webkit-scrollbar {
  display: none;
}

.scrollable-tabs__pill {
  flex: 1 1 auto;
  min-width: max-content;
  white-space: nowrap;
  text-align: center;
  scroll-snap-align: start;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 12px 22px;
  min-height: 44px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  border-radius: var(--radius-pill);
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.scrollable-tabs__pill:hover {
  color: var(--color-text-secondary);
  background: var(--color-bg-surface-3);
}

.scrollable-tabs__pill.is-active {
  background: var(--color-brand);
  color: var(--color-brand-fg);
  box-shadow: 0 2px 12px color-mix(in srgb, var(--color-accent-deep) 30%, transparent);
}
</style>
