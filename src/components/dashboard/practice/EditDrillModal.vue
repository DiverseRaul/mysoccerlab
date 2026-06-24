<template>
  <Teleport to="body">
  <div v-if="modelValue && drill" class="modal-overlay" @click.self="close">
    <div class="modal" @click.stop data-testid="practice-edit-drill-modal">
      <div class="modal-header">
        <h3>Edit drill</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Drill name</label>
          <input v-model="form.name" type="text" required />
        </div>

        <div class="form-group">
          <label>How is it measured?</label>
          <select v-model="form.metric_type" required>
            <option v-for="t in METRIC_TYPES" :key="t" :value="t">{{ metricTypeLabel(t) }}</option>
          </select>
          <p class="helper">{{ metricTypeDescription(form.metric_type) }}</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Unit</label>
            <input v-model="form.unit" type="text" />
          </div>
          <div class="form-group">
            <label>{{ targetLabel(form.metric_type) }}</label>
            <input v-model="form.target_value" type="number" step="any" />
          </div>
        </div>

        <div class="form-group form-group--checkbox" v-if="form.metric_type === 'time'">
          <label>
            <input v-model="form.lower_is_better" type="checkbox" />
            Lower value is better
          </label>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>

        <div class="modal-buttons">
          <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  METRIC_TYPES,
  metricTypeLabel,
  metricTypeDescription,
  targetLabel
} from '../../../lib/practiceFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  drill: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
  name: '',
  metric_type: 'count',
  unit: '',
  lower_is_better: false,
  target_value: '',
  notes: ''
})

watch(() => [props.modelValue, props.drill], ([open, drill]) => {
  if (open && drill) {
    form.value = {
      name: drill.name || '',
      metric_type: drill.metric_type || 'count',
      unit: drill.unit || '',
      lower_is_better: !!drill.lower_is_better,
      target_value: drill.target_value ?? '',
      notes: drill.notes || ''
    }
  }
}, { immediate: true })

const close = () => emit('update:modelValue', false)
const submit = () => emit('submit', { ...form.value })
</script>

<style scoped>
@import './modal-shared.css';

.helper {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}
</style>
