<template>
  <div class="mini-shotmap" data-testid="mini-shotmap">
    <div v-if="!HasShotData && !HasHeatmap" class="mini-shotmap__empty">
      <span class="mini-shotmap__empty-icon">⚽</span>
      <p>No actions logged in this match</p>
    </div>

    <template v-else>
      <!-- View switcher: only one of heatmap / actions / shots at a time. -->
      <div class="mini-shotmap__viewtabs" role="tablist">
        <button
          v-if="HasHeatmap"
          type="button"
          class="mini-shotmap__viewtab"
          :class="{ 'is-active': View === 'heatmap' }"
          :aria-selected="View === 'heatmap'"
          role="tab"
          data-testid="mini-shotmap-tab-heatmap"
          @click="View = 'heatmap'"
        >Heatmap</button>
        <button
          v-if="HasActions"
          type="button"
          class="mini-shotmap__viewtab"
          :class="{ 'is-active': View === 'actions' }"
          :aria-selected="View === 'actions'"
          role="tab"
          data-testid="mini-shotmap-tab-actions"
          @click="View = 'actions'"
        >Actions</button>
        <button
          v-if="HasShotData"
          type="button"
          class="mini-shotmap__viewtab"
          :class="{ 'is-active': View === 'shots' }"
          :aria-selected="View === 'shots'"
          role="tab"
          data-testid="mini-shotmap-tab-shots"
          @click="View = 'shots'"
        >Shots</button>
      </div>

      <!-- Heatmap: density of every logged action. -->
      <div v-if="View === 'heatmap'" class="mini-shotmap__heatmap" data-testid="mini-shotmap-heatmap">
        <HeatmapCanvas :points="HeatmapPoints" />
        <p class="mini-shotmap__note">{{ HeatmapPoints.length }} actions mapped this match</p>
      </div>

      <!-- Actions: each individual action plotted + a per-type breakdown. -->
      <div v-else-if="View === 'actions'" class="mini-shotmap__actions" data-testid="mini-shotmap-actions">
        <div class="mini-shotmap__pitch">
          <svg class="mini-shotmap__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x="1" y="1" width="98" height="98" class="pitch-line" rx="1.5" />
            <rect x="28" y="1" width="44" height="20" class="pitch-line" />
            <rect x="41" y="1" width="18" height="8" class="pitch-line" />
            <line x1="1" y1="62" x2="99" y2="62" class="pitch-line" />
          </svg>
          <span
            v-for="(m, i) in ActionMarkers"
            :key="'a-' + i"
            class="mini-shotmap__amarker"
            :class="`is-${m.category}`"
            :style="{ left: m.x + '%', top: m.y + '%' }"
            :title="m.label"
          ></span>
          <p v-if="!ActionMarkers.length" class="mini-shotmap__sub-empty">No mapped actions</p>
        </div>
        <ul class="mini-shotmap__breakdown">
          <li v-for="a in ActionBreakdown" :key="a.type" class="mini-shotmap__breakdown-row">
            <span class="mini-shotmap__breakdown-dot" :class="`is-${a.category}`"></span>
            <span class="mini-shotmap__breakdown-count">{{ a.count }}</span>
            <span class="mini-shotmap__breakdown-label">{{ a.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Shots: origins + placement. -->
      <div v-else class="mini-shotmap__shots">
        <div class="mini-shotmap__panels">
          <!-- Pitch: shot origins + trajectory lines -->
          <figure class="mini-shotmap__panel">
            <figcaption class="mini-shotmap__cap">Shot origins</figcaption>
            <div class="mini-shotmap__pitch">
              <svg class="mini-shotmap__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x="1" y="1" width="98" height="98" class="pitch-line" rx="1.5" />
                <rect x="28" y="1" width="44" height="20" class="pitch-line" />
                <rect x="41" y="1" width="18" height="8" class="pitch-line" />
                <line x1="1" y1="62" x2="99" y2="62" class="pitch-line" />
                <line
                  v-for="(s, i) in OnTargetTrajectories"
                  :key="'t-shot-' + i"
                  :x1="s.x" :y1="s.y" :x2="s.targetX" y2="1"
                  class="traj traj--shot"
                />
                <line
                  v-for="(g, i) in GoalTrajectories"
                  :key="'t-goal-' + i"
                  :x1="g.x" :y1="g.y" :x2="g.targetX" y2="1"
                  class="traj traj--goal"
                />
              </svg>
              <span
                v-for="(m, i) in OriginMarkers"
                :key="'m-' + i"
                class="mini-shotmap__marker"
                :class="`mini-shotmap__marker--${m.kind}`"
                :style="{ left: m.x + '%', top: m.y + '%' }"
              ></span>
              <p v-if="!OriginMarkers.length" class="mini-shotmap__sub-empty">No mapped origins</p>
            </div>
          </figure>

          <!-- Goal: 3x3 placement quadrants -->
          <figure class="mini-shotmap__panel">
            <figcaption class="mini-shotmap__cap">Placement</figcaption>
            <div class="mini-shotmap__goal">
              <div
                v-for="q in 9"
                :key="'q-' + q"
                class="mini-shotmap__cell"
                :class="{ 'is-hit': QuadrantGoals(q) + QuadrantShots(q) > 0 }"
              >
                <span v-if="QuadrantGoals(q)" class="mini-shotmap__pill mini-shotmap__pill--goal">{{ QuadrantGoals(q) }}</span>
                <span v-if="QuadrantShots(q)" class="mini-shotmap__pill mini-shotmap__pill--shot">{{ QuadrantShots(q) }}</span>
              </div>
              <p v-if="!HasQuadrantData" class="mini-shotmap__sub-empty">No placements</p>
            </div>
          </figure>
        </div>

        <div class="mini-shotmap__legend">
          <span class="mini-shotmap__legend-item"><span class="dot dot--goal"></span>Goal</span>
          <span class="mini-shotmap__legend-item"><span class="dot dot--shot"></span>On target</span>
          <span class="mini-shotmap__legend-item"><span class="dot dot--off"></span>Off target</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ParseFieldPosition, GoalTargetXForQuadrant, CategoryForEvent, LabelForEvent } from '../../lib/matchEvents'
import HeatmapCanvas from './HeatmapCanvas.vue'

const Props = defineProps({
  goals: { type: Array, default: () => [] },
  shots: { type: Array, default: () => [] },
  heatmap: { type: Array, default: () => [] }
})

// The heatmap blends every logged spatial action: tracked events (passes,
// clearances, tackles…) plus shot and goal origins.
const HeatmapPoints = computed(() => {
  const Out = Props.heatmap
    .map((p) => ({ x_pct: Number(p.x_pct), y_pct: Number(p.y_pct) }))
    .filter((p) => Number.isFinite(p.x_pct) && Number.isFinite(p.y_pct))
  for (const g of Props.goals) {
    const Pos = ParseFieldPosition(g.field_position)
    if (Pos) Out.push({ x_pct: Pos.XPct, y_pct: Pos.YPct })
  }
  for (const s of Props.shots) {
    const Pos = ParseFieldPosition(s.field_position)
    if (Pos) Out.push({ x_pct: Pos.XPct, y_pct: Pos.YPct })
  }
  return Out
})

// Individual logged actions (tracked events with a position + a type).
const ActionMarkers = computed(() =>
  Props.heatmap
    .map((p) => ({
      x: Number(p.x_pct),
      y: Number(p.y_pct),
      category: CategoryForEvent(p.event_type),
      label: LabelForEvent(p.event_type)
    }))
    .filter((m) => Number.isFinite(m.x) && Number.isFinite(m.y))
)

// Per-type counts for the actions breakdown, most frequent first.
const ActionBreakdown = computed(() => {
  const counts = {}
  for (const p of Props.heatmap) {
    const type = p.event_type || 'other'
    counts[type] = (counts[type] || 0) + 1
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count, label: LabelForEvent(type), category: CategoryForEvent(type) }))
    .sort((a, b) => b.count - a.count)
})

// Show the heatmap whenever there's at least one mapped action.
const HasHeatmap = computed(() => HeatmapPoints.value.length >= 1)
const HasActions = computed(() => ActionMarkers.value.length >= 1)
const HasShotData = computed(() => Props.goals.length > 0 || Props.shots.length > 0)

// Default to the heatmap; fall back to whatever view has data.
const View = ref(HasHeatmap.value ? 'heatmap' : (HasActions.value ? 'actions' : 'shots'))

const ParsedGoals = computed(() =>
  Props.goals.map((g) => ({ pos: ParseFieldPosition(g.field_position), quadrant: g.quadrant }))
)
const ParsedShots = computed(() =>
  Props.shots.map((s) => ({ pos: ParseFieldPosition(s.field_position), quadrant: s.quadrant, onTarget: s.on_target !== false }))
)

// Origin markers (only events with a parseable field position)
const OriginMarkers = computed(() => {
  const Out = []
  for (const g of ParsedGoals.value) {
    if (g.pos) Out.push({ x: g.pos.XPct, y: g.pos.YPct, kind: 'goal' })
  }
  for (const s of ParsedShots.value) {
    if (s.pos) Out.push({ x: s.pos.XPct, y: s.pos.YPct, kind: s.onTarget ? 'shot' : 'off' })
  }
  return Out
})

const GoalTrajectories = computed(() =>
  ParsedGoals.value
    .filter((g) => g.pos)
    .map((g) => ({ x: g.pos.XPct, y: g.pos.YPct, targetX: GoalTargetXForQuadrant(g.quadrant) }))
)

const OnTargetTrajectories = computed(() =>
  ParsedShots.value
    .filter((s) => s.pos && s.onTarget)
    .map((s) => ({ x: s.pos.XPct, y: s.pos.YPct, targetX: GoalTargetXForQuadrant(s.quadrant) }))
)

// Quadrant placement counts (1–9)
const QuadrantGoals = (q) => Props.goals.filter((g) => g.quadrant === q).length
const QuadrantShots = (q) => Props.shots.filter((s) => s.quadrant === q && s.on_target !== false).length
const HasQuadrantData = computed(() =>
  Props.goals.some((g) => g.quadrant) || Props.shots.some((s) => s.quadrant && s.on_target !== false)
)
</script>

<style scoped>
.mini-shotmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── View switcher ─────────────────────────────────────────────── */
.mini-shotmap__viewtabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  align-self: center;
}

.mini-shotmap__viewtab {
  min-height: 32px;
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.mini-shotmap__viewtab.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.mini-shotmap__note {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Heatmap ───────────────────────────────────────────────────── */
.mini-shotmap__heatmap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mini-shotmap__heatmap :deep(.heatmap-canvas) {
  max-width: 260px;
}

/* ── Actions ───────────────────────────────────────────────────── */
.mini-shotmap__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: center;
}

.mini-shotmap__amarker {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.mini-shotmap__amarker.is-positive  { background: var(--color-success); }
.mini-shotmap__amarker.is-defensive { background: var(--color-info); }
.mini-shotmap__amarker.is-negative  { background: var(--color-danger); }
.mini-shotmap__amarker.is-neutral   { background: var(--color-neutral); }

.mini-shotmap__breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mini-shotmap__breakdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.mini-shotmap__breakdown-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.mini-shotmap__breakdown-dot.is-positive  { background: var(--color-success); }
.mini-shotmap__breakdown-dot.is-defensive { background: var(--color-info); }
.mini-shotmap__breakdown-dot.is-negative  { background: var(--color-danger); }
.mini-shotmap__breakdown-dot.is-neutral   { background: var(--color-neutral); }

.mini-shotmap__breakdown-count {
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  min-width: 16px;
}

.mini-shotmap__breakdown-label {
  color: var(--color-text-muted);
}

/* ── Shots ─────────────────────────────────────────────────────── */
.mini-shotmap__shots {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mini-shotmap__empty {
  text-align: center;
  padding: var(--space-5) var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.mini-shotmap__empty-icon {
  display: block;
  font-size: 1.6rem;
  margin-bottom: 6px;
  opacity: 0.7;
}

.mini-shotmap__empty p { margin: 0; }

.mini-shotmap__panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.mini-shotmap__panel {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-shotmap__cap {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  text-align: center;
}

.mini-shotmap__pitch {
  position: relative;
  width: 100%;
  max-width: 220px;
  margin: 0 auto;
  aspect-ratio: 3 / 4;
  background: var(--color-bg-field);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mini-shotmap__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pitch-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 0.6;
}

.traj {
  fill: none;
  stroke-width: 0.7;
  vector-effect: non-scaling-stroke;
}

.traj--shot { stroke: rgba(59, 130, 246, 0.5); }
.traj--goal { stroke: rgba(76, 218, 156, 0.65); stroke-width: 1; }

.mini-shotmap__marker {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.mini-shotmap__marker--goal { background: var(--color-success); }
.mini-shotmap__marker--shot { background: var(--color-info); }
.mini-shotmap__marker--off  { background: var(--color-danger); }

.mini-shotmap__goal {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 220px;
  margin: 0 auto;
  aspect-ratio: 3 / 2;
  padding: 4px;
  background: var(--color-bg-field);
  border-radius: var(--radius-sm);
}

.mini-shotmap__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.mini-shotmap__cell.is-hit {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.14);
}

.mini-shotmap__pill {
  min-width: 16px;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  font-size: 0.62rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.4;
  text-align: center;
}

.mini-shotmap__pill--goal { background: var(--color-success); color: #04130c; }
.mini-shotmap__pill--shot { background: var(--color-info-bg, rgba(59,130,246,0.18)); color: var(--color-info); }

.mini-shotmap__sub-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  pointer-events: none;
}

.mini-shotmap__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.mini-shotmap__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot--goal { background: var(--color-success); }
.dot--shot { background: var(--color-info); }
.dot--off  { background: var(--color-danger); }

@media (min-width: 420px) {
  .mini-shotmap__panels {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .mini-shotmap__actions {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
