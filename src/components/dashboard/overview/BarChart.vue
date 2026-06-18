<template>
  <div class="chart-area">
    <div class="chart-container" :class="{ 'chart-container--scrollable': scrollable }">
      <div
        v-for="(bar, i) in bars"
        :key="bar.key ?? i"
        class="bar-group"
        :class="{ 'bar-group--clickable': clickable }"
        :style="{ minWidth: scrollable ? '20px' : null }"
        :role="clickable ? 'button' : null"
        :tabindex="clickable ? 0 : null"
        @click="clickable && $emit('bar-click', bar)"
        @keyup.enter="clickable && $emit('bar-click', bar)"
      >
        <div class="bar-value">{{ bar.displayValue ?? bar.value }}</div>
        <div class="bar-track">
          <!-- Faint reference lines at 25/50/75% of the same scale the bars use,
               so heights are readable without a full y-axis. -->
          <span v-if="showGrid" v-for="g in GRID_PCTS" :key="'g' + g" class="grid-line" :style="{ bottom: g + '%' }"></span>

          <!-- Stacked bar (segments) or a single fill. -->
          <div
            v-if="bar.segments && bar.segments.length"
            class="bar-fill bar-fill--stacked"
            :style="{ height: barHeight(bar.value) }"
          >
            <div
              v-for="(seg, si) in bar.segments"
              :key="si"
              class="bar-seg"
              :class="seg.colorClass"
              :style="{ height: segPct(seg, bar), background: seg.fill }"
            ></div>
          </div>
          <div
            v-else
            class="bar-fill"
            :class="bar.colorClass"
            :style="{ height: barHeight(bar.value), background: bar.fill }"
          ></div>
        </div>
        <div class="bar-label" :style="{ fontSize: scrollable ? '0.55rem' : null }">
          {{ truncatedLabel(bar.label) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  bars: { type: Array, required: true },
  max: { type: Number, default: 1 },
  // 'absolute' divides by max; 'rating' divides by 10 (0–10 scale)
  scale: { type: String, default: 'absolute' },
  scrollable: { type: Boolean, default: false },
  labelChars: { type: Number, default: 3 },
  // Draw faint horizontal reference lines behind the bars.
  showGrid: { type: Boolean, default: false },
  // Make bars focusable/clickable; emits `bar-click` with the bar.
  clickable: { type: Boolean, default: false }
})

defineEmits(['bar-click'])

const GRID_PCTS = [25, 50, 75]

const barHeight = (value) => {
  const v = parseFloat(value) || 0
  if (v === 0) return '4px'
  let pct
  if (props.scale === 'rating') {
    pct = (v / 10) * 100
  } else {
    pct = (v / Math.max(props.max, 1)) * 100
  }
  return `${Math.max(pct, 15)}%`
}

// A segment's share of its bar's total height (stacked bars).
const segPct = (seg, bar) => {
  const total = parseFloat(bar.value) || 0
  const v = parseFloat(seg.value) || 0
  if (total <= 0) return '0%'
  return `${(v / total) * 100}%`
}

const truncatedLabel = (label) => {
  if (!label) return ''
  return label.length > props.labelChars ? label.substring(0, props.labelChars) : label
}
</script>

<style scoped>
.chart-area {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  margin-top: 16px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 160px;
  gap: 6px;
}

.chart-container--scrollable {
  overflow-x: auto;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.bar-group--clickable { cursor: pointer; }
.bar-group--clickable:hover .bar-fill,
.bar-group--clickable:hover .bar-fill--stacked { filter: brightness(1.18); }
.bar-group--clickable:focus-visible { outline: 2px solid var(--color-accent-border); outline-offset: 2px; border-radius: 4px; }

.bar-value {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.bar-track {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: flex-end;
  background: var(--color-bg-surface-2);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border-subtle);
  pointer-events: none;
}

.bar-fill {
  width: 100%;
  background: var(--color-accent);
  border-radius: 6px 6px 0 0;
  transition: height 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.bar-fill--stacked {
  display: flex;
  flex-direction: column-reverse; /* first segment sits at the bottom */
}

.bar-seg { width: 100%; }
.bar-seg:first-child { border-radius: 0; }
.bar-fill--stacked .bar-seg:last-child { border-radius: 6px 6px 0 0; }
.bar-seg.goal-seg { background: var(--color-accent); }
.bar-seg.assist-seg { background: var(--color-card-yellow); }

.bar-fill.goal-fill {
  background: var(--color-card-yellow);
}

.bar-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Rating tier colors for the bar fill. */
.bar-fill.rating-world-class { background: var(--color-rating-world-class); }
.bar-fill.rating-elite       { background: var(--color-rating-elite); }
.bar-fill.rating-excellent   { background: var(--color-rating-excellent); }
.bar-fill.rating-good        { background: var(--color-rating-good); }
.bar-fill.rating-average     { background: var(--color-rating-average); }
.bar-fill.rating-poor        { background: var(--color-rating-poor); }
.bar-fill.rating-bad         { background: var(--color-rating-bad); }
</style>
