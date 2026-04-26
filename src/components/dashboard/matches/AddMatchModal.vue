<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Add New Match</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Opponent</label>
          <input v-model="form.opponent" type="text" required />
        </div>
        <div class="form-group">
          <label>Date</label>
          <input v-model="form.match_date" type="date" required />
        </div>
        <div class="form-group">
          <label>Position Played</label>
          <select v-model="form.position_played" required>
            <option disabled value="">Please select one</option>
            <option v-for="position in positions" :key="position" :value="position">
              {{ position }}
            </option>
          </select>
        </div>
        <div class="modal-buttons">
          <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Match</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const POSITIONS = [
  'Goalkeeper',
  'Center-Back',
  'Full-Back',
  'Wing-Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Winger',
  'Striker',
  'Center-Forward'
]

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const positions = POSITIONS

const blankForm = () => ({
  opponent: '',
  match_date: new Date().toISOString().split('T')[0],
  position_played: ''
})

const form = ref(blankForm())

watch(() => props.modelValue, (open) => {
  if (open) form.value = blankForm()
})

const close = () => emit('update:modelValue', false)

const submit = () => {
  emit('submit', { ...form.value })
}
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

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-accent-border);
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

.btn-primary {
  background: var(--color-accent);
  color: var(--color-bg-page);
}

.btn-primary:hover {
  background: #3cb885;
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
