<template>
  <div v-if="modelValue && match" class="modal-overlay" @click.self="close">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Delete Match</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p>
          Are you sure you want to delete this match against
          <strong>{{ match.opponent }}</strong>?
        </p>
        <p class="warning-text">
          This action cannot be undone and will delete all match data including goals, shots, and statistics.
        </p>
        <div class="modal-buttons">
          <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="$emit('confirm')" class="btn btn-danger">Delete Match</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-field);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-3);
}

.warning-text {
  color: var(--color-warning) !important;
  font-size: var(--font-size-xs) !important;
  font-style: italic;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.btn {
  padding: 10px var(--space-5);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: background 0.2s ease, transform 0.15s ease;
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
}

.btn-danger:hover {
  background: #d43f3a;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-soft);
}

.btn-secondary:hover {
  background: var(--color-bg-surface-3);
}
</style>
