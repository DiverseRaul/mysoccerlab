<template>
  <div class="goal-map" data-testid="practice-goal-map">
    <!-- Interactive logging controls -->
    <div v-if="interactive" class="gm-controls">
      <div class="gm-modes" role="tablist" aria-label="Shot or save">
        <button
          type="button"
          class="gm-mode"
          :class="{ 'is-active': mode === 'shot' }"
          data-testid="goal-mode-shot"
          @click="mode = 'shot'"
        ><span>⚽</span> Shot</button>
        <button
          type="button"
          class="gm-mode"
          :class="{ 'is-active': mode === 'save' }"
          data-testid="goal-mode-save"
          @click="mode = 'save'"
        ><span>🧤</span> Save</button>
      </div>

      <div class="gm-feet">
        <span class="gm-feet__label">Foot</span>
        <button
          v-for="f in FEET"
          :key="f.value ?? 'none'"
          type="button"
          class="gm-foot"
          :class="{ 'is-active': foot === f.value }"
          :data-testid="`foot-pill-${f.value ?? 'none'}`"
          @click="foot = f.value"
        >{{ f.label }}</button>
        <button
          v-if="placements.length > 0"
          type="button"
          class="gm-undo"
          data-testid="goal-map-undo"
          @click="$emit('undo')"
        >Undo</button>
      </div>

      <p class="gm-hint">{{ hint }}</p>
    </div>

    <!-- Display view toggles -->
    <div v-if="!interactive && placements.length > 0" class="gm-view-toggles">
      <button
        type="button"
        class="gm-view"
        :class="{ 'is-active': showHeatmap }"
        data-testid="heatmap-toggle"
        @click="$emit('update:showHeatmap', !showHeatmap)"
      >Heatmap</button>
      <button
        type="button"
        class="gm-view"
        :class="{ 'is-active': showMarkers }"
        data-testid="markers-toggle"
        @click="$emit('update:showMarkers', !showMarkers)"
      >Markers</button>
    </div>

    <!-- Zoom controls -->
    <div class="gm-zoombar">
      <button type="button" class="gm-zoombtn" :disabled="zoom <= ZOOM_MIN" aria-label="Zoom out" @click="zoomBy(-ZOOM_STEP)">−</button>
      <span class="gm-zoomval">{{ Math.round(zoom * 100) }}%</span>
      <button type="button" class="gm-zoombtn" :disabled="zoom >= ZOOM_MAX" aria-label="Zoom in" @click="zoomBy(ZOOM_STEP)">+</button>
      <button v-if="zoom !== 1" type="button" class="gm-zoomreset" @click="zoom = 1">Reset</button>
    </div>

    <!-- Zoom viewport: the goal scales inside this fixed window; pan by scrolling -->
    <div class="gm-zoom" ref="zoomWrap">
    <!-- Tappable surface: centred goal with a miss margin all around -->
    <div
      class="goal-canvas gm-area"
      :class="{ 'gm-area--interactive': interactive, 'gm-area--zoomed': zoom > 1 }"
      :style="{ width: `${zoom * 100}%` }"
      role="img"
      :aria-label="`Goal area with ${placements.length} shot${placements.length === 1 ? '' : 's'} marked`"
      @click="onTap"
    >
      <div class="gm-goal">
        <GoalFrame3D fill />
      </div>

      <GoalHeatmap v-if="heatmapOn" :points="displayPlacements" class="gm-heat" />

      <template v-if="markersOn">
        <button
          v-for="m in displayPlacements"
          :key="m.id ?? `tmp-${m._i}`"
          type="button"
          class="marker"
          :class="[`marker--${m.outcome}`, m.foot ? `marker--foot-${m.foot}` : '']"
          :style="{ left: `${m.x_pct}%`, top: `${m.y_pct}%` }"
          :title="markerTitle(m)"
          :disabled="!interactive"
          :data-testid="`goal-marker-${m._i}`"
          @click.stop="onMarkerClick(m)"
        >
          <span v-if="m.foot" class="marker__foot">{{ m.foot[0].toUpperCase() }}</span>
        </button>
      </template>

      <div v-if="placements.length === 0 && !interactive" class="gm-overlay">No placements logged</div>
      <div v-else-if="placements.length === 0 && interactive" class="gm-overlay gm-overlay--hint">Tap where the shot ended up</div>
    </div>
    </div>

    <!-- Live counter (interactive) -->
    <div v-if="interactive && showCounter" class="gm-counter" data-testid="goal-map-live-counter">
      <span class="gm-chip gm-chip--goal">⚽ {{ counts.goal }}</span>
      <span class="gm-chip gm-chip--save">🧤 {{ counts.save }}</span>
      <span class="gm-chip gm-chip--post">🥅 {{ counts.post }}</span>
      <span class="gm-chip gm-chip--miss">❌ {{ counts.miss }}</span>
    </div>

    <!-- Legend (display) -->
    <div v-if="!interactive && placements.length > 0" class="legend">
      <span class="legend__item"><span class="legend__dot legend__dot--goal"></span>Goal ({{ counts.goal }})</span>
      <span class="legend__item"><span class="legend__dot legend__dot--save"></span>Save ({{ counts.save }})</span>
      <span class="legend__item"><span class="legend__dot legend__dot--post"></span>Post ({{ counts.post }})</span>
      <span class="legend__item"><span class="legend__dot legend__dot--miss"></span>Miss ({{ counts.miss }})</span>
      <span v-if="counts.left + counts.right > 0" class="legend__sep">·</span>
      <span v-if="counts.left > 0" class="legend__item">L {{ counts.left }}</span>
      <span v-if="counts.right > 0" class="legend__item">R {{ counts.right }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import GoalFrame3D from '../../ui/GoalFrame3D.vue'
import GoalHeatmap from './GoalHeatmap.vue'

// ── Geometry (container %). The goal sits low in the frame: you can miss OVER
//    the bar (top band) or WIDE of the posts (side bands) — not "under" it. The
//    net is inside the posts; the band between net and outer is the post zone
//    (crossbar + two posts, no bottom bar). ──────────────────────────────────
const NET = { x1: 18, x2: 82, y1: 31, y2: 98 }
const OUTER = { x1: 14, x2: 86, y1: 27, y2: 98 }

const FEET = [
  { value: null, label: '—' },
  { value: 'left', label: 'L' },
  { value: 'right', label: 'R' }
]

const props = defineProps({
  placements: { type: Array, default: () => [] },
  interactive: { type: Boolean, default: false },
  showHeatmap: { type: Boolean, default: true },
  showMarkers: { type: Boolean, default: true },
  // Lets the consumer hide the built-in chip counter (e.g. the log modal shows
  // its own stat boxes, so we don't want a duplicate count).
  showCounter: { type: Boolean, default: true }
})

const emit = defineEmits(['add-placement', 'remove-placement', 'undo', 'update:showHeatmap', 'update:showMarkers'])

const mode = ref('shot')
const foot = ref(null)

// Zoom: scales the goal inside a fixed viewport; pan by scrolling. Tap math uses
// getBoundingClientRect (which reflects the scaled size), so logging stays exact.
const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.5
const zoom = ref(1)
const zoomWrap = ref(null)
// Keep the centre of the goal in view when zooming (scroll the viewport to the
// middle), so it reads as zooming toward the centre rather than the top-left.
const recenter = () => {
  const el = zoomWrap.value
  if (!el) return
  el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
}
const zoomBy = (delta) => {
  zoom.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((zoom.value + delta) * 10) / 10))
  nextTick(recenter)
}

const heatmapOn = computed(() => !props.interactive && props.showHeatmap && props.placements.length > 0)
const markersOn = computed(() => props.interactive || props.showMarkers)

const hint = computed(() =>
  mode.value === 'save'
    ? 'Tap the net for a save · the frame for a post · outside for a miss'
    : 'Tap the net for a goal · the frame for a post · outside for a miss'
)

const inRect = (x, y, r) => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// Outcome from where the tap landed + the selected mode.
const outcomeFor = (x, y) => {
  if (inRect(x, y, NET)) return mode.value === 'save' ? 'save' : 'goal'
  if (inRect(x, y, OUTER)) return 'post'
  return 'miss'
}

// Re-place a stored point so it reads correctly for its outcome (fixes old data
// where posts/misses were saved inside the goal). Goals/saves clamp into the
// net, posts onto the frame ring, misses outside the goal.
const placeForOutcome = (x, y, outcome) => {
  if (outcome === 'goal' || outcome === 'save') {
    return { x: clamp(x, NET.x1 + 1, NET.x2 - 1), y: clamp(y, NET.y1 + 1, NET.y2 - 1) }
  }
  if (outcome === 'post') {
    let px = clamp(x, OUTER.x1, OUTER.x2)
    let py = clamp(y, OUTER.y1, OUTER.y2)
    if (inRect(px, py, NET)) {
      // Snap to the nearest bar: crossbar (top), left post, or right post.
      const dl = px - NET.x1, dr = NET.x2 - px, dt = py - NET.y1
      const m = Math.min(dl, dr, dt)
      if (m === dt) py = (OUTER.y1 + NET.y1) / 2
      else if (m === dl) px = (OUTER.x1 + NET.x1) / 2
      else px = (OUTER.x2 + NET.x2) / 2
    }
    return { x: px, y: py }
  }
  // miss: if it sits inside the goal frame, push it "over" the bar
  if (inRect(x, y, OUTER)) return { x: clamp(x, 6, 94), y: 14 }
  return { x: clamp(x, 3, 97), y: clamp(y, 3, 97) }
}

// Placements with display-corrected positions + a stable original index.
const displayPlacements = computed(() =>
  props.placements.map((p, i) => {
    const pos = placeForOutcome(Number(p.x_pct), Number(p.y_pct), p.outcome)
    return { ...p, x_pct: pos.x, y_pct: pos.y, _i: i }
  })
)

const counts = computed(() => {
  const c = { goal: 0, save: 0, post: 0, miss: 0, left: 0, right: 0 }
  for (const p of props.placements) {
    if (c[p.outcome] !== undefined) c[p.outcome]++
    if (p.foot === 'left' || p.foot === 'right') c[p.foot]++
  }
  return c
})

const onTap = (event) => {
  if (!props.interactive) return
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  if (x < 0 || x > 100 || y < 0 || y > 100) return
  // Every tap adds a marker (stacking in the same spot is fine) — remove with Undo.
  emit('add-placement', {
    x_pct: Math.round(x * 100) / 100,
    y_pct: Math.round(y * 100) / 100,
    outcome: outcomeFor(x, y),
    foot: foot.value ?? null
  })
}

const onMarkerClick = (m) => {
  if (!props.interactive) return
  emit('remove-placement', { placement: m, idx: m._i })
}

const markerTitle = (m) => `${m.outcome}${m.foot ? ` (${m.foot})` : ''}`
</script>

<style scoped>
.goal-map { display: flex; flex-direction: column; gap: var(--space-3); width: 100%; }

/* ── Interactive controls ─────────────────────────────────────── */
.gm-controls { display: flex; flex-direction: column; gap: var(--space-3); }

.gm-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}
.gm-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  padding: 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.gm-mode.is-active { background: var(--color-accent); color: var(--color-on-accent); box-shadow: 0 2px 10px color-mix(in srgb, var(--color-accent-deep) 35%, transparent); }

.gm-feet { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.gm-feet__label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.gm-foot {
  min-width: 40px;
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.gm-foot.is-active { background: var(--color-accent-soft); border-color: var(--color-accent-border); color: var(--color-accent); }
.gm-undo {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.gm-undo:hover { color: var(--color-text-primary); background: var(--color-bg-surface-2); }

.gm-hint { margin: 0; font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: center; }

.gm-view-toggles { display: flex; gap: var(--space-2); justify-content: flex-end; }
.gm-view {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.gm-view.is-active { background: var(--color-accent-soft); border-color: var(--color-accent-border); color: var(--color-accent); }

/* ── Tappable goal area ───────────────────────────────────────── */
/* Zoom viewport: a fixed 2:1 window; the goal inside scales and is panned by
   scrolling. */
.gm-zoom {
  position: relative;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  aspect-ratio: 2 / 1;
  overflow: auto;
  border-radius: var(--radius-md);
  -webkit-overflow-scrolling: touch;
}

.gm-zoombar { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }
.gm-zoombtn {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--color-border-soft); background: var(--color-bg-surface-2);
  color: var(--color-text-primary); border-radius: var(--radius-sm);
  font-size: var(--font-size-md); font-family: inherit; cursor: pointer; line-height: 1;
}
.gm-zoombtn:disabled { opacity: 0.4; cursor: default; }
.gm-zoomval { font-size: var(--font-size-xs); color: var(--color-text-muted); min-width: 38px; text-align: center; font-variant-numeric: tabular-nums; }
.gm-zoomreset { background: none; border: none; color: var(--color-accent); font-family: inherit; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); cursor: pointer; }

.gm-area {
  position: relative;
  width: 100%;
  /* Wider, shorter frame so the goal reads like a real goal (≈ wide rectangle)
     rather than a tall box. Markers/heatmap are positioned in %, so they scale
     with this automatically — no geometry/hit-testing change needed. */
  aspect-ratio: 2 / 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% 18%, rgba(60, 120, 78, 0.30), transparent 60%),
    repeating-linear-gradient(180deg, rgba(255,255,255,0.018) 0 14px, transparent 14px 28px),
    linear-gradient(180deg, #11241a, #0c1813);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5);
}
.gm-area--interactive { cursor: crosshair; }

/* The premium 3D goal — low in the frame, with room OVER (top) and WIDE
   (sides) for misses, no "under" area. Matches the OUTER geometry above. */
.gm-goal { position: absolute; left: 14%; top: 27%; width: 72%; height: 71%; }

.gm-heat { position: absolute; inset: 0; }

.marker {
  position: absolute;
  width: 11px;
  height: 11px;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  padding: 0;
  cursor: pointer;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 7px;
  font-weight: var(--font-weight-bold);
  font-family: inherit;
}
/* While logging, markers don't intercept taps — every tap adds a new one
   (stacking is fine); removal is via Undo. They're a touch bigger for clarity. */
.gm-area--interactive .marker { width: 16px; height: 16px; font-size: 8px; pointer-events: none; }
.marker:disabled { cursor: default; }
.marker--goal { background: var(--color-success); box-shadow: 0 0 7px color-mix(in srgb, var(--color-accent) 65%, transparent); }
.marker--save { background: var(--color-info);    box-shadow: 0 0 7px rgba(59,130,246,0.6); }
.marker--miss { background: var(--color-danger);  box-shadow: 0 0 7px rgba(239,83,80,0.6); }
.marker--post { background: var(--color-warning); box-shadow: 0 0 7px rgba(255,183,77,0.6); }

.marker__foot { line-height: 1; }

.gm-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-sm);
  pointer-events: none;
  z-index: 4;
}

/* ── Counter / legend ─────────────────────────────────────────── */
.gm-counter { display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: center; }
.gm-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}
.gm-chip--goal { color: var(--color-success); border-color: color-mix(in srgb, var(--color-accent) 30%, transparent); }
.gm-chip--save { color: var(--color-info);    border-color: rgba(59,130,246,0.3); }
.gm-chip--post { color: var(--color-warning); border-color: rgba(255,183,77,0.3); }
.gm-chip--miss { color: var(--color-danger);  border-color: rgba(239,83,80,0.3); }

.legend { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; font-size: var(--font-size-xs); color: var(--color-text-muted); }
.legend__item { display: inline-flex; align-items: center; gap: 6px; }
.legend__sep { color: var(--color-text-faint); }
.legend__dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.6); }
.legend__dot--goal { background: var(--color-success); }
.legend__dot--save { background: var(--color-info); }
.legend__dot--miss { background: var(--color-danger); }
.legend__dot--post { background: var(--color-warning); }

@media (max-width: 600px) {
  .gm-zoom { max-width: 100%; }
  .gm-foot { min-width: 44px; min-height: 40px; }
  .gm-area--interactive .marker { width: 22px; height: 22px; font-size: 10px; }
}
</style>
