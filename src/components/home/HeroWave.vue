<template>
  <div class="herowave" aria-hidden="true">
    <!-- Aurora borealis: vertical curtains of green/teal light, ALWAYS moving.
         Three continuous motions per curtain (rising light band, fabric sway,
         colour shimmer) + a heavy scroll-driven tilt/intensify that reverses
         smoothly when you scroll back up (driven every frame, like the
         zoom-on-scroll sections). The bottom fade lives on the stationary
         container; the moving field overscans its bounds so scrolling never
         bares a hard edge. -->
    <div class="herowave__field">
      <span class="ribbon ribbon--1"></span>
      <span class="ribbon ribbon--2"></span>
      <span class="ribbon ribbon--3"></span>
      <span class="ribbon ribbon--4"></span>
      <span class="ribbon ribbon--5"></span>
    </div>
  </div>
</template>

<script setup>
// Aurora borealis for the mobile hero top. Per curtain: rising light flow,
// fabric sway, colour shimmer. On scroll the whole field tilts, zooms and
// intensifies (vars set by Home.vue's scroll handler) and reverses on scroll-up.
// Pure CSS. Root keeps the .herowave class for Home.vue's parallax wiring.
</script>

<style scoped>
.herowave {
  position: relative;
  width: 100%;
  height: 100%;        /* height provided by the parent (.hero__wave) */
  overflow: hidden;
  background: #050608; /* opaque base == page top colour so the fade blends */
  /* The fade lives on the STATIONARY container, fixed in screen space, so the
     bottom always dissolves smoothly into the #050608 base no matter how the
     moving field translates/scales/rotates inside. (Putting the mask on the
     transformed field dragged its solid-region edge into view as a hard line.) */
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 26%, rgba(0,0,0,0.72) 50%, rgba(0,0,0,0.3) 74%, transparent 96%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 26%, rgba(0,0,0,0.72) 50%, rgba(0,0,0,0.3) 74%, transparent 96%);
}

.herowave__field {
  position: absolute;
  /* Overscan well beyond the container on every side. The scroll motion below
     (parallax push-down + zoom + tilt) must never bare a field edge inside the
     clipped container — the overscan keeps the aurora full-bleed at every scroll
     position, so the only visible edges are the container's soft fade. */
  inset: -45% -28%;
  /* Scroll-driven "heavy" motion (vars set every frame by Home.vue; reverses on
     scroll-up): parallax + zoom + tilt + saturate/brightness intensify.
     Opacity is intentionally NOT faded — that caused the visible vanish glitch;
     the banner scrolls out of view on its own, so no fade is needed. */
  transform:
    translateY(var(--wave-y, 0px))
    scale(var(--wave-scale, 1))
    rotate(var(--wave-tilt, 0deg));
  transform-origin: center;
  filter: saturate(var(--wave-sat, 1)) brightness(var(--wave-boost, 1));
  transition: filter 0.15s linear;   /* tiny smoothing; transform is live from JS */
}

/* Each curtain is a vertical column of light. The gradient is tiled vertically
   (repeat-y) at a uniform 200px tile so the rising-band loop is perfectly
   seamless on every ribbon. */
.ribbon {
  position: absolute;
  top: -8%;
  height: 120%;
  background-repeat: repeat-y;
  background-size: 100% 200px;
  mix-blend-mode: screen;
  will-change: transform, filter, background-position;
}

.ribbon--1 {
  left: 2%; width: 30%;
  background-image: linear-gradient(to bottom,
    transparent 0%, rgba(76, 218, 156, 0.95) 42%, rgba(25, 198, 192, 0.45) 66%, transparent 100%);
  animation: flow-up 2.8s linear infinite, sway-1 9s ease-in-out infinite alternate, shimmer-1 5.5s ease-in-out infinite;
}
.ribbon--2 {
  left: 24%; width: 26%;
  background-image: linear-gradient(to bottom,
    transparent 0%, rgba(76, 218, 156, 0.85) 38%, rgba(124, 92, 255, 0.35) 70%, transparent 100%);
  animation: flow-up 3.6s linear infinite, sway-2 11s ease-in-out infinite alternate, shimmer-2 7s ease-in-out infinite;
}
.ribbon--3 {
  left: 47%; width: 32%;
  background-image: linear-gradient(to bottom,
    transparent 0%, rgba(76, 218, 156, 0.98) 40%, rgba(34, 197, 94, 0.5) 64%, transparent 100%);
  animation: flow-up 3.1s linear infinite, sway-3 8s ease-in-out infinite alternate, shimmer-1 6s ease-in-out infinite;
}
.ribbon--4 {
  left: 64%; width: 24%;
  background-image: linear-gradient(to bottom,
    transparent 0%, rgba(25, 198, 192, 0.9) 44%, rgba(76, 218, 156, 0.5) 68%, transparent 100%);
  animation: flow-up 4s linear infinite, sway-2 13s ease-in-out infinite alternate-reverse, shimmer-2 8s ease-in-out infinite;
}
.ribbon--5 {
  left: 80%; width: 28%;
  background-image: linear-gradient(to bottom,
    transparent 0%, rgba(76, 218, 156, 0.8) 42%, rgba(25, 198, 192, 0.4) 66%, transparent 100%);
  animation: flow-up 3.3s linear infinite, sway-1 10s ease-in-out infinite alternate-reverse, shimmer-1 6.5s ease-in-out infinite;
}

/* Light band rises exactly one 200px tile per loop → seamless, never jumps,
   never stops. */
@keyframes flow-up {
  from { background-position-y: 0; }
  to   { background-position-y: -200px; }
}

/* Fabric sway — big amplitude so it reads under the blur. */
@keyframes sway-1 {
  0%   { transform: translateX(-8%) skewX(-7deg); }
  100% { transform: translateX(10%) skewX(8deg); }
}
@keyframes sway-2 {
  0%   { transform: translateX(9%)  skewX(8deg); }
  100% { transform: translateX(-9%) skewX(-6deg); }
}
@keyframes sway-3 {
  0%   { transform: translateX(-7%) skewX(-5deg); }
  100% { transform: translateX(11%) skewX(7deg); }
}

/* Colour shimmer — blur + hue-rotate (green↔teal) + brightness, so each curtain
   breathes in both colour and intensity. */
@keyframes shimmer-1 {
  0%, 100% { filter: blur(30px) hue-rotate(0deg)  brightness(0.82); }
  50%      { filter: blur(26px) hue-rotate(22deg) brightness(1.18); }
}
@keyframes shimmer-2 {
  0%, 100% { filter: blur(32px) hue-rotate(-12deg) brightness(0.74); }
  50%      { filter: blur(28px) hue-rotate(18deg)  brightness(1.12); }
}
</style>
