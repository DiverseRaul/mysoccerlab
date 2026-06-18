<template>
  <canvas ref="CanvasEl" class="goal-heatmap" :width="Width" :height="Height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

// A proper density heatmap for the goal mouth (16:9), drawn with the same
// accumulate-alpha → colour-ramp technique as the pitch HeatmapCanvas. Fills
// its container; meant to overlay the shared GoalFrame3D.
const Props = defineProps({
  // [{ x_pct: 0-100, y_pct: 0-100 }]
  points: { type: Array, default: () => [] }
})

const Width = 384
const Height = 216
const CanvasEl = ref(null)

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
  for (const [Stop, [R, G, B, A]] of GradientStops) Grad.addColorStop(Stop, `rgba(${R},${G},${B},${A})`)
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

  const Radius = Props.points.length > 40 ? 40 : Props.points.length > 15 ? 50 : 64
  const PointAlpha = Props.points.length > 25 ? 0.38 : 0.5

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
.goal-heatmap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: screen;
  filter: blur(6px) saturate(1.15);
  z-index: 1;
}
</style>
