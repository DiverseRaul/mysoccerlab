<template>
  <!-- Falling-pattern accent (Vue port of the shadcn/React falling-pattern).
       Pure CSS: layered radial-gradient "rain" streaks scrolling downward via an
       animated background-position, plus a blurred dot grid that breaks the
       streaks into a soft, organic shimmer. Tinted from --color-accent. -->
  <div class="falling" aria-hidden="true">
    <div class="falling__rain"></div>
    <div class="falling__veil"></div>
  </div>
</template>

<script setup>
// Decorative only — no props/state. Layered over the hero shader as a fine
// foreground texture. Motion is CSS-driven (this project always animates).
</script>

<style scoped>
.falling {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Vertical light streaks (the "falling" elements). Two long thin radial
   gradients per tile run down the column edges; a tiny dot sits mid-tile.
   The whole image scrolls down forever via background-position. */
.falling__rain {
  position: absolute;
  inset: -10% 0;
  --c: color-mix(in srgb, var(--color-accent) 90%, white 10%);
  background-image:
    radial-gradient(4px 120px at 0px 60px, var(--c), transparent),
    radial-gradient(4px 120px at 300px 60px, var(--c), transparent),
    radial-gradient(1.5px 1.5px at 150px 30px, var(--c) 100%, transparent 150%),
    radial-gradient(4px 120px at 0px 180px, var(--c), transparent),
    radial-gradient(4px 120px at 300px 180px, var(--c), transparent),
    radial-gradient(1.5px 1.5px at 150px 90px, var(--c) 100%, transparent 150%);
  background-size:
    300px 240px,
    300px 240px,
    300px 240px,
    300px 360px,
    300px 360px,
    300px 360px;
  opacity: 0.22;
  mix-blend-mode: screen;
  animation: fall 26s linear infinite;
}

/* Blurred dot-grid veil — the original's overlay trick. It punches a soft mesh
   over the streaks so they read as a shimmering field, not hard lines. */
.falling__veil {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  background-image: radial-gradient(circle at 50% 50%, transparent 0, transparent 1.5px, rgba(5, 6, 8, 0.55) 1.5px);
  background-size: 9px 9px;
  opacity: 0.5;
}

@keyframes fall {
  from { background-position: 0 0, 3px 0, 151.5px 0, 25px 0, 28px 0, 176.5px 0; }
  to   { background-position: 0 1920px, 3px 1920px, 151.5px 1944px, 25px 2880px, 28px 2880px, 176.5px 2904px; }
}
</style>
