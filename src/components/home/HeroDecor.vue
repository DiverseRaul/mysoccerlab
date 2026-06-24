<template>
  <div class="decor" data-testid="hero-decor" aria-hidden="true">
    <svg class="decor__svg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Heat-zone radial glows. Each stop is light at the centre, fading out. -->
        <radialGradient id="heat-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.95" />
          <stop offset="45%" stop-color="var(--color-accent)" stop-opacity="0.45" />
          <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="heat-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#19c6c0" stop-opacity="0.9" />
          <stop offset="45%" stop-color="#19c6c0" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#19c6c0" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="heat-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.85" />
          <stop offset="50%" stop-color="var(--color-accent)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="heat-d" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffd166" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#ffd166" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0" />
        </radialGradient>

        <!-- Clip everything to the rounded pitch so blobs never bleed outside. -->
        <clipPath id="pitch-clip"><rect x="86" y="24" width="228" height="352" rx="14" /></clipPath>
      </defs>

      <!-- Whole pitch breathes gently (fades in/out on a slow loop). -->
      <g class="breathe">
        <!-- Vertical pitch frame (portrait orientation) -->
        <rect x="86" y="24" width="228" height="352" rx="14"
              fill="rgba(255,255,255,0.015)"
              stroke="rgba(255,255,255,0.14)" stroke-width="1.5" />
        <!-- halfway line + centre circle -->
        <line x1="86" y1="200" x2="314" y2="200" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <circle cx="200" cy="200" r="34" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <circle cx="200" cy="200" r="2" fill="rgba(255,255,255,0.3)" />
        <!-- top (attacking) penalty box + goal area + goal -->
        <rect x="140" y="24" width="120" height="52" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <rect x="168" y="24" width="64" height="22" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <circle cx="200" cy="62" r="1.5" fill="rgba(255,255,255,0.3)" />
        <line x1="188" y1="24" x2="212" y2="24" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" />
        <!-- bottom (defensive) penalty box + goal area + goal -->
        <rect x="140" y="324" width="120" height="52" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <rect x="168" y="354" width="64" height="22" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <circle cx="200" cy="338" r="1.5" fill="rgba(255,255,255,0.3)" />
        <line x1="188" y1="376" x2="212" y2="376" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" />

        <!-- Heat zones, clipped to the pitch. Each pulses + drifts on its own timing. -->
        <g clip-path="url(#pitch-clip)">
          <circle class="zone zone--a" cx="200" cy="85" r="58" fill="url(#heat-a)" />
          <circle class="zone zone--b" cx="165" cy="180" r="54" fill="url(#heat-b)" />
          <circle class="zone zone--c" cx="235" cy="255" r="50" fill="url(#heat-c)" />
          <circle class="zone zone--d" cx="200" cy="335" r="46" fill="url(#heat-d)" />
        </g>

        <!-- Scan line sweeps top→bottom for the data-viz feel. -->
        <rect class="scan" clip-path="url(#pitch-clip)" x="86" y="0" width="228" height="2.5"
              fill="var(--color-accent)" fill-opacity="0.4" />

        <!-- Player marker: pulsing radar rings around your position. -->
        <g class="marker">
          <circle class="marker__ring marker__ring--1" cx="200" cy="200" r="6" fill="none"
                  stroke="var(--color-accent)" stroke-width="1.5" />
          <circle class="marker__ring marker__ring--2" cx="200" cy="200" r="6" fill="none"
                  stroke="var(--color-accent)" stroke-width="1" stroke-opacity="0.6" />
          <circle cx="200" cy="200" r="4" fill="var(--color-on-accent)"
                  stroke="var(--color-accent)" stroke-width="2" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
// Tactical heatmap: a vertical (portrait) pitch with breathing heat zones, a
// vertical sweeping scan line and a pulsing player marker. All motion is pure
// CSS (this project intentionally ignores prefers-reduced-motion).
</script>

<style scoped>
.decor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.decor__svg {
  width: 100%;
  height: 100%;
  max-width: 620px;
  max-height: 840px;
  overflow: visible;
}

/* Whole pitch group fades gently on a loop. */
.breathe { animation: breathe 6s ease-in-out infinite; transform-origin: center; transform-box: view-box; }
@keyframes breathe { 0%, 100% { opacity: 0.86; } 50% { opacity: 1; } }

/* Heat zones: each pulses scale + opacity and drifts a little, staggered.
   transform-box: view-box keeps the scaling centred on each circle's own cx/cy. */
.zone {
  transform-box: view-box;
  transform-origin: center;
  will-change: transform, opacity;
}
.zone--a { animation: pulse-a 5.5s ease-in-out infinite; }
.zone--b { animation: pulse-b 6.4s ease-in-out infinite; }
.zone--c { animation: pulse-c 5.9s ease-in-out infinite; }
.zone--d { animation: pulse-d 7s ease-in-out infinite; }

@keyframes pulse-a {
  0%, 100% { transform: translate(0, 0) scale(1);    opacity: 0.55; }
  50%      { transform: translate(6px, 6px) scale(1.12); opacity: 0.95; }
}
@keyframes pulse-b {
  0%, 100% { transform: translate(0, 0) scale(1.05); opacity: 0.5; }
  50%      { transform: translate(-8px, 4px) scale(0.92); opacity: 0.9; }
}
@keyframes pulse-c {
  0%, 100% { transform: translate(0, 0) scale(0.95); opacity: 0.45; }
  50%      { transform: translate(8px, -6px) scale(1.1);  opacity: 0.85; }
}
@keyframes pulse-d {
  0%, 100% { transform: translate(0, 0) scale(1);    opacity: 0.35; }
  50%      { transform: translate(-6px, -6px) scale(1.15); opacity: 0.7; }
}

/* Scan line sweeps down the pitch (translateY over the 400-tall viewBox). */
.scan {
  transform-box: view-box;
  transform-origin: top center;
  animation: scan 5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes scan {
  0%   { transform: translateY(24px);  opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(373px); opacity: 0; }
}

/* Player marker: two radar rings ripple outward at staggered timings. */
.marker__ring { transform-box: view-box; transform-origin: 200px 200px; }
.marker__ring--1 { animation: ripple 2.4s ease-out infinite; }
.marker__ring--2 { animation: ripple 2.4s ease-out infinite 1.2s; }
@keyframes ripple {
  0%   { transform: scale(1);   opacity: 0.9; }
  100% { transform: scale(4.5); opacity: 0; }
}
</style>
