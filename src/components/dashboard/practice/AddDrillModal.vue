<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal" @click.stop data-testid="practice-add-drill-modal">
      <div class="modal-header">
        <h3>Add new drill</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>What are you tracking?</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. Shots outside the box"
            data-testid="drill-name-input"
          />
        </div>

        <div class="form-group">
          <label>How do you want to measure it?</label>
          <select v-model="form.metric_type" required data-testid="drill-type-input">
            <option v-for="t in METRIC_TYPES" :key="t" :value="t">
              {{ metricTypeLabel(t) }}
            </option>
          </select>
          <p class="helper">{{ metricTypeDescription(form.metric_type) }}</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Unit</label>
            <input
              v-model="form.unit"
              type="text"
              :placeholder="unitPlaceholder"
              data-testid="drill-unit-input"
            />
          </div>
          <div class="form-group">
            <label>{{ targetLabel(form.metric_type) }}</label>
            <input
              v-model="form.target_value"
              type="number"
              step="any"
              :placeholder="targetPlaceholder"
            />
          </div>
        </div>

        <div class="form-group form-group--checkbox" v-if="form.metric_type === 'time'">
          <label>
            <input v-model="form.lower_is_better" type="checkbox" />
            Lower value is better (e.g. sprint times)
          </label>
        </div>

        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="form.notes" rows="2" placeholder="How you measure this drill, technique cues…"></textarea>
        </div>

        <div class="modal-buttons">
          <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary" data-testid="drill-submit-btn">Create drill</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import {
  METRIC_TYPES,
  metricTypeLabel,
  metricTypeDescription,
  targetLabel
} from '../../../lib/practiceFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Optional preset to pre-fill (used by the empty-state "starter drills").
  initialValue: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const blankForm = () => ({
  name: '',
  metric_type: 'count',
  unit: '',
  lower_is_better: false,
  target_value: '',
  notes: ''
})

const form = ref(blankForm())

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = { ...blankForm(), ...(props.initialValue || {}) }
  }
})

watch(() => form.value.metric_type, (t) => {
  if (t !== 'time') form.value.lower_is_better = false
})

const unitPlaceholder = computed(() => {
  switch (form.value.metric_type) {
    case 'count':    return 'juggles, reps…'
    case 'ratio':    return 'shots, passes…'
    case 'time':     return 's'
    case 'distance': return 'm'
    case 'speed':    return 'km/h'
    case 'shot_map': return 'shots'
    default:         return ''
  }
})

const targetPlaceholder = computed(() => {
  switch (form.value.metric_type) {
    case 'count':    return 'e.g. 100'
    case 'ratio':
    case 'shot_map': return 'e.g. 80'
    case 'time':     return 'e.g. 7.0'
    case 'distance': return 'e.g. 40'
    case 'speed':    return 'e.g. 30'
    default:         return ''
  }
})

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
