<template>
  <div class="goal-map" data-testid="practice-goal-map">
    <div v-if="interactive" class="controls">
      <div class="control-row">
        <span class="control-label">Outcome:</span>
        <button
          v-for="opt in OUTCOMES"
          :key="opt.value"
          type="button"
          class="pill"
          :class="[`pill--${opt.value}`, { active: nextOutcome === opt.value }]"
          :data-testid="`outcome-pill-${opt.value}`"
          @click="$emit('update:nextOutcome', opt.value)"
        >
          <span class="pill__dot" :class="`pill__dot--${opt.value}`"></span>
          {{ opt.label }}
        </button>
      </div>

      <div class="control-row">
        <span class="control-label">Foot:</span>
        <button
          v-for="opt in FEET"
          :key="opt.value ?? 'none'"
          type="button"
          class="pill pill--foot"
          :class="{ active: nextFoot === opt.value }"
          :data-testid="`foot-pill-${opt.value ?? 'none'}`"
          @click="$emit('update:nextFoot', opt.value)"
        >{{ opt.label }}</button>

        <button
          v-if="placements.length > 0"
          type="button"
          class="undo-btn"
          data-testid="goal-map-undo"
          @click="$emit('undo')"
        >Undo last</button>
      </div>

      <p class="hint">{{ outcomeHint }}</p>

      <div class="live-counter" data-testid="goal-map-live-counter">
        <span class="live-chip live-chip--goal">⚽ {{ counts.outcome.goal }}</span>
        <span class="live-chip live-chip--save">🧤 {{ counts.outcome.save }}</span>
        <span class="live-chip live-chip--post">🥅 {{ counts.outcome.post }}</span>
        <span class="live-chip live-chip--miss">❌ {{ counts.outcome.miss }}</span>
      </div>
    </div>

    <div v-if="!interactive && placements.length > 0" class="view-toggles">
      <button
        type="button"
        class="view-pill"
        :class="{ active: showHeatmap }"
        data-testid="heatmap-toggle"
        @click="$emit('update:showHeatmap', !showHeatmap)"
      >Heatmap</button>
      <button
        type="button"
        class="view-pill"
        :class="{ active: showMarkers }"
        data-testid="markers-toggle"
        @click="$emit('update:showMarkers', !showMarkers)"
      >Markers</button>
    </div>

    <div
      class="goal-canvas"
      :class="{ 'goal-canvas--interactive': interactive }"
      role="img"
      :aria-label="`Goal area with ${placements.length} shot${placements.length === 1 ? '' : 's'} marked`"
      @click="onCanvasClick"
    >
      <svg class="goal-svg" viewBox="0 0 100 75" preserveAspectRatio="none">
        <defs>
          <!-- Soft halo gradients for the heatmap layer, one per outcome -->
          <radialGradient id="halo-goal" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#4cda9c" stop-opacity="0.65" />
            <stop offset="100%" stop-color="#4cda9c" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="halo-save" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#3b82f6" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="halo-miss" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#ef5350" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#ef5350" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="halo-post" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#ffb74d" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#ffb74d" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Miss zone (entire canvas) — faint pitch background -->
        <rect x="0" y="0" width="100" height="75" fill="rgba(34, 80, 50, 0.18)" />

        <!-- Goal mouth (inner box, the only place a goal/save can happen) -->
        <rect
          :x="GOAL_X1" :y="GOAL_Y1"
          :width="GOAL_X2 - GOAL_X1" :height="GOAL_Y2 - GOAL_Y1"
          fill="rgba(0,0,0,0.55)"
          stroke="#fff"
          stroke-width="1.6"
        />

        <!-- Net hatching, very faint -->
        <g v-if="true" stroke="rgba(255,255,255,0.08)" stroke-width="0.25">
          <line v-for="n in 7" :key="`v-${n}`"
            :x1="GOAL_X1 + ((GOAL_X2 - GOAL_X1) * n) / 8"
            :y1="GOAL_Y1"
            :x2="GOAL_X1 + ((GOAL_X2 - GOAL_X1) * n) / 8"
            :y2="GOAL_Y2" />
          <line v-for="n in 4" :key="`h-${n}`"
            :x1="GOAL_X1"
            :y1="GOAL_Y1 + ((GOAL_Y2 - GOAL_Y1) * n) / 5"
            :x2="GOAL_X2"
            :y2="GOAL_Y1 + ((GOAL_Y2 - GOAL_Y1) * n) / 5" />
        </g>

        <!-- Penalty spot for orientation -->
        <circle :cx="50" :cy="68" r="0.5" fill="rgba(255,255,255,0.5)" />

        <!-- Heatmap layer -->
        <g v-if="showHeatmap" style="mix-blend-mode: screen;">
          <circle
            v-for="(p, idx) in placements"
            :key="`h-${p.id ?? idx}`"
            :cx="p.x_pct"
            :cy="p.y_pct * (75 / 100)"
            r="8"
            :fill="`url(#halo-${p.outcome})`"
          />
        </g>
      </svg>

      <!-- Markers as positioned buttons -->
      <template v-if="showMarkers">
        <button
          v-for="(p, idx) in placements"
          :key="p.id ?? `tmp-${idx}`"
          type="button"
          class="marker"
          :class="[`marker--${p.outcome}`, p.foot ? `marker--foot-${p.foot}` : '']"
          :style="{ left: `${p.x_pct}%`, top: `${p.y_pct}%` }"
          :title="markerTitle(p)"
          :disabled="!interactive"
          :data-testid="`goal-marker-${idx}`"
          @click.stop="onMarkerClick(p, idx)"
        >
          <span v-if="p.foot" class="marker__foot">{{ p.foot[0].toUpperCase() }}</span>
        </button>
      </template>

      <div v-if="placements.length === 0 && !interactive" class="overlay">No placements logged</div>
      <div v-else-if="placements.length === 0 && interactive" class="overlay overlay--hint">Tap to mark a shot</div>
    </div>

    <div v-if="placements.length > 0" class="legend">
      <span class="legend__item">
        <span class="legend__dot legend__dot--goal"></span>Goal ({{ counts.outcome.goal }})
      </span>
      <span class="legend__item">
        <span class="legend__dot legend__dot--save"></span>Save ({{ counts.outcome.save }})
      </span>
      <span class="legend__item">
        <span class="legend__dot legend__dot--post"></span>Post ({{ counts.outcome.post }})
      </span>
      <span class="legend__item">
        <span class="legend__dot legend__dot--miss"></span>Miss ({{ counts.outcome.miss }})
      </span>
      <span v-if="counts.foot.left + counts.foot.right > 0" class="legend__sep">·</span>
      <span v-if="counts.foot.left > 0" class="legend__item">L {{ counts.foot.left }}</span>
      <span v-if="counts.foot.right > 0" class="legend__item">R {{ counts.foot.right }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Goal mouth occupies this region of the canvas. The area outside is the
// "miss zone" — players placing a miss can tap anywhere that isn't the goal.
const GOAL_X1 = 12
const GOAL_X2 = 88
const GOAL_Y1 = 16
const GOAL_Y2 = 50

const OUTCOMES = [
  { value: 'goal', label: 'Goal' },
  { value: 'save', label: 'Save' },
  { value: 'post', label: 'Post' },
  { value: 'miss', label: 'Miss' }
]

const FEET = [
  { value: null,    label: '—' },
  { value: 'left',  label: 'L' },
  { value: 'right', label: 'R' }
]

const props = defineProps({
  placements: { type: Array, default: () => [] },
  interactive: { type: Boolean, default: false },
  nextOutcome: { type: String, default: 'goal' },
  nextFoot: { type: [String, null], default: null },
  showHeatmap: { type: Boolean, default: true },
  showMarkers: { type: Boolean, default: true }
})

const emit = defineEmits([
  'add-placement', 'remove-placement', 'undo',
  'update:nextOutcome', 'update:nextFoot',
  'update:showHeatmap', 'update:showMarkers'
])

const outcomeHint = computed(() => {
  switch (props.nextOutcome) {
    case 'goal': return 'Tap inside the goal frame where the ball ended up.'
    case 'save': return 'Tap inside the goal frame — the keeper got there first.'
    case 'post': return 'Tap on the post or crossbar.'
    case 'miss': return 'Tap outside the goal — wide, over, or off-target.'
    default: return ''
  }
})

const counts = computed(() => {
  const c = {
    outcome: { goal: 0, save: 0, miss: 0, post: 0 },
    foot: { left: 0, right: 0 }
  }
  for (const p of props.placements) {
    if (c.outcome[p.outcome] !== undefined) c.outcome[p.outcome]++
    if (p.foot === 'left' || p.foot === 'right') c.foot[p.foot]++
  }
  return c
})

const onCanvasClick = (event) => {
  if (!props.interactive) return
  if (event.target.closest('.marker')) return
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  if (x < 0 || x > 100 || y < 0 || y > 100) return
  emit('add-placement', {
    x_pct: Math.round(x * 100) / 100,
    y_pct: Math.round(y * 100) / 100,
    outcome: props.nextOutcome,
    foot: props.nextFoot ?? null
  })
}

const onMarkerClick = (placement, idx) => {
  if (!props.interactive) return
  emit('remove-placement', { placement, idx })
}

const markerTitle = (p) => {
  const foot = p.foot ? ` (${p.foot})` : ''
  return `${p.outcome}${foot} @ ${Math.round(p.x_pct)},${Math.round(p.y_pct)}`
}
</script>

<style scoped>
.goal-map {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
}

.controls { display: flex; flex-direction: column; gap: var(--space-2); }

.control-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.control-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  min-width: 56px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.pill:hover { background: var(--color-bg-surface-3); }
.pill.active { border-color: var(--color-accent-border); color: var(--color-text-primary); background: var(--color-accent-soft); }

.pill__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
}
.pill__dot--goal { background: var(--color-success); }
.pill__dot--save { background: var(--color-info); }
.pill__dot--miss { background: var(--color-danger); }
.pill__dot--post { background: var(--color-warning); }

.pill--foot { min-width: 36px; justify-content: center; }

.undo-btn {
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
  margin-left: auto;
}
.undo-btn:hover { color: var(--color-text-primary); background: var(--color-bg-surface-2); }

.hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.view-toggles {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.view-pill {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.view-pill.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  color: var(--color-text-primary);
}

.goal-canvas {
  position: relative;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  background: var(--color-bg-field);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.goal-canvas--interactive { cursor: crosshair; }

.goal-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.marker {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  padding: 0;
  cursor: pointer;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 9px;
  font-weight: var(--font-weight-bold);
  font-family: inherit;
}

.marker:disabled { cursor: default; }
.marker--goal { background: var(--color-success); box-shadow: 0 0 6px rgba(76,218,156,0.6); }
.marker--save { background: var(--color-info);    box-shadow: 0 0 6px rgba(59,130,246,0.6); }
.marker--miss { background: var(--color-danger);  box-shadow: 0 0 6px rgba(239,83,80,0.6); }
.marker--post { background: var(--color-warning); box-shadow: 0 0 6px rgba(255,183,77,0.6); }

.marker--foot-left::before,
.marker--foot-right::before {
  content: '';
  position: absolute;
  top: -3px;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 1px;
}
.marker--foot-left::before  { left: -3px; }
.marker--foot-right::before { right: -3px; }

.marker__foot { line-height: 1; }

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-faint);
  font-size: var(--font-size-sm);
  pointer-events: none;
  font-style: italic;
}

.legend {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend__item { display: inline-flex; align-items: center; gap: 6px; }
.legend__sep { color: var(--color-text-faint); }

.legend__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #fff;
}
.legend__dot--goal { background: var(--color-success); }
.legend__dot--save { background: var(--color-info); }
.legend__dot--miss { background: var(--color-danger); }
.legend__dot--post { background: var(--color-warning); }

.live-counter {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.live-chip--goal { color: var(--color-success); border-color: rgba(76,218,156,0.3); }
.live-chip--save { color: var(--color-info);    border-color: rgba(59,130,246,0.3); }
.live-chip--post { color: var(--color-warning); border-color: rgba(255,183,77,0.3); }
.live-chip--miss { color: var(--color-danger);  border-color: rgba(239,83,80,0.3); }

/* ── Mobile: bigger tap targets, no horizontal max so canvas fills the screen ── */
@media (max-width: 600px) {
  .goal-canvas { max-width: 100%; }

  .pill {
    padding: 10px 14px;
    font-size: var(--font-size-sm);
    min-height: 44px;
  }

  .pill__dot { width: 12px; height: 12px; }

  .pill--foot { min-width: 44px; min-height: 44px; }

  .undo-btn {
    padding: 10px 14px;
    min-height: 44px;
    font-size: var(--font-size-sm);
  }

  .control-label { min-width: 0; }

  .marker {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }

  .marker--foot-left::before,
  .marker--foot-right::before {
    width: 8px;
    height: 8px;
    top: -4px;
  }
  .marker--foot-left::before  { left: -4px; }
  .marker--foot-right::before { right: -4px; }

  .live-chip {
    padding: 6px 12px;
    font-size: var(--font-size-base);
    min-height: 36px;
  }
}
</style>
