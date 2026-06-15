<template>
  <div class="heatmap-field" :class="{ 'heatmap-field--bare': !ShowControls }" data-testid="tactical-heatmap-field">
    <div v-if="ShowControls" class="heatmap-field__head">
      <div>
        <h4 class="heatmap-field__title">Tactical Heatmap</h4>
        <p class="heatmap-field__hint">{{ Interactive ? 'Pick an action, then tap the pitch where it happened' : 'Where your actions happened this match' }}</p>
      </div>
      <button
        v-if="Interactive && Points.length > 0"
        type="button"
        class="heatmap-field__undo"
        data-testid="heatmap-undo"
        @click="Emit('Undo')"
      >Undo last</button>
    </div>

    <div v-if="Interactive && ShowControls" class="heatmap-field__events">
      <button
        v-for="Event in EventTypes"
        :key="Event.Key"
        type="button"
        class="heatmap-field__event"
        :class="[`heatmap-field__event--${Event.Category}`, { 'is-active': SelectedEvent === Event.Key }]"
        :data-testid="`heatmap-event-${Event.Key}`"
        @click="SelectedEvent = Event.Key"
      >{{ Event.Label }}</button>
    </div>

    <div
      class="heatmap-field__canvas"
      :class="{ 'heatmap-field__canvas--interactive': Interactive }"
      role="img"
      :aria-label="`Pitch with ${Points.length} action${Points.length === 1 ? '' : 's'} logged`"
      @click="OnCanvasClick"
    >
      <svg class="heatmap-field__svg" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="heatmap-halo-positive" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#4cda9c" stop-opacity="0.7" />
            <stop offset="60%" stop-color="#4cda9c" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#4cda9c" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="heatmap-halo-defensive" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" />
            <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="heatmap-halo-negative" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef5350" stop-opacity="0.65" />
            <stop offset="60%" stop-color="#ef5350" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#ef5350" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="heatmap-halo-neutral" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#bdbdbd" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#bdbdbd" stop-opacity="0" />
          </radialGradient>
        </defs>

        <rect x="1" y="1" width="98" height="148" fill="rgba(34, 80, 50, 0.22)" stroke="rgba(255,255,255,0.25)" stroke-width="0.6" rx="2" />
        <line x1="1" y1="75" x2="99" y2="75" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.4)" />

        <rect x="25" y="1" width="50" height="22" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <rect x="40" y="1" width="20" height="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <circle cx="50" cy="15" r="0.8" fill="rgba(255,255,255,0.35)" />

        <rect x="25" y="127" width="50" height="22" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <rect x="40" y="141" width="20" height="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
        <circle cx="50" cy="135" r="0.8" fill="rgba(255,255,255,0.35)" />

        <g style="mix-blend-mode: screen;">
          <circle
            v-for="(Point, Index) in Points"
            :key="Point.id ?? `p-${Index}`"
            :cx="Point.x_pct"
            :cy="Point.y_pct * 1.5"
            r="11"
            :fill="`url(#heatmap-halo-${CategoryFor(Point.event_type)})`"
          />
        </g>
      </svg>

      <button
        v-for="(Point, Index) in Points"
        :key="`marker-${Point.id ?? Index}`"
        type="button"
        class="heatmap-field__marker"
        :class="`heatmap-field__marker--${CategoryFor(Point.event_type)}`"
        :style="{ left: `${Point.x_pct}%`, top: `${Point.y_pct}%` }"
        :title="LabelFor(Point.event_type)"
        tabindex="-1"
        aria-hidden="true"
      ></button>
    </div>

    <p v-if="ShowControls" class="heatmap-field__count" data-testid="heatmap-count">{{ Points.length }} logged</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CategoryForEvent, LabelForEvent } from '../../../lib/matchEvents'

const EventTypes = [
  { Key: 'successful_passes', Label: 'Pass', Category: 'positive' },
  { Key: 'dribbles', Label: 'Dribble', Category: 'positive' },
  { Key: 'created_chances', Label: 'Chance', Category: 'positive' },
  { Key: 'tackles', Label: 'Tackle', Category: 'defensive' },
  { Key: 'interceptions', Label: 'Interception', Category: 'defensive' },
  { Key: 'clearances', Label: 'Clearance', Category: 'defensive' },
  { Key: 'unsuccessful_passes', Label: 'Bad Pass', Category: 'negative' },
  { Key: 'fouls', Label: 'Foul', Category: 'negative' }
]

const Props = defineProps({
  Points: {
    type: Array,
    default: () => []
  },
  Interactive: {
    type: Boolean,
    default: true
  },
  ShowControls: {
    type: Boolean,
    default: true
  }
})

const Emit = defineEmits(['AddPoint', 'Undo'])

const SelectedEvent = ref(EventTypes[0].Key)

const CategoryFor = (EventType) => CategoryForEvent(EventType)

const LabelFor = (EventType) => LabelForEvent(EventType)

const OnCanvasClick = (Event) => {
  if (!Props.Interactive) return
  if (Event.target.closest('.heatmap-field__marker')) return
  const Rect = Event.currentTarget.getBoundingClientRect()
  const XPct = ((Event.clientX - Rect.left) / Rect.width) * 100
  const YPct = ((Event.clientY - Rect.top) / Rect.height) * 100
  if (XPct < 0 || XPct > 100 || YPct < 0 || YPct > 100) return
  Emit('AddPoint', {
    XPct: Math.round(XPct * 100) / 100,
    YPct: Math.round(YPct * 100) / 100,
    EventType: SelectedEvent.value
  })
}
</script>

<style scoped>
.heatmap-field {
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.heatmap-field--bare {
  background: transparent;
  border: none;
  padding: 0;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.heatmap-field__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.heatmap-field__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.heatmap-field__hint {
  margin: 4px 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.heatmap-field__undo {
  flex: 0 0 auto;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  padding: 8px 16px;
  min-height: 40px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.heatmap-field__undo:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.heatmap-field__events {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.heatmap-field__events::-webkit-scrollbar {
  display: none;
}

.heatmap-field__event {
  flex: 0 0 auto;
  white-space: nowrap;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  border-radius: var(--radius-pill);
  padding: 10px 16px;
  min-height: 44px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.heatmap-field__event--positive.is-active { background: var(--color-success-bg); border-color: var(--color-accent-border); color: var(--color-success); }
.heatmap-field__event--defensive.is-active { background: var(--color-info-bg); border-color: var(--color-info); color: var(--color-info); }
.heatmap-field__event--negative.is-active { background: var(--color-danger-bg); border-color: var(--color-danger); color: var(--color-danger); }

.heatmap-field__canvas {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-field);
}

.heatmap-field__canvas--interactive {
  cursor: crosshair;
}

.heatmap-field__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.heatmap-field__marker {
  position: absolute;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.heatmap-field__marker--positive { background: var(--color-success); }
.heatmap-field__marker--defensive { background: var(--color-info); }
.heatmap-field__marker--negative { background: var(--color-danger); }
.heatmap-field__marker--neutral { background: var(--color-neutral); }

.heatmap-field__count {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
