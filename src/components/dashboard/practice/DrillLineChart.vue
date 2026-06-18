<template>
  <div class="chart-wrap" data-testid="practice-line-chart">
    <svg
      v-if="points.length >= 1"
      :viewBox="`0 0 ${width} ${height}`"
      class="chart-svg"
      role="img"
      :aria-label="`Line chart of ${drill.name} sessions over time`"
    >
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Horizontal gridlines + y-axis labels -->
      <g v-for="(g, i) in gridLines" :key="`g-${i}`">
        <line
          :x1="padding.left" :x2="width - padding.right"
          :y1="g.y" :y2="g.y"
          stroke="var(--color-border-subtle)" stroke-width="1"
        />
        <text
          :x="padding.left - 10" :y="g.y + 4"
          text-anchor="end" class="axis-label"
        >{{ g.label }}</text>
      </g>

      <!-- Target line -->
      <template v-if="targetY !== null">
        <line
          :x1="padding.left" :x2="width - padding.right"
          :y1="targetY" :y2="targetY"
          stroke="var(--color-accent)" stroke-opacity="0.5"
          stroke-dasharray="6 5" stroke-width="1.5"
        />
        <text :x="width - padding.right" :y="targetY - 7" text-anchor="end" class="target-label">
          Target {{ drill.target_value }}
        </text>
      </template>

      <!-- Area fill under the line -->
      <path v-if="points.length >= 2" :d="areaPath" :fill="`url(#${gradId})`" />

      <!-- Line -->
      <polyline
        v-if="points.length >= 2"
        :points="polylinePoints"
        fill="none" stroke="var(--color-accent)"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
      />

      <!-- Points -->
      <g v-for="(p, i) in points" :key="`p-${i}`">
        <circle
          :cx="p.x" :cy="p.y" :r="p.isPB ? 6 : 4.5"
          :fill="p.isPB ? 'var(--color-accent)' : 'var(--color-bg-page)'"
          stroke="var(--color-accent)" stroke-width="2.5"
        />
        <title>{{ p.label }}</title>
      </g>

      <!-- X-axis date labels (thinned so they never overlap) -->
      <text
        v-for="(p, i) in xLabels" :key="`xl-${i}`"
        :x="p.x" :y="height - padding.bottom + 22"
        text-anchor="middle" class="axis-label"
      >{{ p.date }}</text>
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

const width = 720
const height = 320
const padding = { top: 24, right: 24, bottom: 44, left: 52 }

// Unique-ish gradient id so multiple charts on one page don't clash.
const gradId = computed(() => `drill-grad-${props.drill?.id ?? 'x'}`)

const sorted = computed(() => sortByDateAsc(props.sessions))
const pb = computed(() => personalBest(props.sessions, props.drill))
const scores = computed(() => sorted.value.map(s => sessionScore(s, props.drill)))

const fmtDate = (iso) => {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const yRange = computed(() => {
  const vals = scores.value.filter(v => v !== null)
  if (vals.length === 0) return { min: 0, max: 1 }
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  const t = Number(props.drill.target_value)
  if (Number.isFinite(t)) { min = Math.min(min, t); max = Math.max(max, t) }
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.2 : 1
    min -= pad; max += pad
  } else {
    const pad = (max - min) * 0.12
    min -= pad; max += pad
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
    return { x, y, isPB, date: fmtDate(s.session_date), label: `${fmtDate(s.session_date)} — ${formatValue(s, props.drill)}` }
  })
})

const polylinePoints = computed(() =>
  points.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
)

// Closed area under the line for the gradient fill.
const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const base = height - padding.bottom
  const top = points.value.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `M ${first.x.toFixed(1)} ${base} ${top} L ${last.x.toFixed(1)} ${base} Z`
})

// Show at most ~6 x-axis labels, evenly spaced, always including first + last.
const xLabels = computed(() => {
  const n = points.value.length
  if (n === 0) return []
  if (n <= 6) return points.value
  const step = (n - 1) / 5
  const idxs = new Set()
  for (let k = 0; k < 6; k++) idxs.add(Math.round(k * step))
  return [...idxs].sort((a, b) => a - b).map(i => points.value[i])
})

const gridLines = computed(() => {
  const { min, max } = yRange.value
  const steps = 4
  const out = []
  for (let i = 0; i <= steps; i++) {
    const v = min + (max - min) * (i / steps)
    out.push({ y: yToPx(v), label: Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1) })
  }
  return out
})

const targetY = computed(() => {
  const num = Number(props.drill.target_value)
  return Number.isFinite(num) ? yToPx(num) : null
})
</script>

<style scoped>
.chart-wrap {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.chart-svg { width: 100%; height: auto; display: block; }

.axis-label { fill: var(--color-text-muted); font-size: 13px; font-family: inherit; }
.target-label { fill: var(--color-accent); font-size: 12px; font-weight: 600; font-family: inherit; }

.chart-empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
  font-style: italic;
}
</style>
