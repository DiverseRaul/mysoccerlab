<template>
  <div class="pitch-surface">
    <!-- Full-pitch markings (portrait, attacking both ends). 100 × 150 units. -->
    <svg class="pitch-surface__lines" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
      <!-- Mowing stripes -->
      <g class="pitch-surface__stripes">
        <rect x="0" y="0"   width="100" height="18.75" />
        <rect x="0" y="37.5" width="100" height="18.75" />
        <rect x="0" y="75"  width="100" height="18.75" />
        <rect x="0" y="112.5" width="100" height="18.75" />
      </g>
      <!-- Outline -->
      <rect x="2" y="2" width="96" height="146" rx="1.5" />
      <!-- Halfway line + centre circle + spot -->
      <line x1="2" y1="75" x2="98" y2="75" />
      <circle cx="50" cy="75" r="11" />
      <circle cx="50" cy="75" r="0.9" class="pitch-surface__spot" />
      <!-- Top box: penalty area, 6-yard box, spot, arc -->
      <rect x="24" y="2" width="52" height="22" />
      <rect x="38" y="2" width="24" height="9" />
      <circle cx="50" cy="16" r="0.9" class="pitch-surface__spot" />
      <path d="M 38.5 24 A 11 11 0 0 0 61.5 24" fill="none" />
      <!-- Bottom box -->
      <rect x="24" y="126" width="52" height="22" />
      <rect x="38" y="139" width="24" height="9" />
      <circle cx="50" cy="134" r="0.9" class="pitch-surface__spot" />
      <path d="M 38.5 126 A 11 11 0 0 1 61.5 126" fill="none" />
      <!-- Corner arcs -->
      <path d="M 2 5 A 3 3 0 0 0 5 2" fill="none" />
      <path d="M 95 2 A 3 3 0 0 0 98 5" fill="none" />
      <path d="M 2 145 A 3 3 0 0 1 5 148" fill="none" />
      <path d="M 98 145 A 3 3 0 0 1 95 148" fill="none" />
      <!-- Goals -->
      <rect x="44" y="0.4" width="12" height="1.6" class="pitch-surface__goal" />
      <rect x="44" y="148" width="12" height="1.6" class="pitch-surface__goal" />
    </svg>
    <slot />
  </div>
</template>

<script setup>
// Single source of truth for the soccer-pitch look used across the whole app
// (heatmaps, shot maps, pass maps, position picker). A portrait full pitch with
// a green grass surface, mowing stripes and proper markings. Consumers overlay
// their own content (canvas, markers, arrows) via the default slot.
</script>

<style scoped>
.pitch-surface {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  /* Grass: a deeper green base with a soft top-light, on the field token. */
  background:
    radial-gradient(120% 75% at 50% 28%, rgba(60, 120, 78, 0.45), rgba(22, 46, 32, 0.96) 70%),
    #16301f;
}

.pitch-surface__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pitch-surface__lines rect,
.pitch-surface__lines line,
.pitch-surface__lines circle,
.pitch-surface__lines path {
  stroke: rgba(255, 255, 255, 0.42);
  stroke-width: 0.4;
  fill: none;
}

/* Mowing stripes — alternating lighter bands. */
.pitch-surface__stripes rect {
  stroke: none;
  fill: rgba(255, 255, 255, 0.035);
}

.pitch-surface__spot { fill: rgba(255, 255, 255, 0.55); stroke: none; }
.pitch-surface__goal { fill: rgba(255, 255, 255, 0.22); stroke: rgba(255, 255, 255, 0.5); }
</style>
