<template>
  <div class="heatmap-canvas" data-testid="heatmap-canvas">
    <div class="heatmap-canvas__pitch">
      <svg class="heatmap-canvas__markings" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="98" height="148" rx="2" />
        <line x1="1" y1="75" x2="99" y2="75" />
        <circle cx="50" cy="75" r="12" fill="none" />
        <rect x="25" y="1" width="50" height="22" fill="none" />
        <rect x="40" y="1" width="20" height="8" fill="none" />
        <rect x="25" y="127" width="50" height="22" fill="none" />
        <rect x="40" y="141" width="20" height="8" fill="none" />
      </svg>
      <canvas ref="CanvasEl" class="heatmap-canvas__layer" :width="Width" :height="Height"></canvas>
      <p v-if="!points.length" class="heatmap-canvas__empty">No actions mapped</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const Props = defineProps({
  // [{ x_pct: 0-100, y_pct: 0-100 }] — any logged spatial action.
  points: { type: Array, default: () => [] }
})

// Fixed internal resolution (2:3 portrait); CSS scales it to the container.
const Width = 300
const Height = 450
const CanvasEl = ref(null)

// Density → color ramp: cool teal (low) → brand mint → warm amber → soft red.
// Tuned to read clean and on-brand rather than a harsh rainbow.
const GradientStops = [
  [0.0, [56, 189, 180, 0]],
  [0.22, [56, 189, 180, 0.5]],
  [0.45, [76, 218, 156, 0.72]],
  [0.7, [250, 204, 80, 0.85]],
  [1.0, [239, 120, 90, 0.95]]
]

let Palette = null

const BuildPalette = () => {
  const Pal = document.createElement('canvas')
  Pal.width = 256
  Pal.height = 1
  const Ctx = Pal.getContext('2d')
  const Grad = Ctx.createLinearGradient(0, 0, 256, 0)
  for (const [Stop, [R, G, B, A]] of GradientStops) {
    Grad.addColorStop(Stop, `rgba(${R},${G},${B},${A})`)
  }
  Ctx.fillStyle = Grad
  Ctx.fillRect(0, 0, 256, 1)
  Palette = Ctx.getImageData(0, 0, 256, 1).data
}

const Draw = () => {
  const Canvas = CanvasEl.value
  if (!Canvas) return
  const Ctx = Canvas.getContext('2d')
  Ctx.clearRect(0, 0, Width, Height)
  if (!Props.points.length) return
  if (!Palette) BuildPalette()

  // Radius scales gently with how many points there are so a few taps still
  // read as a heat blob and a busy match doesn't turn into one solid blob.
  const Radius = Props.points.length > 40 ? 40 : Props.points.length > 15 ? 50 : 60
  const PointAlpha = Props.points.length > 25 ? 0.2 : 0.28

  // 1) Accumulate translucent alpha blobs (overlaps build intensity).
  for (const P of Props.points) {
    const X = (Number(P.x_pct) / 100) * Width
    const Y = (Number(P.y_pct) / 100) * Height
    if (!Number.isFinite(X) || !Number.isFinite(Y)) continue
    Ctx.globalAlpha = PointAlpha
    const Blob = Ctx.createRadialGradient(X, Y, 0, X, Y, Radius)
    Blob.addColorStop(0, 'rgba(0,0,0,1)')
    Blob.addColorStop(1, 'rgba(0,0,0,0)')
    Ctx.fillStyle = Blob
    Ctx.beginPath()
    Ctx.arc(X, Y, Radius, 0, Math.PI * 2)
    Ctx.fill()
  }
  Ctx.globalAlpha = 1

  // 2) Recolor each pixel by its accumulated alpha using the palette.
  const Img = Ctx.getImageData(0, 0, Width, Height)
  const D = Img.data
  for (let i = 0; i < D.length; i += 4) {
    const Alpha = D[i + 3]
    if (Alpha === 0) continue
    const Offset = Alpha * 4
    D[i] = Palette[Offset]
    D[i + 1] = Palette[Offset + 1]
    D[i + 2] = Palette[Offset + 2]
    D[i + 3] = Palette[Offset + 3]
  }
  Ctx.putImageData(Img, 0, 0)
}

onMounted(() => { BuildPalette(); Draw() })
watch(() => Props.points, () => nextTick(Draw), { deep: true })
</script>

<style scoped>
.heatmap-canvas {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

.heatmap-canvas__pitch {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, rgba(34, 80, 50, 0.35), rgba(20, 24, 22, 0.95)),
    var(--color-bg-field);
}

.heatmap-canvas__markings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.heatmap-canvas__markings rect,
.heatmap-canvas__markings line,
.heatmap-canvas__markings circle {
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 0.5;
  fill: none;
}

.heatmap-canvas__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  mix-blend-mode: screen;
  /* Soften blob edges so the density reads as one smooth surface. */
  filter: blur(3px) saturate(1.05);
}

.heatmap-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}
</style>
