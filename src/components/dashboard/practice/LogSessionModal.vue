<template>
  <Teleport to="body">
  <div v-if="modelValue && drill" class="modal-overlay" @click.self="close">
    <div
      class="modal modal--popup"
      :class="{ 'modal--shot-map': isShotMap }"
      @click.stop
      data-testid="practice-log-session-modal"
    >
      <button @click="close" class="ls-close" aria-label="Close">
        <i class="ph ph-x" style="font-size:18px" aria-hidden="true"></i>
      </button>

      <header class="ls-hero">
        <div class="ls-hero__icon" aria-hidden="true">{{ metricIcon }}</div>
        <div class="ls-hero__text">
          <span class="ls-hero__eyebrow">{{ titleText }}</span>
          <h3 class="ls-hero__title">{{ drill.name }}</h3>
          <span class="ls-hero__type">{{ metricTypeLabel(drill.metric_type) }}<template v-if="drill.unit"> · {{ drill.unit }}</template></span>
        </div>
      </header>

      <form @submit.prevent="submit">
        <div class="ls-date">
          <label for="ls-date-input">Session date</label>
          <input id="ls-date-input" v-model="form.session_date" type="date" required class="ls-date__input" />
        </div>

        <!-- shot_map: placements are the primary mode; manual mode is a fallback -->
        <template v-if="isShotMap">
          <PracticeGoalMap
            :placements="placements"
            :interactive="true"
            :show-counter="false"
            @add-placement="onAddPlacement"
            @remove-placement="onRemovePlacement"
            @undo="onUndo"
          />

          <div class="ls-stats">
            <div class="ls-stat"><span class="ls-stat__val">{{ placements.length }}</span><span class="ls-stat__lbl">Shots</span></div>
            <div class="ls-stat"><span class="ls-stat__val">{{ counts.goal }}</span><span class="ls-stat__lbl">Goals</span></div>
            <div class="ls-stat"><span class="ls-stat__val">{{ counts.post }}</span><span class="ls-stat__lbl">Posts</span></div>
            <div class="ls-stat"><span class="ls-stat__val">{{ counts.miss }}</span><span class="ls-stat__lbl">Misses</span></div>
            <div class="ls-stat"><span class="ls-stat__val">{{ counts.save }}</span><span class="ls-stat__lbl">Saves</span></div>
          </div>

          <!-- Live derived summary: goals from total shots (with accuracy). -->
          <p v-if="placements.length" class="derived-hint">
            {{ derivedGoals }} goal{{ derivedGoals === 1 ? '' : 's' }} from {{ placements.length }} shot{{ placements.length === 1 ? '' : 's' }} · {{ derivedAccuracy }}%
          </p>

          <!-- Timeline of placed shots — delete any individual one -->
          <ul v-if="placements.length" class="shot-list" data-testid="shot-timeline">
            <li v-for="(p, i) in placements" :key="i" class="shot-list__item">
              <span class="shot-list__dot" :class="`is-${p.outcome}`"></span>
              <span class="shot-list__label">#{{ i + 1 }} · {{ outcomeLabel(p.outcome) }}<span v-if="p.foot" class="shot-list__foot"> · {{ p.foot === 'left' ? 'Left' : 'Right' }}</span></span>
              <button type="button" class="shot-list__del" :data-testid="`shot-delete-${i}`" aria-label="Delete shot" @click="removeAt(i)">×</button>
            </li>
          </ul>

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
          >{{ isEditing ? 'Save changes' : 'Log session' }}</button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import PracticeGoalMap from './PracticeGoalMap.vue'
import { metricTypeLabel } from '../../../lib/practiceFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  drill: { type: Object, default: null },
  // When set, the modal edits this session instead of logging a new one.
  editSession: { type: Object, default: null },
  editPlacements: { type: Array, default: () => [] }
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

const isShotMap = computed(() => props.drill?.metric_type === 'shot_map')
const isEditing = computed(() => !!props.editSession)
const titleText = computed(() =>
  isEditing.value ? 'Edit session' : (isShotMap.value ? 'Log shots' : 'Log session')
)

const metricIcon = computed(() => ({
  shot_map: '⚽', time: '⏱️', distance: '📏', speed: '⚡', count: '🔢', ratio: '🎯'
}[props.drill?.metric_type] || '🎯'))

watch(() => props.modelValue, (open) => {
  if (!open) return
  manualMode.value = false
  if (props.editSession) {
    const s = props.editSession
    form.value = {
      session_date: s.session_date || new Date().toISOString().split('T')[0],
      primary_value: s.primary_value ?? '',
      secondary_value: s.secondary_value ?? '',
      notes: s.notes || ''
    }
    placements.value = (props.editPlacements || []).map((p) => ({
      x_pct: p.x_pct, y_pct: p.y_pct, outcome: p.outcome, foot: p.foot ?? null
    }))
  } else {
    form.value = blankForm()
    placements.value = []
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

// One count per outcome for the stat boxes (Shots is just placements.length).
const counts = computed(() => {
  const c = { goal: 0, save: 0, post: 0, miss: 0 }
  for (const p of placements.value) if (c[p.outcome] !== undefined) c[p.outcome]++
  return c
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

const removeAt = (i) => { placements.value = placements.value.filter((_, idx) => idx !== i) }

const outcomeLabel = (o) => ({ goal: 'Goal', save: 'Save', post: 'Post', miss: 'Miss' }[o] || o)

const close = () => emit('update:modelValue', false)

const submit = () => {
  const payload = { ...form.value }
  if (props.editSession) payload.id = props.editSession.id
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

/* Popup entrance: the overlay fades, the card scales/springs up so it reads as
   a modern dialog rather than a flat panel. Runs on mount (v-if remounts it). */
.modal-overlay { animation: ls-overlay-in 0.18s ease both; }
.modal--popup {
  position: relative;
  /* Defined here (not the @import'd file) so HMR reliably reloads it. Border-box
     stops the padding/border from being added to width:100% and overflowing. */
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--color-border-soft);
  animation: ls-modal-in 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
  transform-origin: center;
}
@keyframes ls-overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ls-modal-in {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Mobile grab handle (only shown in bottom-sheet mode) */
.ls-grab { display: none; }

/* Circular icon close button — replaces the bare “×”. */
.ls-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.ls-close:hover { background: var(--color-bg-surface-3); color: var(--color-text-primary); border-color: var(--color-accent-border); }

.modal--shot-map { max-width: 410px; }

/* ── Hero header ─────────────────────────────────────────────────────── */
.ls-hero {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: calc(-1 * var(--space-6)) calc(-1 * var(--space-6)) var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background:
    radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 60%),
    var(--color-bg-surface-2);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}
.ls-hero__icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  border-radius: 50%;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
}
.ls-hero__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.ls-hero__eyebrow {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  font-weight: var(--font-weight-bold);
}
.ls-hero__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ls-hero__type { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.ls-hero__close {
  flex: 0 0 auto;
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.ls-hero__close:hover { color: var(--color-text-primary); }

/* ── Date field ──────────────────────────────────────────────────────── */
.ls-date { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.ls-date label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}
.ls-date__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-sm);
}
.ls-date__input:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }

.ls-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin: var(--space-3) 0;
}
.ls-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 2px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}
.ls-stat__val { font-size: var(--font-size-md); font-weight: var(--font-weight-heavy); color: var(--color-text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
.ls-stat__lbl { font-size: 0.62rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.02em; }

.derived-hint {
  margin: 0 0 var(--space-3);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.shot-list {
  list-style: none;
  margin: 0 0 var(--space-3);
  padding: var(--space-2);
  max-height: 132px;
  overflow-y: auto;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shot-list__item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: var(--radius-sm); }
.shot-list__item:hover { background: var(--color-bg-surface-3); }
.shot-list__dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; border: 1.5px solid rgba(255,255,255,0.6); }
.shot-list__dot.is-goal { background: var(--color-success); }
.shot-list__dot.is-save { background: var(--color-info); }
.shot-list__dot.is-post { background: var(--color-warning); }
.shot-list__dot.is-miss { background: var(--color-danger); }
.shot-list__label { flex: 1; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.shot-list__foot { color: var(--color-text-muted); }
.shot-list__del {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 6px;
  flex: 0 0 auto;
}
.shot-list__del:hover { color: var(--color-danger); }

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
