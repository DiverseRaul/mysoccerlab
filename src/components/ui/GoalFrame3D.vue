<template>
  <div class="goal-3d" :class="{ 'goal-3d--fill': fill }" :style="fill ? null : { maxWidth }">
    <!-- The perspective net (back panel + edges + mesh), behind the markers. -->
    <svg class="goal-3d__depth" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true">
      <!-- Front view: the back net fills down to the goal line (flat bottom),
           with only the top-left/top-right corners angled in for a little side
           depth — no receding floor. -->
      <rect class="net-back" x="9" y="8" width="82" height="54" />
      <line class="net-edge" x1="0" y1="0" x2="9" y2="8" />
      <line class="net-edge" x1="100" y1="0" x2="91" y2="8" />
      <g class="net-mesh">
        <line x1="22" y1="8" x2="22" y2="62" />
        <line x1="35" y1="8" x2="35" y2="62" />
        <line x1="48" y1="8" x2="48" y2="62" />
        <line x1="61" y1="8" x2="61" y2="62" />
        <line x1="74" y1="8" x2="74" y2="62" />
        <line x1="9" y1="20" x2="91" y2="20" />
        <line x1="9" y1="32" x2="91" y2="32" />
        <line x1="9" y1="44" x2="91" y2="44" />
        <line x1="9" y1="56" x2="91" y2="56" />
      </g>
    </svg>
    <!-- Markers / overlays / hints live here, on top of the net. -->
    <slot />
  </div>
</template>

<script setup>
// The single 3D goal-net frame used across the app (dashboard shot-map
// analytics, the match tracker, the feed, and the practice goal-map drill) so
// every goal looks identical. Markers are provided by the consumer via the
// default slot and positioned with left/top % over this box.
defineProps({
  maxWidth: { type: String, default: '380px' },
  // Fill the parent box instead of using max-width + 16:9 aspect (used when the
  // goal is placed as a sub-region of a larger tappable surface).
  fill: { type: Boolean, default: false }
})
</script>

<style scoped>
.goal-3d {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  /* Recessed net interior — gently darker toward the back for depth. */
  background: radial-gradient(110% 120% at 50% 6%, rgba(34, 40, 46, 0.95), rgba(16, 19, 22, 0.97));
  /* White tubular posts + crossbar (no ground bar). */
  border: 7px solid #e9eef1;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.45),
    inset 0 2px 0 rgba(255, 255, 255, 0.6),
    inset 0 0 28px rgba(0, 0, 0, 0.4);
}

.goal-3d--fill {
  aspect-ratio: auto;
  height: 100%;
  max-width: none;
}

/* Tubular sheen down the posts/crossbar. */
.goal-3d::before {
  content: '';
  position: absolute;
  inset: -7px -7px 0 -7px;
  border: 7px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(#fff, transparent) top / 100% 7px no-repeat;
  opacity: 0.4;
  pointer-events: none;
}

.goal-3d__depth {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.goal-3d__depth .net-edge,
.goal-3d__depth .net-mesh line {
  stroke: rgba(255, 255, 255, 0.16);
  stroke-width: 0.5;
  vector-effect: non-scaling-stroke;
}

.goal-3d__depth .net-back {
  fill: rgba(0, 0, 0, 0.25);
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
}
</style>
