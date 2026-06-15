<template>
  <div class="delete-log-tooltip" data-testid="delete-log-tooltip" @click.stop>
    <span class="delete-log-tooltip__label">{{ Label }}</span>
    <button
      type="button"
      class="delete-log-tooltip__button"
      data-testid="delete-log-button"
      aria-label="Delete this event"
      @click="Emit('Delete')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
      </svg>
      <span>Delete</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  Label: { type: String, default: 'Event' }
})

const Emit = defineEmits(['Delete'])
</script>

<style scoped>
.delete-log-tooltip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 8px 6px 12px;
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-lg);
  white-space: nowrap;
  animation: delete-log-pop 0.14s ease-out;
}

@keyframes delete-log-pop {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.delete-log-tooltip__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.delete-log-tooltip__button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.15s ease;
}

.delete-log-tooltip__button:hover {
  background: var(--color-danger);
  color: #fff;
}
</style>
