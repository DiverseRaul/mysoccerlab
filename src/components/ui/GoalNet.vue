<template>
  <GoalFrame3D
    :max-width="maxWidth"
    class="goal-net"
    :class="{ 'goal-net--clickable': interactive }"
    @click="onClick"
  >
    <div class="goal-net__markers">
      <span
        v-for="(m, i) in markers"
        :key="i"
        class="goal-net__dot"
        :class="`is-${m.kind || 'goal'}`"
        :style="{ left: m.x + '%', top: m.y + '%' }"
        :title="m.label || ''"
      ></span>
    </div>
    <span v-if="interactive && !markers.length" class="goal-net__hint">Tap where it went</span>
    <p v-else-if="!markers.length && showEmpty" class="goal-net__empty">No placements</p>
  </GoalFrame3D>
</template>

<script setup>
// Goal-mouth view (where in the net the ball went). Renders the shared 3D
// goal frame so the dashboard shot map, the counter-logging placement step,
// the map-logger pin popover and the feed all look identical.
import GoalFrame3D from './GoalFrame3D.vue'

const props = defineProps({
  markers: { type: Array, default: () => [] }, // [{ x: 0-100, y: 0-100, kind, label? }]
  interactive: { type: Boolean, default: false },
  showEmpty: { type: Boolean, default: false },
  maxWidth: { type: String, default: '380px' }
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
.goal-net--clickable { cursor: crosshair; }

.goal-net__markers {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.goal-net__dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.55);
}
.goal-net__dot.is-goal {
  background: var(--color-success);
  width: 16px;
  height: 16px;
  box-shadow: 0 0 8px color-mix(in srgb, var(--color-accent) 60%, transparent);
}
.goal-net__dot.is-shot,
.goal-net__dot.is-on-target { background: var(--color-info); box-shadow: 0 0 6px rgba(59, 130, 246, 0.5); }
.goal-net__dot.is-off,
.goal-net__dot.is-off-target { background: var(--color-danger); box-shadow: 0 0 6px rgba(239, 83, 80, 0.5); }

.goal-net__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
  z-index: 6;
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
  z-index: 6;
}
</style>
