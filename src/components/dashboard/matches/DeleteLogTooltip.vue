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
      <i class="ph ph-trash" style="font-size:14px" aria-hidden="true"></i>
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
