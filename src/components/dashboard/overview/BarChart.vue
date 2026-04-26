<template>
  <div class="chart-area">
    <div class="chart-container" :class="{ 'chart-container--scrollable': scrollable }">
      <div
        v-for="(bar, i) in bars"
        :key="bar.key ?? i"
        class="bar-group"
        :style="{ minWidth: scrollable ? '20px' : null }"
      >
        <div class="bar-value">{{ bar.displayValue ?? bar.value }}</div>
        <div class="bar-track">
          <div
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
  labelChars: { type: Number, default: 3 }
})

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

.bar-value {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.bar-track {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--color-accent);
  border-radius: 6px 6px 0 0;
  transition: height 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

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
