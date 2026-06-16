<template>
  <div class="dashboard-overview">
    <div class="overview-toolbar">
      <div class="overview-mode" role="tablist" aria-label="Dashboard detail level">
        <button type="button" class="overview-mode__btn" :class="{ 'is-active': !Advanced }" :aria-selected="!Advanced" @click="Advanced = false">Simple</button>
        <button type="button" class="overview-mode__btn" :class="{ 'is-active': Advanced }" :aria-selected="Advanced" @click="Advanced = true">Advanced</button>
      </div>
    </div>

    <!-- Each group is its own grid so sections never bleed or gap into each
         other; the un-named first group (simple tiles) has no header. -->
    <section v-for="section in sections" :key="section.group || 'main'" class="overview-section">
      <h3 v-if="section.group" class="overview-group">{{ section.group }}</h3>
      <div class="bento-grid">
        <template v-for="tile in section.tiles" :key="tile.id">
          <OverviewHeaderTiles v-if="tile.id === 'header-stats'" :matches="matches" />
          <PlayerCard v-else-if="tile.id === 'player-card'" :matches="matches" :userName="userName" />

          <BentoItem v-else-if="tile.id === 'shot-map'" :delay="500" extra-class="bento-item--wide shot-map-tile">
            <ShotMapSection
              :allShotsData="allShotsData"
              :allGoalsData="allGoalsData"
              :matches="matches"
            />
          </BentoItem>

          <PitchInsightsTile
            v-else-if="tile.id === 'pitch-insights'"
            :heatmapPoints="SeasonHeatmapPoints"
            :passArrows="PassArrows"
            :progressiveCount="ProgressivePasses"
          />

          <MatchRatingsChart v-else-if="tile.id === 'match-ratings'" :matches="matches" />
          <SeasonGoalsTile v-else-if="tile.id === 'season-goals'" :matches="matches" :season="season" />
          <TrendAlertsTile v-else-if="tile.id === 'trend-alerts'" :matches="matches" />
          <SeasonTotalsTile v-else-if="tile.id === 'season-totals'" :matches="matches" />
          <GoalsAssistsTile v-else-if="tile.id === 'goals-assists'" :matches="matches" :xg="SeasonXg" />
          <PlaymakingTile v-else-if="tile.id === 'playmaking'" :matches="matches" :progressivePasses="ProgressivePasses" />
          <DefensiveActionsTile v-else-if="tile.id === 'defensive-actions'" :matches="matches" />
          <SeasonInsightsTile v-else-if="tile.id === 'season-insights'" :matches="matches" />
          <GoalsAssistsLast10Chart v-else-if="tile.id === 'goals-assists-chart'" :matches="matches" />
          <PracticeRecentTile v-else-if="tile.id === 'practice-recent'" />

          <BentoItem v-else-if="tile.id === 'load-management'" :delay="0" extra-class="load-management-tile">
            <LoadManagementWidget />
          </BentoItem>
        </template>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fab-anim">
        <button v-if="Advanced" class="advanced-fab" type="button" @click="BackToSimple">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span class="advanced-fab__label">Advanced mode</span>
          <span class="advanced-fab__action">Back to Simple</span>
        </button>
      </Transition>
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
import SeasonGoalsTile from './dashboard/overview/SeasonGoalsTile.vue'
import TrendAlertsTile from './dashboard/overview/TrendAlertsTile.vue'
import { computed, ref, onMounted } from 'vue'
import { sumExpectedGoals } from '../lib/xg'
import { buildSeasonHeatmapPoints, buildPassArrows } from '../lib/playerSummary'
import { content, DEFAULTS, loadKey } from '../lib/siteContent'

const Props = defineProps({
  matches:       { type: Array, required: true },
  userName:      { type: String, required: true },
  allShotsData:  { type: Array, required: true },
  allGoalsData:  { type: Array, required: true },
  allHeatmapData: { type: Array, default: () => [] },
  season: { type: Object, default: null }
})

const SeasonXg = computed(() => sumExpectedGoals([...Props.allGoalsData, ...Props.allShotsData]))
const SeasonHeatmapPoints = computed(() => buildSeasonHeatmapPoints(Props.allGoalsData, Props.allShotsData, Props.allHeatmapData))
const PassArrows = computed(() => buildPassArrows(Props.allHeatmapData))
const ProgressivePasses = computed(() => PassArrows.value.filter((P) => P.progressive).length)

const Advanced = ref(false)

const DEFAULT_TILE_BY_ID = Object.fromEntries(DEFAULTS.dashboard.tiles.map(t => [t.id, t]))
// Canonical section order for the grouped advanced view.
const GROUP_ORDER = ['', 'Form', 'Attack', 'Defense', 'Season', 'Training & load']
const groupRank = (g) => { const i = GROUP_ORDER.indexOf(g || ''); return i === -1 ? GROUP_ORDER.length : i }

const activeTiles = computed(() => {
  const saved = content.value.dashboard?.tiles
  const defaults = DEFAULTS.dashboard.tiles
  // Start from the saved (admin-edited) order, but append any default tiles a
  // stale saved config predates — and drop any saved ids no longer in defaults
  // (e.g. the relocated peer-percentiles / profile-analytics tiles).
  let config = defaults
  if (Array.isArray(saved) && saved.length) {
    const savedKnown = saved.filter(t => DEFAULT_TILE_BY_ID[t.id])
    const savedIds = new Set(savedKnown.map(t => t.id))
    config = [...savedKnown, ...defaults.filter(d => !savedIds.has(d.id))]
  }
  const visible = config
    .filter(tile => {
      if (tile.mode === 'hidden') return false
      if (!Advanced.value && tile.mode === 'advanced') return false
      return true
    })
    .map((tile, i) => ({ ...tile, group: tile.group ?? DEFAULT_TILE_BY_ID[tile.id]?.group ?? '', _i: i }))
  // Sort into contiguous sections by canonical group order (stable within a
  // group) so each group is rendered exactly once.
  visible.sort((a, b) => groupRank(a.group) - groupRank(b.group) || a._i - b._i)
  return visible
})

// Group the sorted tiles into sections, each rendered as its own grid.
const sections = computed(() => {
  const out = []
  for (const tile of activeTiles.value) {
    let s = out[out.length - 1]
    if (!s || s.group !== tile.group) { s = { group: tile.group, tiles: [] }; out.push(s) }
    s.tiles.push(tile)
  }
  return out
})

const BackToSimple = () => {
  Advanced.value = false
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await loadKey('dashboard')
})

</script>

<style scoped>
.dashboard-overview {
  color: var(--color-text-primary);
  width: 100%;
  padding-bottom: 40px;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  grid-auto-rows: minmax(120px, auto);
}

/* Section block + header (advanced view). Each section is its own grid, so
   groups can't bleed into each other. */
.overview-section + .overview-section { margin-top: var(--space-7); }

.overview-group {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-heavy);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}
.overview-group::before {
  content: '';
  width: 4px;
  height: 15px;
  border-radius: 2px;
  background: var(--color-accent);
}

.bento-grid > :deep(.bento-item) {
  grid-column: span 2;
}

.bento-grid > :deep(.header-stat-tile) {
  grid-column: span 1;
}

.overview-toolbar {
  display: flex;
  justify-content: right;
  margin-bottom: 24px;
}

.overview-mode {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
}

.overview-mode__btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 8px 32px;
  border-radius: 20px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
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
  box-shadow: var(--shadow-lg), 0 0 12px rgba(255, 183, 77, 0.25);
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}

.advanced-fab:hover {
  transform: translateX(-50%) translateY(-3px);
  border-color: var(--color-warning);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(255, 183, 77, 0.5);
}

.advanced-fab svg { flex: 0 0 auto; }

.advanced-fab__action {
  padding: 7px 15px;
  border-radius: var(--radius-pill);
  background: var(--color-warning);
  color: #1c1404;
  font-weight: var(--font-weight-bold);
}

.fab-anim-enter-active,
.fab-anim-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fab-anim-enter-from,
.fab-anim-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.9);
}

@media (max-width: 479px) {
  .advanced-fab { font-size: var(--font-size-sm); padding: 10px 10px 10px 16px; }
  .advanced-fab__label { display: none; }
}

@media (min-width: 480px) {
  .bento-grid > :deep(.bento-item) {
    grid-column: span 1;
  }

  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 2;
  }
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 4;
  }
}

@media (min-width: 1200px) {
  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.shot-map-tile) {
    grid-column: span 2;
    grid-row: span 2;
  }

  .bento-grid > :deep(.player-card-tile) {
    grid-column: span 1;
  }

  .bento-grid > :deep(.playmaking-tile) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.insights-tile) {
    grid-column: span 3;
  }

  .bento-grid > :deep(.load-management-tile) {
    grid-column: span 2;
  }
}
</style>