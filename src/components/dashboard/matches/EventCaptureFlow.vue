<template>
  <!-- Step 1: Field origin -->
  <div v-if="showFieldModal" class="modal-overlay" @click.self="cancel">
    <div class="modal modal--field" @click.stop>
      <div class="modal-header">
        <h3>{{ fieldContext === 'goal' ? 'Where was the goal scored from?' : 'Where was the shot taken from?' }}</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-instruction">Tap a spot on the field</p>
        <ShotField
          mode="origin"
          interactive
          :show-placeholder="false"
          @field-click="onFieldClick"
        />
        <div class="modal-footer">
          <button @click="skipField" class="btn btn-ghost">Skip</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 2 (shot only): Outcome -->
  <div v-if="showOutcomeModal" class="modal-overlay" @click.self="cancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Shot Outcome</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="option-grid">
          <button @click="onShotOnTarget" class="option-btn option-btn--success">
            <span class="option-icon">🎯</span>
            <span>On Target</span>
          </button>
          <button @click="onShotOffTarget" class="option-btn option-btn--danger">
            <span class="option-icon">❌</span>
            <span>Off Target</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 3: Quadrant placement (on-target shots and goals) -->
  <div v-if="showQuadrantModal" class="modal-overlay" @click.self="cancel">
    <div class="modal modal--placement" @click.stop>
      <div class="modal-header">
        <h3>Where in the goal?</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-instruction">Tap the spot in the goal</p>
        <ShotField
          mode="placement"
          interactive
          :show-placeholder="false"
          @quadrant-select="onQuadrantSelect"
        />
      </div>
    </div>
  </div>

  <!-- Step 4 (goal only): Goal type -->
  <div v-if="showGoalTypeModal" class="modal-overlay" @click.self="cancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Goal Type</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="option-grid option-grid--triple">
          <button
            v-for="type in goalTypes"
            :key="type"
            @click="onGoalType(type)"
            class="option-btn"
          >
            <span>{{ type }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ShotField from '../../ui/ShotField.vue'

const emit = defineEmits(['shot-captured', 'goal-captured'])

const goalTypes = ['Normal', 'Freekick', 'Penalty', 'Long Shot', 'Header', 'Tap-in']

const showFieldModal = ref(false)
const showOutcomeModal = ref(false)
const showQuadrantModal = ref(false)
const showGoalTypeModal = ref(false)

const fieldContext = ref('shot') // 'shot' | 'goal'
const pendingFieldPosition = ref(null)
const pendingQuadrant = ref(null)

// ── Public API (called by parent via template ref) ──────────
const triggerShot = () => {
  reset()
  fieldContext.value = 'shot'
  showFieldModal.value = true
}

const triggerGoal = () => {
  reset()
  fieldContext.value = 'goal'
  showFieldModal.value = true
}

defineExpose({ triggerShot, triggerGoal })

// ── Internal flow control ───────────────────────────────────
const reset = () => {
  showFieldModal.value = false
  showOutcomeModal.value = false
  showQuadrantModal.value = false
  showGoalTypeModal.value = false
  pendingFieldPosition.value = null
  pendingQuadrant.value = null
}

const cancel = () => reset()

const onFieldClick = ({ xPct, yPct }) => {
  pendingFieldPosition.value = `${Math.round(xPct)},${Math.round(yPct)}`
  showFieldModal.value = false
  if (fieldContext.value === 'shot') showOutcomeModal.value = true
  else showQuadrantModal.value = true
}

const skipField = () => {
  pendingFieldPosition.value = null
  showFieldModal.value = false
  if (fieldContext.value === 'shot') showOutcomeModal.value = true
  else showQuadrantModal.value = true
}

const onShotOnTarget = () => {
  showOutcomeModal.value = false
  showQuadrantModal.value = true
}

const onShotOffTarget = () => {
  emit('shot-captured', {
    onTarget: false,
    quadrant: null,
    fieldPosition: pendingFieldPosition.value
  })
  reset()
}

const onQuadrantSelect = (q) => {
  pendingQuadrant.value = q
  showQuadrantModal.value = false
  if (fieldContext.value === 'shot') {
    emit('shot-captured', {
      onTarget: true,
      quadrant: q,
      fieldPosition: pendingFieldPosition.value
    })
    reset()
  } else {
    showGoalTypeModal.value = true
  }
}

const onGoalType = (type) => {
  emit('goal-captured', {
    goalType: type,
    quadrant: pendingQuadrant.value,
    fieldPosition: pendingFieldPosition.value
  })
  reset()
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
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: var(--color-bg-field);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-lg);
  animation: slide-up 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.modal--field {
  max-width: 520px;
}

.modal--placement {
  max-width: 460px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  gap: var(--space-3);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease, background 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-surface-2);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modal-instruction {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.option-grid--triple {
  grid-template-columns: repeat(3, 1fr);
}

.option-btn {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
  font-family: inherit;
}

.option-btn:hover {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}

.option-btn--success:hover {
  background: var(--color-success-bg);
  border-color: var(--color-accent-border);
}

.option-btn--danger:hover {
  background: var(--color-danger-bg);
  border-color: rgba(239, 83, 80, 0.4);
}

.option-icon {
  font-size: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
}

.btn:hover {
  background: var(--color-bg-surface-3);
  border-color: var(--color-border-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}

@media (max-width: 480px) {
  .modal {
    padding: var(--space-4);
  }

  .option-grid--triple {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
