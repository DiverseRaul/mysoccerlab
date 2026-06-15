<template>
  <div class="match-timeline" data-testid="match-timeline">
    <div class="match-timeline__head">
      <h4 class="match-timeline__title">Timeline</h4>
      <span class="match-timeline__count">{{ Events.length }}</span>
    </div>

    <p v-if="!Events.length" class="match-timeline__empty">No events logged yet.</p>

    <ul v-else class="match-timeline__list">
      <li
        v-for="Event in Events"
        :key="`${Event.kind}-${Event.id}`"
        class="match-timeline__row"
        :class="`match-timeline__row--${Event.category}`"
        data-testid="timeline-row"
      >
        <span class="match-timeline__dot"></span>
        <span class="match-timeline__label">{{ Event.label }}</span>
        <span v-if="Event.xg != null" class="match-timeline__xg" :title="`Expected goals: ${Event.xg.toFixed(2)}`">xG {{ Event.xg.toFixed(2) }}</span>
        <button
          type="button"
          class="match-timeline__undo"
          :aria-label="`Remove ${Event.label}`"
          data-testid="timeline-undo"
          @click="Emit('delete', Event)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" /></svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  Events: { type: Array, default: () => [] }
})
const Emit = defineEmits(['delete'])
</script>

<style scoped>
.match-timeline {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.match-timeline__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.match-timeline__title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.match-timeline__count {
  min-width: 22px;
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.match-timeline__empty {
  margin: 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-sm);
}

.match-timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}

.match-timeline__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 10px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-left: 3px solid var(--color-neutral);
  border-radius: var(--radius-md);
}

.match-timeline__row--positive { border-left-color: var(--color-success); }
.match-timeline__row--defensive { border-left-color: var(--color-info); }
.match-timeline__row--negative { border-left-color: var(--color-danger); }
.match-timeline__row--neutral { border-left-color: var(--color-neutral); }

.match-timeline__dot { display: none; }

.match-timeline__label {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-timeline__xg {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.match-timeline__undo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.match-timeline__undo:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.match-timeline__undo svg { width: 16px; height: 16px; }
</style>
