<template>
  <div class="dashboard-overview">
    <div class="overview-toolbar">
      <div class="overview-mode" role="tablist" aria-label="Dashboard detail level">
        <button type="button" class="overview-mode__btn" :class="{ 'is-active': !advanced }" :aria-selected="!advanced" @click="advanced = false">Simple</button>
        <button type="button" class="overview-mode__btn" :class="{ 'is-active': advanced }" :aria-selected="advanced" @click="advanced = true">Advanced</button>
      </div>
    </div>

    <div class="bento-grid">
      <!-- Essentials (always visible) -->
      <OverviewHeaderTiles :matches="matches" />
      <PlayerCard :matches="matches" :userName="userName" />

      <BentoItem :delay="500" extra-class="bento-item--wide shot-map-tile">
        <ShotMapSection
          :allShotsData="allShotsData"
          :allGoalsData="allGoalsData"
          :matches="matches"
        />
      </BentoItem>

      <PitchInsightsTile
        :heatmapPoints="seasonHeatmapPoints"
        :passArrows="passArrows"
        :progressiveCount="progressivePasses"
      />

      <MatchRatingsChart :matches="matches" />

      <!-- Advanced: full readable stat breakdown + all secondary tiles -->
      <template v-if="advanced">
        <SeasonTotalsTile :matches="matches" />
        <GoalsAssistsTile :matches="matches" :xg="seasonXg" />
        <PlaymakingTile :matches="matches" :progressivePasses="progressivePasses" />
        <DefensiveActionsTile :matches="matches" />
        <SeasonInsightsTile :matches="matches" />
        <GoalsAssistsLast10Chart :matches="matches" />
        <PracticeRecentTile />

        <BentoItem :delay="0" extra-class="load-management-tile">
          <LoadManagementWidget />
        </BentoItem>
      </template>
    </div>

    <!-- Fixed reminder while in Advanced mode; tap to return to Simple. -->
    <Teleport to="body">
      <button v-if="advanced" class="advanced-fab" type="button" @click="backToSimple">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <span class="advanced-fab__label">Advanced mode</span>
        <span class="advanced-fab__action">Back to Simple</span>
      </button>
    </Teleport>
  </div>
</template>

<script setup>
import ShotMapSection from './ShotMapSection.vue'
import BentoItem from './dashboard/overview/BentoItem.vue'
import OverviewHeaderTiles from './dashboard/overview/OverviewHeaderTiles.vue'
import PlayerCard from './dashboard/overview/PlayerCard.vue'
import GoalsAssistsTile from './dashboard/overview/GoalsAssistsTile.vue'
import PlaymakingTile from './dashboard/overview/PlaymakingTile.vue'
import DefensiveActionsTile from './dashboard/overview/DefensiveActionsTile.vue'
import SeasonInsightsTile from './dashboard/overview/SeasonInsightsTile.vue'
import MatchRatingsChart from './dashboard/overview/MatchRatingsChart.vue'
import GoalsAssistsLast10Chart from './dashboard/overview/GoalsAssistsLast10Chart.vue'
import PracticeRecentTile from './dashboard/overview/PracticeRecentTile.vue'
import LoadManagementWidget from './dashboard/overview/LoadManagementWidget.vue'
import PitchInsightsTile from './dashboard/overview/PitchInsightsTile.vue'
import SeasonTotalsTile from './dashboard/overview/SeasonTotalsTile.vue'
import { computed, ref } from 'vue'
import { sumExpectedGoals } from '../lib/xg'
import { buildSeasonHeatmapPoints, buildPassArrows } from '../lib/playerSummary'

const props = defineProps({
  matches:       { type: Array, required: true },
  userName:      { type: String, required: true },
  allShotsData:  { type: Array, required: true },
  allGoalsData:  { type: Array, required: true },
  allHeatmapData: { type: Array, default: () => [] }
})

const seasonXg = computed(() => sumExpectedGoals([...props.allGoalsData, ...props.allShotsData]))
const seasonHeatmapPoints = computed(() =>
  buildSeasonHeatmapPoints(props.allGoalsData, props.allShotsData, props.allHeatmapData)
)
const passArrows = computed(() => buildPassArrows(props.allHeatmapData))
const progressivePasses = computed(() => passArrows.value.filter((p) => p.progressive).length)

const advanced = ref(false)

const backToSimple = () => {
  advanced.value = false
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.dashboard-overview {
  color: var(--color-text-primary);
  width: 100%;
  padding-bottom: 40px;
}

/* ── Mobile-first bento grid ─────────────────────────────────── */
/* On phones the grid is 2-col: content tiles span the full width, but the four
   compact header stats (Matches / Record / Rating / Last) sit 2×2 so they don't
   eat four full rows of scrolling. */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  grid-auto-rows: minmax(120px, auto);
}

.bento-grid > :deep(.bento-item) {
  grid-column: span 2;
}

.bento-grid > :deep(.header-stat-tile) {
  grid-column: span 1;
}

/* Simple / Advanced segmented control sits on its own row, top-right. */
/* Toolbar sits above the grid (not a grid cell, so no tall min-row). */
.overview-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.overview-mode {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
}

.overview-mode__btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 5px 16px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.overview-mode__btn.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.overview-mode__btn:not(.is-active):hover {
  color: var(--color-text-secondary);
}

/* Fixed "you're in Advanced mode" reminder — tap to return to Simple. */
.advanced-fab {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 300;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px 11px 20px;
  border-radius: var(--radius-pill);
  background: rgba(28, 23, 10, 0.92);
  border: 1px solid rgba(255, 183, 77, 0.45);
  color: var(--color-warning);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.advanced-fab:hover {
  transform: translateX(-50%) translateY(-2px);
  border-color: var(--color-warning);
}

.advanced-fab svg { flex: 0 0 auto; }

.advanced-fab__action {
  padding: 7px 15px;
  border-radius: var(--radius-pill);
  background: var(--color-warning);
  color: #1c1404;
  font-weight: var(--font-weight-bold);
}

@media (max-width: 479px) {
  .advanced-fab { font-size: var(--font-size-sm); padding: 10px 10px 10px 16px; }
  .advanced-fab__label { display: none; }
}

/* Tablet: 2-column grid; content tiles go 1-up, wide tiles span both columns. */
@media (min-width: 480px) {
  .bento-grid > :deep(.bento-item) {
    grid-column: span 1;
  }

  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 2;
  }
}

/* Desktop small: 4-column grid. */
@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 4;
  }
}

/* Desktop large: 4-column with shot map and player card spanning rows. */
@media (min-width: 1200px) {
  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.shot-map-tile) {
    grid-column: span 2;
    grid-row: span 2;
  }

  /* PlayerCard: single col, single row (content was shrunk in iteration 2). */
  .bento-grid > :deep(.player-card-tile) {
    grid-column: span 1;
  }

  /* Playmaking gets 2 cols on large desktop so the larger stat numbers
     have room to breathe. */
  .bento-grid > :deep(.playmaking-tile) {
    grid-column: span 2;
  }

  /* Season Insights spans 3 cols at this breakpoint so it fills the
     row that Defensive (1 col) leaves behind. */
  .bento-grid > :deep(.insights-tile) {
    grid-column: span 3;
  }

  .bento-grid > :deep(.load-management-tile) {
    grid-column: span 2;
  }
}
</style>
