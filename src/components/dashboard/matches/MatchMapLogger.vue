<template>
  <div class="match-map-logger" data-testid="match-map-logger">
    <div class="match-map-logger__head">
      <h4 class="match-map-logger__title">{{ ModeMeta.title }}</h4>
      <p class="match-map-logger__hint">{{ ModeMeta.hint }}</p>
      <div class="match-map-logger__modes" role="tablist" aria-label="Map view">
        <button
          v-for="M in Modes"
          :key="M.key"
          type="button"
          class="match-map-logger__mode"
          :class="{ 'is-active': Mode === M.key, [`match-map-logger__mode--${M.key}`]: true }"
          role="tab"
          :aria-selected="Mode === M.key"
          :data-testid="`map-mode-${M.key}`"
          @click="SetMode(M.key)"
        >{{ M.label }}</button>
      </div>
    </div>

    <!-- Heatmap view: smooth density of every action (decluttered). -->
    <div v-if="Mode === 'heatmap'" class="match-map-logger__view" data-testid="map-heatmap-view">
      <HeatmapCanvas :points="HeatmapPoints" />
    </div>

    <!-- Timeline view: chronological log with undo. -->
    <MatchTimeline
      v-else-if="Mode === 'timeline'"
      :Events="TimelineEvents"
      @delete="Emit('delete-event', $event)"
    />

    <div
      v-else
      ref="CanvasEl"
      class="match-map-logger__canvas"
      :class="[`match-map-logger__canvas--${Mode}`]"
      role="img"
      :aria-label="`Pitch with ${Coordinates.length} action${Coordinates.length === 1 ? '' : 's'} logged`"
      @click="OnCanvasClick"
    >
      <svg class="match-map-logger__svg" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="map-halo-positive" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.7" />
            <stop offset="60%" stop-color="var(--color-accent)" stop-opacity="0.25" />
            <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="map-halo-defensive" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" />
            <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="map-halo-negative" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef5350" stop-opacity="0.65" />
            <stop offset="60%" stop-color="#ef5350" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#ef5350" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="map-halo-neutral" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#bdbdbd" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#bdbdbd" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="map-attack-tint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.12" />
            <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Attacking direction: the top half is where you attack. -->
        <rect x="1" y="1" width="98" height="74" fill="url(#map-attack-tint)" pointer-events="none" />
        <g pointer-events="none" stroke="color-mix(in srgb, var(--color-accent) 28%, transparent)" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="44,108 50,100 56,108" />
          <polyline points="44,117 50,109 56,117" />
        </g>
        <text x="50" y="41" text-anchor="middle" font-size="5" font-weight="700" letter-spacing="1.4" fill="color-mix(in srgb, var(--color-accent) 40%, transparent)" pointer-events="none">ATTACK</text>
        <text x="50" y="124" text-anchor="middle" font-size="4" font-weight="600" letter-spacing="1.2" fill="rgba(255,255,255,0.18)" pointer-events="none">YOUR HALF</text>

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

        <g class="match-map-logger__halos" style="mix-blend-mode: screen;">
          <circle
            v-for="(Coordinate, Index) in Coordinates"
            :key="`halo-${KeyFor(Coordinate, Index)}`"
            :cx="Coordinate.XPct"
            :cy="Coordinate.YPct * 1.5"
            r="11"
            :fill="`url(#map-halo-${Coordinate.Category})`"
          />
        </g>

        <!-- Pass direction arrows (events that recorded a destination). -->
        <g class="match-map-logger__arrows">
          <line
            v-for="(Pass, Index) in PassArrows"
            :key="`pass-${Pass.Id ?? Index}`"
            :x1="Pass.XPct" :y1="Pass.YPct * 1.5"
            :x2="Pass.EndX" :y2="Pass.EndY * 1.5"
            :stroke="Pass.Category === 'negative' ? 'rgba(239,83,80,0.7)' : 'color-mix(in srgb, var(--color-accent) 75%, transparent)'"
            stroke-width="0.8"
            marker-end="url(#map-pass-arrow)"
          />
        </g>

        <defs>
          <marker id="map-pass-arrow" markerWidth="5" markerHeight="5" refX="3.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="color-mix(in srgb, var(--color-accent) 85%, transparent)" />
          </marker>
        </defs>
      </svg>

      <button
        v-for="(Coordinate, Index) in Coordinates"
        :key="`pin-${KeyFor(Coordinate, Index)}`"
        type="button"
        class="match-map-logger__pin"
        :class="[
          `match-map-logger__pin--${Coordinate.Category}`,
          { 'is-active': ActiveKey === KeyFor(Coordinate, Index) }
        ]"
        :style="{ left: `${Coordinate.XPct}%`, top: `${Coordinate.YPct}%` }"
        :title="Coordinate.Label"
        data-testid="logged-event-pin"
        @click.stop="OnPinClick(Coordinate, Index)"
      ></button>

      <div
        v-if="PendingCoordinate"
        class="match-map-logger__ghost"
        :style="{ left: `${PendingCoordinate.XPct}%`, top: `${PendingCoordinate.YPct}%` }"
      ></div>

      <EventRadialMenu
        v-if="PendingCoordinate"
        :AnchorX="PendingCoordinate.ClientX"
        :AnchorY="PendingCoordinate.ClientY"
        :HideAttackingActions="IsDefensiveHalf(PendingCoordinate.YPct)"
        @Select="OnSelectAction"
        @Cancel="CloseMenu"
      />
    </div>

    <p v-if="Mode === 'log' || Mode === 'delete'" class="match-map-logger__count">{{ Coordinates.length }} logged on pitch</p>

    <!-- Pin popover lives on <body> (not inside the clipped canvas) so it never
         gets cut off at the pitch edges or hidden behind other layers. -->
    <Teleport to="body">
      <div
        v-if="ActiveCoordinate && ActivePinClient"
        class="match-map-logger__tooltip-portal"
        :style="TooltipStyle"
      >
        <div class="map-pin-popover" data-testid="delete-log-tooltip" @click.stop>
          <div class="map-pin-popover__head">
            <span class="map-pin-popover__label">{{ ActiveCoordinate.Label }}</span>
            <button type="button" class="map-pin-popover__close" aria-label="Close" @click="ClearActive">&times;</button>
          </div>

          <div v-if="ShowPlacement" class="map-pin-popover__placement">
            <span class="map-pin-popover__cap">Where it went</span>
            <ShotField
              mode="placement"
              :placement-marker="ActivePlacementMarker"
              :quadrant="ActiveCoordinate.Quadrant || 0"
              :show-placeholder="true"
            />
          </div>

          <div class="map-pin-popover__actions">
            <button type="button" class="map-pin-popover__btn map-pin-popover__btn--delete" data-testid="delete-log-button" @click="OnDelete">Delete event</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ToPercentCoordinate, IsDefensiveHalf } from '../../../lib/matchEvents'
import ShotField from '../../ui/ShotField.vue'
import EventRadialMenu from './EventRadialMenu.vue'
import HeatmapCanvas from '../../ui/HeatmapCanvas.vue'
import MatchTimeline from './MatchTimeline.vue'

const Props = defineProps({
  Coordinates: { type: Array, default: () => [] },
  HeatmapPoints: { type: Array, default: () => [] },
  TimelineEvents: { type: Array, default: () => [] }
})

const Emit = defineEmits(['LogEvent', 'DeletePin', 'delete-event'])

const CanvasEl = ref(null)
const PendingCoordinate = ref(null)
const ActiveKey = ref(null)
const ActivePinClient = ref(null)

// View switcher:
//  log     → every tap logs a new event; pins are inert (no interference).
//  delete  → tap a pin to view its placement / delete it; empty taps do nothing.
//  heatmap → smooth density of every action; markers hidden (declutter).
//  timeline→ chronological event log with undo.
const Mode = ref('log')

const Modes = [
  { key: 'log', label: 'Log', title: 'Tap the pitch to log', hint: 'Tap anywhere to log — past events never get in the way.' },
  { key: 'delete', label: 'Delete', title: 'Tap a pin to manage', hint: 'Tap a pin to see where it went or delete it.' },
  { key: 'heatmap', label: 'Heatmap', title: 'Match heatmap', hint: 'Every action as a smooth density map.' },
  { key: 'timeline', label: 'Timeline', title: 'Event timeline', hint: 'Everything you logged, newest first.' }
]

const ModeMeta = computed(() => Modes.find((M) => M.key === Mode.value) || Modes[0])

const KeyFor = (Coordinate, Index) => `${Coordinate.Source}-${Coordinate.Id ?? Index}`

const ActiveCoordinate = computed(() => {
  if (!ActiveKey.value) return null
  return Props.Coordinates.find((Coordinate, Index) => KeyFor(Coordinate, Index) === ActiveKey.value) || null
})

// Events that recorded a destination get a direction arrow on the pitch.
const PassArrows = computed(() =>
  Props.Coordinates.filter((C) => C.EndX != null && C.EndY != null)
)

// Show the goal-mouth placement for goals and on-target shots.
const ShowPlacement = computed(() => {
  const C = ActiveCoordinate.value
  if (!C) return false
  return C.Source === 'goal' || (C.Source === 'shot' && C.OnTarget)
})

const ActivePlacementMarker = computed(() => {
  const C = ActiveCoordinate.value
  if (!C || !C.Placement) return null
  const Parts = String(C.Placement).split(',').map(Number)
  if (Parts.length !== 2 || !Parts.every(Number.isFinite)) return null
  return { xPct: Parts[0], yPct: Parts[1], type: C.Source === 'goal' ? 'goal' : 'on-target' }
})

// Position the teleported popover in viewport (fixed) coordinates, fully clamped
// so the whole card stays on-screen regardless of which pin was tapped.
const TooltipStyle = computed(() => {
  const Pin = ActivePinClient.value
  if (!Pin) return {}
  const VW = typeof window !== 'undefined' ? window.innerWidth : 360
  const VH = typeof window !== 'undefined' ? window.innerHeight : 640
  const Height = ShowPlacement.value ? 260 : 96
  const Width = 216
  const Left = Math.min(Math.max(Pin.X, Width / 2 + 8), VW - Width / 2 - 8)
  let Top = Pin.Y - Height - 16
  if (Top < 8) Top = Pin.Y + 18
  Top = Math.min(Math.max(Top, 8), VH - Height - 8)
  return { left: `${Left}px`, top: `${Top}px`, width: `${Width}px`, transform: 'translate(-50%, 0)' }
})

const ClearActive = () => { ActiveKey.value = null; ActivePinClient.value = null }
const CloseMenu = () => { PendingCoordinate.value = null }

const SetMode = (NextMode) => {
  if (Mode.value === NextMode) return
  Mode.value = NextMode
  // Drop any transient UI when switching modes.
  CloseMenu()
  ClearActive()
}

const OnCanvasClick = (Event) => {
  if (Mode.value === 'delete') {
    // Managing events: a tap on empty space just dismisses an open popover.
    // (Pins handle their own taps; in this mode they're interactive.)
    if (Event.target.closest('.match-map-logger__pin')) return
    if (ActiveKey.value) ClearActive()
    return
  }
  // Log mode: every tap logs a new event. Pins are inert (pointer-events: none),
  // so taps over past events fall through here without interference.
  if (PendingCoordinate.value) { CloseMenu(); return }
  const Rect = Event.currentTarget.getBoundingClientRect()
  const Coordinate = ToPercentCoordinate(Event.clientX, Event.clientY, Rect)
  if (!Coordinate) return
  PendingCoordinate.value = { ...Coordinate, ClientX: Event.clientX, ClientY: Event.clientY }
}

const OnPinClick = (Coordinate, Index) => {
  if (Mode.value !== 'delete') return
  CloseMenu()
  const Key = KeyFor(Coordinate, Index)
  if (ActiveKey.value === Key) { ClearActive(); return }
  ActiveKey.value = Key
  // Resolve the pin's on-screen position so the body-level tooltip can anchor to it.
  const Rect = CanvasEl.value?.getBoundingClientRect()
  if (Rect) {
    ActivePinClient.value = {
      X: Rect.left + (Coordinate.XPct / 100) * Rect.width,
      Y: Rect.top + (Coordinate.YPct / 100) * Rect.height
    }
  }
}

const OnSelectAction = (ActionKey) => {
  const Coordinate = PendingCoordinate.value
  CloseMenu()
  if (!Coordinate) return
  Emit('LogEvent', { ActionKey, Coordinate })
}

const OnDelete = () => {
  const Coordinate = ActiveCoordinate.value
  ClearActive()
  if (!Coordinate) return
  Emit('DeletePin', Coordinate)
}
</script>

<style scoped>
.match-map-logger {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.match-map-logger__head {
  text-align: center;
}

.match-map-logger__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.match-map-logger__hint {
  margin: 4px 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.match-map-logger__modes {
  display: flex;
  gap: 4px;
  width: 100%;
  max-width: 340px;
  margin: 10px auto 0;
  padding: 3px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
}

.match-map-logger__mode {
  flex: 1;
  min-height: 36px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.match-map-logger__view {
  margin-top: 4px;
}

.match-map-logger__mode.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.match-map-logger__mode--delete.is-active {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.match-map-logger__canvas {
  position: relative;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-field);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.match-map-logger__canvas--log { cursor: crosshair; }

/* In Log mode pins are inert so taps fall through to the pitch and log; in
   Delete mode they're the tap targets for viewing/deleting. */
.match-map-logger__canvas--log .match-map-logger__pin { pointer-events: none; }
.match-map-logger__canvas--delete .match-map-logger__pin { cursor: pointer; }
.match-map-logger__canvas--delete { cursor: default; }

/* Log mode is for logging, not analysing — fade prior events right back so the
   pitch stays clean and uncrowded while you tap. Delete/Heatmap show them fully. */
.match-map-logger__canvas--log .match-map-logger__halos { opacity: 0.22; }
.match-map-logger__canvas--log .match-map-logger__arrows { opacity: 0.25; }
.match-map-logger__canvas--log .match-map-logger__pin::after {
  opacity: 0.45;
  box-shadow: none;
}

.match-map-logger__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.match-map-logger__pin {
  position: absolute;
  /* Hit area kept close to the visible 14px dot so taps next to an existing pin
     log a new event instead of being swallowed as a delete. */
  width: 18px;
  height: 18px;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.match-map-logger__pin::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  transition: width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease;
}

.match-map-logger__pin--positive::after { background: var(--color-success); }
.match-map-logger__pin--defensive::after { background: var(--color-info); }
.match-map-logger__pin--negative::after { background: var(--color-danger); }
.match-map-logger__pin--neutral::after { background: var(--color-neutral); }

.match-map-logger__pin.is-active::after {
  width: 20px;
  height: 20px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.55), 0 0 14px 4px rgba(255, 255, 255, 0.45);
}

.match-map-logger__ghost {
  position: absolute;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  border: 2px dashed rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  pointer-events: none;
}

.match-map-logger__count {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Teleported to <body>; fixed to the viewport near the tapped pin. */
.match-map-logger__tooltip-portal {
  position: fixed;
  z-index: 1200;
  pointer-events: auto;
}

.map-pin-popover {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: delete-log-pop 0.14s ease-out;
}

@keyframes delete-log-pop {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.map-pin-popover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.map-pin-popover__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.map-pin-popover__close {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.map-pin-popover__close:hover { color: var(--color-text-primary); }

.map-pin-popover__placement {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.map-pin-popover__cap {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-pin-popover__actions {
  display: flex;
  gap: var(--space-2);
}

.map-pin-popover__btn {
  flex: 1;
  min-height: 38px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.map-pin-popover__btn--delete {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.map-pin-popover__btn--delete:hover {
  background: var(--color-danger);
  color: #fff;
}
</style>
