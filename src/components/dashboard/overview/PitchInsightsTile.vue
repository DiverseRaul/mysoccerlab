<template>
  <BentoItem :delay="850" extra-class="bento-item--wide pitch-insights-tile">
    <div class="pitch-insights__head">
      <h4>Pitch Insights</h4>
      <div class="pitch-insights__tabs" role="tablist">
        <button
          type="button"
          class="pitch-insights__tab"
          :class="{ 'is-active': View === 'heatmap' }"
          data-testid="pitch-insights-heatmap"
          @click="View = 'heatmap'"
        >Heatmap</button>
        <button
          type="button"
          class="pitch-insights__tab"
          :class="{ 'is-active': View === 'passes' }"
          data-testid="pitch-insights-passes"
          @click="View = 'passes'"
        >Passes</button>
      </div>
    </div>

    <div v-if="View === 'heatmap'" class="pitch-insights__body" data-testid="pitch-insights-heatmap-view">
      <HeatmapCanvas :points="heatmapPoints" />
    </div>

    <div v-else class="pitch-insights__body" data-testid="pitch-insights-passes-view">
      <div class="pitch-insights__pitch">
        <svg viewBox="0 0 100 150" preserveAspectRatio="none" class="pitch-insights__svg">
          <defs>
            <marker id="pi-arrow" markerWidth="5" markerHeight="5" refX="3.5" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="color-mix(in srgb, var(--color-accent) 85%, transparent)" />
            </marker>
          </defs>
          <rect x="1" y="1" width="98" height="148" rx="2" class="pi-line" />
          <line x1="1" y1="75" x2="99" y2="75" class="pi-line" />
          <circle cx="50" cy="75" r="12" class="pi-line" />
          <rect x="25" y="1" width="50" height="22" class="pi-line" />
          <rect x="40" y="1" width="20" height="8" class="pi-line" />
          <rect x="25" y="127" width="50" height="22" class="pi-line" />
          <rect x="40" y="141" width="20" height="8" class="pi-line" />
          <line
            v-for="(PassItem, Index) in passArrows"
            :key="Index"
            :x1="PassItem.x_pct" :y1="PassItem.y_pct * 1.5"
            :x2="PassItem.x2_pct" :y2="PassItem.y2_pct * 1.5"
            class="pi-pass"
            :class="PassItem.progressive ? 'pi-pass--prog' : 'pi-pass--reg'"
            marker-end="url(#pi-arrow)"
          />
        </svg>
        <p v-if="!passArrows.length" class="pitch-insights__empty">No pass directions logged yet</p>
      </div>
      <div class="pitch-insights__legend">
        <span class="pitch-insights__prog">{{ progressiveCount }}</span>
        <span class="pitch-insights__prog-lbl">progressive passes</span>
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { ref } from 'vue'
import BentoItem from './BentoItem.vue'
import HeatmapCanvas from '../../ui/HeatmapCanvas.vue'

defineProps({
  heatmapPoints: { type: Array, default: () => [] },
  passArrows: { type: Array, default: () => [] },
  progressiveCount: { type: Number, default: 0 }
})

const View = ref('heatmap')
</script>

<style scoped>
.pitch-insights__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: 16px;
}

.pitch-insights__head h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.pitch-insights__tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
}

.pitch-insights__tab {
  min-height: 32px;
  padding: 5px 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.pitch-insights__tab.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.pitch-insights__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

/* Match HeatmapCanvas pitch exactly so the two views feel like one surface. */
.pitch-insights__pitch {
  position: relative;
  width: 100%;
  max-width: 440px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, rgba(34, 80, 50, 0.35), rgba(20, 24, 22, 0.95)),
    var(--color-bg-field);
}

.pitch-insights__svg { display: block; width: 100%; height: 100%; }

.pi-line { fill: none; stroke: rgba(255, 255, 255, 0.18); stroke-width: 0.5; }

.pi-pass { stroke-width: 1.4; vector-effect: non-scaling-stroke; }
.pi-pass--prog { stroke: color-mix(in srgb, var(--color-accent) 80%, transparent); }
.pi-pass--reg { stroke: color-mix(in srgb, var(--color-accent) 30%, transparent); }

.pitch-insights__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  text-align: center;
  padding: 0 16px;
}

.pitch-insights__legend {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pitch-insights__prog {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.pitch-insights__prog-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>