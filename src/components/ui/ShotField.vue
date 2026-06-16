<template>
  <div class="shot-field" :class="`shot-field--${mode}`">
    <!-- ── Origin / Field Markings ─────────────────────────────── -->
    <div
      v-if="mode === 'origin' || mode === 'both'"
      class="shot-field__field"
      :class="{ 'shot-field__field--interactive': interactive }"
      @click="onFieldClick"
    >
      <!-- Shared pitch — same surface as every other field in the app. -->
      <PitchSurface class="shot-field__pitch" />

      <!-- Optional trajectory line, drawn before the marker so the marker sits on top. -->
      <svg
        v-if="trajectory && marker"
        class="shot-field__svg shot-field__svg--overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          :x1="marker.xPct"
          :y1="marker.yPct"
          :x2="50"
          y2="0"
          stroke="rgba(255,255,255,0.4)"
          stroke-width="0.5"
          stroke-dasharray="2"
        />
      </svg>

      <!-- Single marker (single-shot views in MatchManager). -->
      <div
        v-if="marker"
        class="shot-field__marker"
        :class="markerClass"
        :style="markerStyle"
      ></div>

      <!-- Custom overlay for multi-marker heatmaps (e.g. ShotMapSection). -->
      <div class="shot-field__overlay">
        <slot name="overlay" />
      </div>

      <!-- Empty placeholder when no marker and no overlay slot content -->
      <div
        v-if="!marker && !$slots.overlay && showPlaceholder"
        class="shot-field__placeholder"
      >
        <span>No origin recorded</span>
      </div>
    </div>

    <!-- ── Goal placement (shared GoalNet — free x,y everywhere) ── -->
    <div
      v-if="mode === 'placement' || mode === 'both'"
      class="shot-field__goal"
    >
      <GoalNet
        :markers="GoalMarkers"
        :interactive="interactive"
        :show-empty="showPlaceholder"
        @select="(p) => emit('placement-select', p)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PitchSurface from './PitchSurface.vue'
import GoalNet from './GoalNet.vue'

// Legacy quadrant (1–9) → approximate x,y in the goal mouth, so old data still
// renders as a dot in the shared GoalNet.
const QUADRANT_XY = { 1: [17, 25], 2: [50, 25], 3: [83, 25], 4: [17, 50], 5: [50, 50], 6: [83, 50], 7: [17, 78], 8: [50, 78], 9: [83, 78] }

const props = defineProps({
  mode: {
    type: String,
    default: 'origin',
    validator: (v) => ['origin', 'placement', 'both'].includes(v)
  },
  marker: {
    type: Object,
    default: null,
    // shape: { xPct: 0-100, yPct: 0-100, type?: 'goal'|'on-target'|'off-target' }
  },
  quadrant: {
    type: Number,
    default: 0
  },
  // Free placement marker for read-only goal display: { xPct, yPct, type? }.
  placementMarker: {
    type: Object,
    default: null
  },
  // When true, the goal is a single free-tap area (emits placement-select x/y)
  // instead of the 9-cell quadrant grid.
  freePlacement: {
    type: Boolean,
    default: false
  },
  trajectory: {
    type: Boolean,
    default: false
  },
  interactive: {
    type: Boolean,
    default: false
  },
  showPlaceholder: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['field-click', 'placement-select'])

// Markers shown in the shared GoalNet: the free x,y placement, or a legacy
// quadrant mapped to an approximate spot.
const GoalMarkers = computed(() => {
  const kind = props.placementMarker?.type || (props.quadrant ? 'goal' : 'goal')
  if (props.placementMarker) {
    return [{ x: props.placementMarker.xPct, y: props.placementMarker.yPct, kind }]
  }
  if (props.quadrant && QUADRANT_XY[props.quadrant]) {
    const [x, y] = QUADRANT_XY[props.quadrant]
    return [{ x, y, kind }]
  }
  return []
})

const markerStyle = computed(() => {
  if (!props.marker) return {}
  return {
    left: `${props.marker.xPct}%`,
    top: `${props.marker.yPct}%`
  }
})

const markerClass = computed(() => {
  const t = props.marker?.type || props.placementMarker?.type
  if (t === 'off-target') return 'shot-field__marker--off-target'
  if (t === 'goal') return 'shot-field__marker--goal'
  return 'shot-field__marker--on-target'
})

const onFieldClick = (event) => {
  if (!props.interactive) return
  const rect = event.currentTarget.getBoundingClientRect()
  const xPct = ((event.clientX - rect.left) / rect.width) * 100
  const yPct = ((event.clientY - rect.top) / rect.height) * 100
  emit('field-click', { xPct, yPct })
}
</script>

<style scoped>
.shot-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.shot-field--both {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
}

/* ── Field origin frame ─────────────────────────────────────── */
.shot-field__field {
  position: relative;
  width: 100%;
  /* Same portrait full pitch as everywhere else. */
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* The shared pitch fills the field; markers/trajectory overlay on top. */
.shot-field__pitch { position: absolute; inset: 0; }

.shot-field__field--interactive {
  cursor: crosshair;
}

.shot-field__svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;
}

.shot-field__svg--overlay {
  z-index: 2;
  opacity: 1;
}

.shot-field__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.shot-field__overlay > :deep(*) {
  pointer-events: auto;
}

.shot-field__marker {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.shot-field__marker--on-target,
.shot-field__marker--goal {
  background: var(--color-info);
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
}

.shot-field__marker--off-target {
  background: var(--color-danger);
  box-shadow: 0 0 5px rgba(239, 83, 80, 0.5);
}

.shot-field__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-faint);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

/* ── Goal placement grid ────────────────────────────────────── */
.shot-field__goal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.shot-field__goal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid #fff;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  box-shadow: var(--shadow-md), inset 0 0 40px rgba(0, 0, 0, 0.5);
}

.shot-field__goal-cell {
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  padding: 0;
  min-height: 44px;
}

.shot-field__goal-cell--clickable {
  cursor: pointer;
}

.shot-field__goal-cell--clickable:hover {
  background: rgba(255, 255, 255, 0.1);
}

.shot-field__goal-cell--highlight {
  background: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.shot-field__goal-cell-num {
  opacity: 0.4;
  font-size: var(--font-size-md);
}

.shot-field__placement-empty {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-faint);
}

/* ── Free goal placement ────────────────────────────────────── */
.shot-field__goal-free {
  position: relative;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  border: 4px solid #fff;
  border-radius: 2px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px) 0 0 / 100% 33.33%,
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px) 0 0 / 33.33% 100%,
    rgba(0, 0, 0, 0.5);
  box-shadow: var(--shadow-md), inset 0 0 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.shot-field__goal-free--clickable {
  cursor: crosshair;
}

.shot-field__goal-net {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shot-field__goal-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}

.shot-field__placement-marker {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
}

.shot-field__placement-marker.shot-field__marker--on-target,
.shot-field__placement-marker.shot-field__marker--goal {
  background: var(--color-success);
}

.shot-field__placement-marker.shot-field__marker--off-target {
  background: var(--color-danger);
}
</style>
