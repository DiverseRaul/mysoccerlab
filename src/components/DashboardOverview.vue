<template>
  <div class="dashboard-overview">
    <div class="bento-grid">
      <OverviewHeaderTiles :matches="matches" />
      <PlayerCard :matches="matches" :userName="userName" />
      <GoalsAssistsTile :matches="matches" />
      <PlaymakingTile :matches="matches" />
      <DefensiveActionsTile :matches="matches" />
      <SeasonInsightsTile :matches="matches" />

      <BentoItem :delay="800" extra-class="bento-item--wide shot-map-tile">
        <ShotMapSection
          :allShotsData="allShotsData"
          :allGoalsData="allGoalsData"
          :matches="matches"
        />
      </BentoItem>

      <MatchRatingsChart :matches="matches" />
      <GoalsAssistsLast10Chart :matches="matches" />
    </div>
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

defineProps({
  matches:       { type: Array, required: true },
  userName:      { type: String, required: true },
  allShotsData:  { type: Array, required: true },
  allGoalsData:  { type: Array, required: true }
})
</script>

<style scoped>
.dashboard-overview {
  color: var(--color-text-primary);
  width: 100%;
  padding-bottom: 40px;
}

/* ── Mobile-first bento grid ─────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  grid-auto-rows: minmax(140px, auto);
}

/* Tablet: 2-column grid; wide tiles span both columns. */
@media (min-width: 480px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
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
}
</style>
