<template>
  <div class="goal-net" :class="{ 'goal-net--clickable': interactive }" @click="onClick">
    <span
      v-for="(m, i) in markers"
      :key="i"
      class="goal-net__dot"
      :class="`is-${m.kind || 'goal'}`"
      :style="{ left: m.x + '%', top: m.y + '%' }"
      :title="m.label || ''"
    ></span>
    <span v-if="interactive && !markers.length" class="goal-net__hint">Tap where it went</span>
    <p v-else-if="!markers.length && showEmpty" class="goal-net__empty">No placements</p>
  </div>
</template>

<script setup>
// Single source of truth for the goal-mouth view (where in the net the ball
// went). Used by the dashboard/feed shot map, the counter-logging placement
// step, and the map-logger pin popover so every goal net looks identical.
const props = defineProps({
  markers: { type: Array, default: () => [] }, // [{ x: 0-100, y: 0-100, kind, label? }]
  interactive: { type: Boolean, default: false },
  showEmpty: { type: Boolean, default: false }
})
const emit = defineEmits(['select'])

const onClick = (e) => {
  if (!props.interactive) return
  const r = e.currentTarget.getBoundingClientRect()
  emit('select', {
    xPct: ((e.clientX - r.left) / r.width) * 100,
    yPct: ((e.clientY - r.top) / r.height) * 100
  })
}
</script>

<style scoped>
.goal-net {
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  aspect-ratio: 3 / 2;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  /* Net: fine grid over a dark mouth. */
  background:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px) 0 0 / 100% 16.66%,
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px) 0 0 / 8.33% 100%,
    rgba(0, 0, 0, 0.45);
  box-shadow: var(--shadow-md), inset 0 0 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.goal-net--clickable { cursor: crosshair; }

.goal-net__dot {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
}
.goal-net__dot.is-goal { background: var(--color-success); }
.goal-net__dot.is-shot,
.goal-net__dot.is-on-target { background: var(--color-info); }
.goal-net__dot.is-off,
.goal-net__dot.is-off-target { background: var(--color-danger); }

.goal-net__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}
.goal-net__empty {
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
</style>
