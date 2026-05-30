<template>
  <div class="chart-wrap" data-testid="practice-line-chart">
    <svg
      v-if="points.length >= 1"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      class="chart-svg"
      role="img"
      :aria-label="`Line chart of ${drill.name} sessions over time`"
    >
      <!-- Horizontal gridlines -->
      <line
        v-for="(g, i) in gridLines"
        :key="`g-${i}`"
        :x1="padding.left" :x2="width - padding.right"
        :y1="g.y" :y2="g.y"
        stroke="rgba(255,255,255,0.06)"
        stroke-width="1"
      />

      <!-- Target line -->
      <line
        v-if="targetY !== null"
        :x1="padding.left" :x2="width - padding.right"
        :y1="targetY" :y2="targetY"
        stroke="rgba(76,218,156,0.5)"
        stroke-dasharray="4 4"
        stroke-width="1"
      />
      <text
        v-if="targetY !== null"
        :x="width - padding.right" :y="targetY - 4"
        text-anchor="end"
        fill="rgba(76,218,156,0.7)"
        font-size="9"
      >Target {{ drill.target_value }}</text>

      <!-- Polyline -->
      <polyline
        v-if="points.length >= 2"
        :points="polylinePoints"
        fill="none"
        stroke="var(--color-accent)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Points -->
      <g v-for="(p, i) in points" :key="`p-${i}`">
        <circle
          :cx="p.x" :cy="p.y" r="4"
          :fill="p.isPB ? 'var(--color-accent)' : 'var(--color-bg-page)'"
          stroke="var(--color-accent)"
          stroke-width="2"
        />
        <title>{{ p.label }}</title>
      </g>

      <!-- Y-axis labels -->
      <text
        v-for="(g, i) in gridLines"
        :key="`yl-${i}`"
        :x="padding.left - 6" :y="g.y + 3"
        text-anchor="end"
        fill="rgba(255,255,255,0.35)"
        font-size="9"
      >{{ g.label }}</text>
    </svg>

    <div v-else class="chart-empty">No sessions yet — log one to see the chart.</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  sessionScore,
  sortByDateAsc,
  personalBest,
  formatValue
} from '../../../lib/practiceFormat'

const props = defineProps({
  drill: { type: Object, required: true },
  sessions: { type: Array, default: () => [] }
})

const width = 600
const height = 220
const padding = { top: 16, right: 16, bottom: 28, left: 36 }

const sorted = computed(() => sortByDateAsc(props.sessions))
const pb = computed(() => personalBest(props.sessions, props.drill))

const scores = computed(() => sorted.value.map(s => sessionScore(s, props.drill)))

const yRange = computed(() => {
  const vals = scores.value.filter(v => v !== null)
  if (vals.length === 0) return { min: 0, max: 1 }
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  if (props.drill.target_value !== null && props.drill.target_value !== undefined) {
    const t = Number(props.drill.target_value)
    if (Number.isFinite(t)) {
      min = Math.min(min, t)
      max = Math.max(max, t)
    }
  }
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.2 : 1
    min -= pad
    max += pad
  } else {
    const pad = (max - min) * 0.12
    min -= pad
    max += pad
  }
  return { min, max }
})

const yToPx = (v) => {
  const { min, max } = yRange.value
  const frac = (v - min) / (max - min)
  return padding.top + (1 - frac) * (height - padding.top - padding.bottom)
}

const xToPx = (i, n) => {
  if (n <= 1) return (width - padding.left - padding.right) / 2 + padding.left
  const usable = width - padding.left - padding.right
  return padding.left + (i / (n - 1)) * usable
}

const points = computed(() => {
  const n = sorted.value.length
  return sorted.value.map((s, i) => {
    const score = scores.value[i]
    const x = xToPx(i, n)
    const y = score === null ? height - padding.bottom : yToPx(score)
    const isPB = pb.value && pb.value.id === s.id
    return {
      x, y, isPB,
      label: `${s.session_date} — ${formatValue(s, props.drill)}`
    }
  })
})

const polylinePoints = computed(() =>
  points.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
)

const gridLines = computed(() => {
  const { min, max } = yRange.value
  const steps = 4
  const out = []
  for (let i = 0; i <= steps; i++) {
    const v = min + (max - min) * (i / steps)
    out.push({
      y: yToPx(v),
      label: Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)
    })
  }
  return out
})

const targetY = computed(() => {
  const t = props.drill.target_value
  if (t === null || t === undefined || t === '') return null
  const num = Number(t)
  if (!Number.isFinite(num)) return null
  return yToPx(num)
})
</script>

<style scoped>
.chart-wrap {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.chart-svg { width: 100%; height: auto; display: block; }

.chart-empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
  font-style: italic;
}
</style>
