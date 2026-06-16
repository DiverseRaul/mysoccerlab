<template>
  <Teleport to="body">
    <div class="event-radial" data-testid="event-radial-menu" @click.self="Emit('cancel')">
      <div class="event-radial__panel" :style="PanelStyle" @click.stop>
        <p class="event-radial__title">{{ HideAttackingActions ? 'In your own half' : 'What happened here?' }}</p>
        <div class="event-radial__grid">
          <button
            v-for="Action in VisibleActions"
            :key="Action.Key"
            type="button"
            class="event-radial__chip"
            :class="`event-radial__chip--${Action.Category}`"
            :data-testid="`event-action-${Action.Key}`"
            @click="Emit('select', Action.Key)"
          >{{ Action.Label }}</button>
        </div>
        <button
          v-if="HideAttackingActions && !ShowMore"
          type="button"
          class="event-radial__more"
          data-testid="event-action-more"
          @click="ShowMore = true"
        >More — shot &amp; goal</button>
        <button type="button" class="event-radial__cancel" @click="Emit('cancel')">Cancel</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { EventActions } from '../../../lib/matchEvents'

const Props = defineProps({
  AnchorX: { type: Number, default: 0 },
  AnchorY: { type: Number, default: 0 },
  // In the defensive half, shooting/scoring don't apply — hide them and lead
  // with the defensive actions instead.
  HideAttackingActions: { type: Boolean, default: false }
})

const Emit = defineEmits(['select', 'cancel'])

const Clamp = (Value, Min, Max) => Math.min(Max, Math.max(Min, Value))

const ShowMore = ref(false)

const VisibleActions = computed(() => {
  if (!Props.HideAttackingActions) return EventActions
  // Lead with defensive actions in your own half.
  const Weight = (Cat) => (Cat === 'defensive' ? 0 : Cat === 'negative' ? 1 : 2)
  const Sorted = [...EventActions].sort((a, b) => Weight(a.Category) - Weight(b.Category))
  // Goal/Shot are unlikely from your own half — keep them tucked behind "More".
  if (ShowMore.value) return Sorted
  return Sorted.filter((Action) => Action.Key !== 'goal' && Action.Key !== 'shot')
})

const PanelStyle = computed(() => {
  const ViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360
  const ViewportHeight = typeof window !== 'undefined' ? window.innerHeight : 640
  return {
    left: `${Clamp(Props.AnchorX, 130, ViewportWidth - 130)}px`,
    top: `${Clamp(Props.AnchorY, 180, ViewportHeight - 180)}px`
  }
})
</script>

<style scoped>
.event-radial {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.event-radial__panel {
  position: fixed;
  transform: translate(-50%, -50%);
  width: min(260px, 90vw);
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: event-radial-pop 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes event-radial-pop {
  from { opacity: 0; transform: translate(-50%, -46%) scale(0.94); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.event-radial__title {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-radial__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.event-radial__chip {
  min-height: 44px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease;
}

.event-radial__chip:active {
  transform: scale(0.96);
}

.event-radial__chip--positive { border-left: 3px solid var(--color-success); }
.event-radial__chip--defensive { border-left: 3px solid var(--color-info); }
.event-radial__chip--negative { border-left: 3px solid var(--color-danger); }
.event-radial__chip--neutral { border-left: 3px solid var(--color-neutral); }

.event-radial__more {
  min-height: 40px;
  border: 1px dashed var(--color-border-soft);
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.event-radial__more:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.event-radial__cancel {
  min-height: 40px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.event-radial__cancel:hover {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}
</style>
