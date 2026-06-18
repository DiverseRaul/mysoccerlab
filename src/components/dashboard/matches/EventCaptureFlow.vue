<template>
  <!-- Step 1: Field origin -->
  <div v-if="showFieldModal" class="modal-overlay" @click.self="cancel">
    <div class="modal modal--field" @click.stop>
      <div class="modal-header">
        <h3>{{ fieldTitle }}</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-instruction">Tap a spot on the {{ fieldContext === 'event' ? 'pitch' : 'field' }}</p>
        <TacticalHeatmapField
          v-if="fieldContext === 'event'"
          :Interactive="true"
          :ShowControls="false"
          :Points="[]"
          @AddPoint="onEventFieldTap"
        />
        <ShotField
          v-else
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
        <div class="modal-footer">
          <button @click="skipOutcome" class="btn btn-ghost">Skip</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 3: Free placement (on-target shots and goals) -->
  <div v-if="showQuadrantModal" class="modal-overlay" @click.self="cancel">
    <div class="modal modal--placement" @click.stop>
      <div class="modal-header">
        <h3>Where in the goal?</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-instruction">Tap the exact spot the ball crossed the line</p>
        <ShotField
          mode="placement"
          interactive
          free-placement
          :show-placeholder="false"
          @placement-select="onPlacementSelect"
        />
        <div class="modal-footer">
          <button @click="skipQuadrant" class="btn btn-ghost">Skip</button>
        </div>
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
        <div class="modal-footer">
          <button @click="skipGoalType" class="btn btn-ghost">Skip</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Pass / chance: destination (draw the ball) -->
  <div v-if="showPassDestModal" class="modal-overlay" @click.self="cancel">
    <div class="modal modal--field" @click.stop>
      <div class="modal-header">
        <h3>{{ fieldContext === 'chance' ? 'Where did the chance go?' : fieldContext === 'assist' ? 'Where did the assist go?' : 'Where did the pass go?' }}</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-instruction">Tap the target — or skip to log it without a direction</p>
        <TacticalHeatmapField
          :Interactive="true"
          :ShowControls="false"
          :Points="passOriginPoints"
          @AddPoint="onPassDest"
        />
        <div class="modal-footer">
          <button @click="skipPassDest" class="btn btn-ghost">Skip</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Step (pass only): Pass quality -->
  <div v-if="showPassQualityModal" class="modal-overlay" @click.self="cancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Pass Outcome</h3>
        <button @click="cancel" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="option-grid">
          <button @click="choosePassQuality('good')" class="option-btn option-btn--success">
            <span class="option-icon">✅</span>
            <span>Good Pass</span>
          </button>
          <button @click="choosePassQuality('bad')" class="option-btn option-btn--danger">
            <span class="option-icon">❌</span>
            <span>Bad Pass</span>
          </button>
        </div>
        <div class="modal-footer">
          <button @click="choosePassQuality('good')" class="btn btn-ghost">Skip</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ParseFieldPosition } from '../../../lib/matchEvents'
import ShotField from '../../ui/ShotField.vue'
import TacticalHeatmapField from './TacticalHeatmapField.vue'

const emit = defineEmits(['shot-captured', 'goal-captured', 'event-captured'])

const goalTypes = ['Normal', 'Freekick', 'Penalty', 'Long Shot', 'Header', 'Tap-in']

const showFieldModal = ref(false)
const showOutcomeModal = ref(false)
const showQuadrantModal = ref(false)
const showGoalTypeModal = ref(false)
const showPassDestModal = ref(false)
const showPassQualityModal = ref(false)

const fieldContext = ref('shot') // 'shot' | 'goal' | 'event' | 'pass'
const pendingFieldPosition = ref(null)
const pendingQuadrant = ref(null)
const pendingPlacement = ref(null)
const pendingDestination = ref(null)
const pendingEventType = ref(null)
const pendingEventLabel = ref('')

// Origin marker shown on the destination field so the player can "draw" the pass.
const passOriginPoints = computed(() => {
  const Pos = ParseFieldPosition(pendingFieldPosition.value)
  if (!Pos) return []
  return [{ x_pct: Pos.XPct, y_pct: Pos.YPct, event_type: 'successful_passes' }]
})

// Derive a 1–9 quadrant from a free placement tap so quadrant-based views keep working.
const quadrantFromPlacement = (xPct, yPct) => {
  const col = Math.min(2, Math.max(0, Math.floor(xPct / (100 / 3))))
  const row = Math.min(2, Math.max(0, Math.floor(yPct / (100 / 3))))
  return row * 3 + col + 1
}

const fieldTitle = computed(() => {
  if (fieldContext.value === 'goal') return 'Where was the goal scored from?'
  if (fieldContext.value === 'event') return `Where did the ${pendingEventLabel.value.toLowerCase()} happen?`
  return 'Where was the shot taken from?'
})

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

const triggerEvent = (eventType, label) => {
  reset()
  fieldContext.value = 'event'
  pendingEventType.value = eventType
  pendingEventLabel.value = label || 'event'
  showFieldModal.value = true
}

const triggerFromMap = ({ context, eventType, label, fieldPosition }) => {
  reset()
  fieldContext.value = context
  pendingFieldPosition.value = fieldPosition || null
  pendingEventType.value = eventType || null
  pendingEventLabel.value = label || 'event'
  if (context === 'shot') showOutcomeModal.value = true
  else if (context === 'goal') showQuadrantModal.value = true
  else if (context === 'pass' || context === 'chance' || context === 'assist') showPassDestModal.value = true
}

defineExpose({ triggerShot, triggerGoal, triggerEvent, triggerFromMap })

// ── Internal flow control ───────────────────────────────────
const reset = () => {
  showFieldModal.value = false
  showOutcomeModal.value = false
  showQuadrantModal.value = false
  showGoalTypeModal.value = false
  showPassDestModal.value = false
  showPassQualityModal.value = false
  pendingFieldPosition.value = null
  pendingQuadrant.value = null
  pendingPlacement.value = null
  pendingDestination.value = null
  pendingEventType.value = null
  pendingEventLabel.value = ''
}

const cancel = () => reset()

const onFieldClick = ({ xPct, yPct }) => {
  pendingFieldPosition.value = `${Math.round(xPct)},${Math.round(yPct)}`
  if (fieldContext.value === 'event') {
    emit('event-captured', { eventType: pendingEventType.value, fieldPosition: pendingFieldPosition.value })
    reset()
    return
  }
  showFieldModal.value = false
  if (fieldContext.value === 'shot') showOutcomeModal.value = true
  else showQuadrantModal.value = true
}

const onEventFieldTap = ({ XPct, YPct }) => {
  const fieldPosition = `${Math.round(XPct)},${Math.round(YPct)}`
  emit('event-captured', { eventType: pendingEventType.value, fieldPosition })
  reset()
}

const skipField = () => {
  pendingFieldPosition.value = null
  if (fieldContext.value === 'event') {
    emit('event-captured', { eventType: pendingEventType.value, fieldPosition: null })
    reset()
    return
  }
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

const onPlacementSelect = ({ xPct, yPct }) => {
  const x = Math.round(xPct)
  const y = Math.round(yPct)
  pendingPlacement.value = `${x},${y}`
  pendingQuadrant.value = quadrantFromPlacement(x, y)
  showQuadrantModal.value = false
  if (fieldContext.value === 'shot') {
    emit('shot-captured', {
      onTarget: true,
      quadrant: pendingQuadrant.value,
      placement: pendingPlacement.value,
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
    placement: pendingPlacement.value,
    fieldPosition: pendingFieldPosition.value
  })
  reset()
}

const skipOutcome = () => {
  emit('shot-captured', {
    onTarget: null,
    quadrant: null,
    fieldPosition: pendingFieldPosition.value
  })
  reset()
}

const skipQuadrant = () => {
  if (fieldContext.value === 'shot') {
    emit('shot-captured', {
      onTarget: true,
      quadrant: null,
      fieldPosition: pendingFieldPosition.value
    })
    reset()
  } else {
    pendingQuadrant.value = null
    showQuadrantModal.value = false
    showGoalTypeModal.value = true
  }
}

const skipGoalType = () => {
  emit('goal-captured', {
    goalType: null,
    quadrant: pendingQuadrant.value,
    placement: pendingPlacement.value,
    fieldPosition: pendingFieldPosition.value
  })
  reset()
}

// A chance / assist is a pass with a destination but no good/bad step.
const emitChanceOrAssist = () => {
  emit('event-captured', {
    eventType: fieldContext.value === 'assist' ? 'assists' : 'created_chances',
    fieldPosition: pendingFieldPosition.value,
    destination: pendingDestination.value
  })
  reset()
}

const onPassDest = ({ XPct, YPct }) => {
  pendingDestination.value = `${Math.round(XPct)},${Math.round(YPct)}`
  showPassDestModal.value = false
  if (fieldContext.value === 'chance' || fieldContext.value === 'assist') emitChanceOrAssist()
  else showPassQualityModal.value = true
}

const skipPassDest = () => {
  pendingDestination.value = null
  showPassDestModal.value = false
  if (fieldContext.value === 'chance' || fieldContext.value === 'assist') emitChanceOrAssist()
  else showPassQualityModal.value = true
}

const choosePassQuality = (quality) => {
  emit('event-captured', {
    eventType: quality === 'bad' ? 'unsuccessful_passes' : 'successful_passes',
    fieldPosition: pendingFieldPosition.value,
    destination: pendingDestination.value
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
