<template>
  <div
    class="scrollable-tabs"
    data-testid="scrollable-tabs"
    :style="{ '--tab-count': TabItems.length, '--tab-index': activeIndex }"
  >
    <!-- Sliding accent pill that travels to the active tab (works for any tab
         count — width is 1/N, translated by the active index). -->
    <span class="scrollable-tabs__indicator" aria-hidden="true"></span>
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
import { computed } from 'vue'

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

const activeIndex = computed(() => {
  const i = Props.TabItems.findIndex((t) => t.Key === Props.ActiveKey)
  return i < 0 ? 0 : i
})

const HandleSelect = (Key) => {
  if (Key !== Props.ActiveKey) Emit('select', Key)
}
</script>

<style scoped>
.scrollable-tabs {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  padding: var(--space-1);
  background: var(--color-bg-surface-2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  scrollbar-width: none;
}

.scrollable-tabs::-webkit-scrollbar {
  display: none;
}

/* Lighter (accent-soft) pill with a green border that slides between tabs. */
.scrollable-tabs__indicator {
  position: absolute;
  top: var(--space-1);
  bottom: var(--space-1);
  left: var(--space-1);
  width: calc((100% - 2 * var(--space-1)) / var(--tab-count));
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-accent-border);
  transform: translateX(calc(var(--tab-index) * 100%));
  transition: transform 0.42s cubic-bezier(0.5, 1.5, 0.4, 1);
  z-index: 0;
  pointer-events: none;
}

.scrollable-tabs__pill {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 15px 36px;
  min-height: 54px;
  font-size: 1.0625rem;
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  cursor: pointer;
  border-radius: var(--radius-pill);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.25s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (hover: hover) {
  .scrollable-tabs__pill:not(.is-active):hover {
    color: var(--color-text-secondary);
  }
}

/* Snappy press feedback. */
.scrollable-tabs__pill:active { transform: scale(0.94); }

.scrollable-tabs__pill.is-active {
  color: var(--color-accent);
}
</style>
