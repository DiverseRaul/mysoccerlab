<template>
  <div v-if="modelValue && drill" class="modal-overlay" @click.self="close">
    <div
      class="modal"
      :class="{ 'modal--shot-map': isShotMap, 'modal--mobile-full': isShotMap }"
      @click.stop
      data-testid="practice-log-session-modal"
    >
      <div class="modal-header">
        <h3>{{ isShotMap ? 'Log shots' : 'Log session' }} — {{ drill.name }}</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>

      <form @submit.prevent="submit">
        <div class="form-group form-group--inline">
          <label>Date</label>
          <input v-model="form.session_date" type="date" required class="date-input" />
        </div>

        <!-- shot_map: placements are the primary mode; manual mode is a fallback -->
        <template v-if="isShotMap">
          <PracticeGoalMap
            :placements="placements"
            :interactive="true"
            :next-outcome="nextOutcome"
            :next-foot="nextFoot"
            @add-placement="onAddPlacement"
            @remove-placement="onRemovePlacement"
            @undo="onUndo"
            @update:nextOutcome="nextOutcome = $event"
            @update:nextFoot="nextFoot = $event"
          />

          <p class="derived-hint">
            <strong>{{ derivedGoals }}</strong> goals · <strong>{{ placements.length }}</strong> total ·
            <strong>{{ derivedAccuracy }}%</strong> accuracy
          </p>

          <button
            type="button"
            class="link-toggle"
            @click="manualMode = !manualMode"
            data-testid="manual-mode-toggle"
          >
            {{ manualMode ? '← Use the goal map instead' : 'Skip the map — just type the numbers' }}
          </button>

          <div v-if="manualMode" class="form-row">
            <div class="form-group">
              <label>Goals</label>
              <input
                v-model="form.primary_value"
                type="number"
                step="any"
                min="0"
                required
                inputmode="numeric"
                data-testid="session-primary-input"
              />
            </div>
            <div class="form-group">
              <label>Total shots</label>
              <input
                v-model="form.secondary_value"
                type="number"
                step="any"
                min="0.0001"
                required
                inputmode="numeric"
                data-testid="session-secondary-input"
              />
            </div>
          </div>
        </template>

        <!-- ratio (no map) -->
        <div v-else-if="drill.metric_type === 'ratio'" class="form-row">
          <div class="form-group">
            <label>Made</label>
            <input
              v-model="form.primary_value"
              type="number"
              step="any"
              required
              inputmode="numeric"
              data-testid="session-primary-input"
            />
          </div>
          <div class="form-group">
            <label>Attempted</label>
            <input
              v-model="form.secondary_value"
              type="number"
              step="any"
              required
              min="0.0001"
              inputmode="numeric"
              data-testid="session-secondary-input"
            />
          </div>
        </div>

        <!-- single-value drills -->
        <div v-else class="form-group">
          <label>{{ primaryLabel }}{{ drill.unit ? ` (${drill.unit})` : '' }}</label>
          <input
            v-model="form.primary_value"
            type="number"
            step="any"
            required
            inputmode="decimal"
            data-testid="session-primary-input"
          />
        </div>

        <!-- Notes: collapsed by default to save vertical space on mobile -->
        <details class="notes-details">
          <summary>Add notes (optional)</summary>
          <textarea v-model="form.notes" rows="2" placeholder="Conditions, technique cues, anything worth remembering…"></textarea>
        </details>

        <div class="modal-buttons">
          <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitDisabled"
            data-testid="session-submit-btn"
          >Log session</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import PracticeGoalMap from './PracticeGoalMap.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  drill: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const blankForm = () => ({
  session_date: new Date().toISOString().split('T')[0],
  primary_value: '',
  secondary_value: '',
  notes: ''
})

const form = ref(blankForm())
const manualMode = ref(false)
const placements = ref([])
const nextOutcome = ref('goal')
const nextFoot = ref(null)

const isShotMap = computed(() => props.drill?.metric_type === 'shot_map')

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = blankForm()
    manualMode.value = false
    placements.value = []
    nextOutcome.value = 'goal'
    nextFoot.value = null
  }
})

const primaryLabel = computed(() => {
  if (!props.drill) return 'Value'
  switch (props.drill.metric_type) {
    case 'count':    return 'Count'
    case 'time':     return 'Time'
    case 'distance': return 'Distance'
    case 'speed':    return 'Speed'
    default:         return 'Value'
  }
})

const derivedGoals = computed(() => placements.value.filter(p => p.outcome === 'goal').length)
const derivedAccuracy = computed(() => {
  if (placements.value.length === 0) return 0
  return Math.round((derivedGoals.value / placements.value.length) * 100)
})

const submitDisabled = computed(() => {
  if (isShotMap.value && !manualMode.value) {
    return placements.value.length === 0
  }
  return false
})

const onAddPlacement = (p) => {
  placements.value = [...placements.value, p]
}

const onRemovePlacement = ({ idx }) => {
  placements.value = placements.value.filter((_, i) => i !== idx)
}

const onUndo = () => {
  if (placements.value.length === 0) return
  placements.value = placements.value.slice(0, -1)
}

const close = () => emit('update:modelValue', false)

const submit = () => {
  const payload = { ...form.value }
  if (isShotMap.value && !manualMode.value) {
    payload.primary_value = derivedGoals.value
    payload.secondary_value = placements.value.length
    payload.placements = placements.value.map(p => ({
      x_pct: p.x_pct,
      y_pct: p.y_pct,
      outcome: p.outcome,
      foot: p.foot ?? null
    }))
  }
  emit('submit', payload)
}
</script>

<style scoped>
@import './modal-shared.css';

.modal--shot-map { max-width: 620px; }

/* Save room for the canvas: the date + accuracy line + map fill the screen. */
.form-group--inline {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.form-group--inline label {
  margin: 0;
  min-width: 48px;
}
.date-input {
  flex: 1;
  max-width: 200px;
  width: auto;
}

.derived-hint {
  margin: var(--space-3) 0;
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
}

.derived-hint strong { color: var(--color-accent); font-weight: var(--font-weight-bold); font-size: var(--font-size-base); }

.link-toggle {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: 8px;
  text-decoration: underline;
  margin: 0 0 var(--space-3);
  width: 100%;
  text-align: center;
  font-family: inherit;
}
.link-toggle:hover { color: var(--color-accent); }

.notes-details {
  margin: 0 0 var(--space-3);
}
.notes-details summary {
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: 6px 0;
  user-select: none;
}
.notes-details summary:hover { color: var(--color-text-primary); }
.notes-details[open] summary { margin-bottom: var(--space-2); color: var(--color-text-primary); }
.notes-details textarea {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  box-sizing: border-box;
  resize: vertical;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Mobile: take the whole screen so the canvas + controls have room. */
@media (max-width: 600px) {
  .modal--mobile-full {
    max-width: 100vw;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    padding: var(--space-3);
  }

  .modal--mobile-full .modal-header {
    margin-bottom: var(--space-3);
  }

  .modal-overlay { padding: 0; }
}
</style>
