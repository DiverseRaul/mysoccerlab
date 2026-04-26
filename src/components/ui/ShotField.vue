<template>
  <div class="shot-field" :class="`shot-field--${mode}`">
    <!-- ── Origin / Field Markings ─────────────────────────────── -->
    <div
      v-if="mode === 'origin' || mode === 'both'"
      class="shot-field__field"
      :class="{ 'shot-field__field--interactive': interactive }"
      @click="onFieldClick"
    >
      <!-- Static field markings — see /database/migrations README for coordinate system. -->
      <svg class="shot-field__svg" viewBox="0 0 68 52.5" preserveAspectRatio="none">
        <!-- Outline -->
        <rect x="0" y="0" width="68" height="52.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
        <!-- Penalty Box (16.5m deep, 40.32m wide) -->
        <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
        <!-- Goal Area (5.5m deep, 18.32m wide) -->
        <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
        <!-- Penalty Spot (11m from goal) -->
        <circle cx="34" cy="11" r="0.4" fill="rgba(255,255,255,0.8)" />
        <!-- Penalty Arc (Radius 9.15m) -->
        <path d="M 26.68 16.5 A 9.15 9.15 0 0 0 41.32 16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
        <!-- Center Circle Arc (at 52.5m) -->
        <path d="M 24.85 52.5 A 9.15 9.15 0 0 1 43.15 52.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
        <!-- Corner Arcs -->
        <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
        <path d="M 68 2 A 2 2 0 0 1 66 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
        <!-- Goal Post (External) -->
        <path d="M 30.34 0 L 30.34 -1.5 L 37.66 -1.5 L 37.66 0" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8" />
      </svg>

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

    <!-- ── 9-quadrant goal placement grid ──────────────────────── -->
    <div
      v-if="mode === 'placement' || mode === 'both'"
      class="shot-field__goal"
    >
      <div class="shot-field__goal-grid">
        <button
          v-for="i in 9"
          :key="i"
          type="button"
          class="shot-field__goal-cell"
          :class="{
            'shot-field__goal-cell--highlight': quadrant === i,
            'shot-field__goal-cell--clickable': interactive
          }"
          :disabled="!interactive"
          @click.stop="onQuadrantClick(i)"
        >
          <span v-if="quadrant === i">X</span>
          <span v-else-if="interactive" class="shot-field__goal-cell-num">{{ i }}</span>
        </button>
      </div>
      <div v-if="!quadrant && !interactive && showPlaceholder" class="shot-field__placement-empty">
        No placement recorded
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

const emit = defineEmits(['field-click', 'quadrant-select'])

const markerStyle = computed(() => {
  if (!props.marker) return {}
  return {
    left: `${props.marker.xPct}%`,
    top: `${props.marker.yPct}%`
  }
})

const markerClass = computed(() => {
  const t = props.marker?.type
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

const onQuadrantClick = (i) => {
  if (!props.interactive) return
  emit('quadrant-select', i)
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
  aspect-ratio: 4 / 3;
  background: var(--color-bg-field);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.4);
}

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
  background: rgba(76, 218, 156, 0.5);
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
</style>
