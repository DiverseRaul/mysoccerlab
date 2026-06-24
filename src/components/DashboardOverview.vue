<template>
  <div class="dashboard-overview" ref="overviewEl">
    <!-- One-shot accent light sweep when switching into Advanced mode. -->
    <div v-if="advancedPulse" class="advanced-sweep" aria-hidden="true"></div>
    <!-- Loading skeleton — shown until the first matches query resolves, so the
         empty state never flashes while data is still on its way. -->
    <div v-if="loading" class="bento-grid" aria-hidden="true">
      <div v-for="n in 4" :key="'h' + n" class="skel-tile skel-tile--stat">
        <Skeleton width="40%" height="0.7rem" />
        <Skeleton width="60%" height="1.6rem" />
      </div>
      <div class="skel-tile skel-tile--wide skel-tile--tall">
        <Skeleton width="35%" height="0.9rem" />
        <Skeleton width="100%" height="220px" radius="var(--radius-md)" />
      </div>
      <div class="skel-tile">
        <Skeleton width="50%" height="0.9rem" />
        <Skeleton width="100%" height="120px" radius="var(--radius-md)" />
      </div>
    </div>

    <!-- Matches exist overall but none in the active season → guide back to All time. -->
    <EmptyState
      v-else-if="matches.length === 0 && totalMatches > 0"
      icon="🗓️"
      title="No matches in this season"
      message="You've logged matches in other seasons. Switch to All time to see everything."
    >
      <button type="button" class="btn btn-primary" @click="emit('clear-season')">Show all matches</button>
    </EmptyState>

    <!-- Truly no matches yet. -->
    <EmptyState
      v-else-if="matches.length === 0"
      icon="⚽"
      title="No matches yet"
      message="Log your first match to unlock your ratings, shot maps and season trends."
    >
      <button type="button" class="btn btn-primary" @click="emit('go-to-matches')">Log your first match</button>
    </EmptyState>

    <template v-else>
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

          <MatchRatingsChart v-else-if="tile.id === 'match-ratings'" :matches="matches" @open-match="emit('open-match', $event)" />
          <SeasonGoalsTile v-else-if="tile.id === 'season-goals'" :matches="matches" :season="season" />
          <TrendAlertsTile v-else-if="tile.id === 'trend-alerts'" :matches="matches" />
          <SeasonTotalsTile v-else-if="tile.id === 'season-totals'" :matches="matches" />
          <GoalsAssistsTile v-else-if="tile.id === 'goals-assists'" :matches="matches" :xg="SeasonXg" />
          <PlaymakingTile v-else-if="tile.id === 'playmaking'" :matches="matches" :progressivePasses="ProgressivePasses" />
          <DefensiveActionsTile v-else-if="tile.id === 'defensive-actions'" :matches="matches" />
          <SeasonInsightsTile v-else-if="tile.id === 'season-insights'" :matches="matches" />
          <GoalsAssistsLast10Chart v-else-if="tile.id === 'goals-assists-chart'" :matches="matches" />
          <PracticeRecentTile v-else-if="tile.id === 'practice-recent'" @go-to-drills="emit('go-to-drills')" />

          <BentoItem v-else-if="tile.id === 'load-management'" :delay="0" extra-class="load-management-tile">
            <LoadManagementWidget />
          </BentoItem>
        </template>
      </div>
    </section>
    </template>

    <Teleport to="body">
      <Transition name="fab-anim">
        <button v-if="Advanced" class="advanced-fab" type="button" @click="BackToSimple">
          <i class="ph ph-info" style="font-size:16px" aria-hidden="true"></i>
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
import EmptyState from './ui/EmptyState.vue'
import Skeleton from './ui/Skeleton.vue'
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { sumExpectedGoals } from '../lib/xg'
import { buildSeasonHeatmapPoints, buildPassArrows } from '../lib/playerSummary'
import { content, DEFAULTS, loadKey } from '../lib/siteContent'
import { decorateBento } from '../lib/scrollReveal'

const Props = defineProps({
  matches:       { type: Array, required: true },
  userName:      { type: String, required: true },
  allShotsData:  { type: Array, required: true },
  allGoalsData:  { type: Array, required: true },
  allHeatmapData: { type: Array, default: () => [] },
  season: { type: Object, default: null },
  // Unfiltered match count, so the empty state can tell "no matches at all"
  // apart from "none in the selected season".
  totalMatches: { type: Number, default: 0 },
  // True until the dashboard's first data load resolves (drives the skeleton).
  loading: { type: Boolean, default: false },
  // Simple ⇄ Advanced is owned by the parent now (it lives in the unified
  // control bar), passed in and mirrored back via update:advanced.
  advanced: { type: Boolean, default: false }
})

const emit = defineEmits(['go-to-matches', 'clear-season', 'go-to-drills', 'open-match', 'update:advanced'])

const SeasonXg = computed(() => sumExpectedGoals([...Props.allGoalsData, ...Props.allShotsData]))
const SeasonHeatmapPoints = computed(() => buildSeasonHeatmapPoints(Props.allGoalsData, Props.allShotsData, Props.allHeatmapData))
const PassArrows = computed(() => buildPassArrows(Props.allHeatmapData))
const ProgressivePasses = computed(() => PassArrows.value.filter((P) => P.progressive).length)

// Proxy the parent's v-model so all the existing Advanced.value reads/writes
// (tile filtering, the reanimate watcher, the FAB's Back-to-Simple) keep working.
const Advanced = computed({
  get: () => Props.advanced,
  set: (v) => emit('update:advanced', v)
})

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

// Scroll-reveal: tag the freshly-rendered tiles with varied entrance types and
// start observing them. Re-run whenever the tile set changes (data finished
// loading, Simple ⇄ Advanced) — decorateBento is idempotent so it only touches
// new tiles.
const overviewEl = ref(null)
const runReveal = () => nextTick(() => decorateBento(overviewEl.value))

// Toggling Simple ⇄ Advanced re-arms every tile and cascades them all back in
// (not just the newly-added ones) — a satisfying full-grid refresh. Below-fold
// tiles stay armed and reveal on scroll as usual.
const reanimate = () => {
  const root = overviewEl.value
  if (!root) return
  const els = Array.from(root.querySelectorAll('[data-reveal]'))
  els.forEach((el) => el.classList.remove('is-revealed'))
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-revealed')
    }
  }))
}

watch(() => [Props.loading, sections.value.length], runReveal)

// Entering Advanced: cascade all tiles back in AND fire a one-shot accent light
// sweep across the overview, so the switch clearly does "something cool".
const advancedPulse = ref(false)
watch(Advanced, (val) => {
  nextTick(() => { decorateBento(overviewEl.value); reanimate() })
  if (val) {
    advancedPulse.value = false
    nextTick(() => {
      advancedPulse.value = true
      setTimeout(() => { advancedPulse.value = false }, 900)
    })
  }
})

onMounted(async () => {
  runReveal()
  await loadKey('dashboard')
  runReveal()
})

</script>

<style scoped>
.dashboard-overview {
  position: relative;
  color: var(--color-text-primary);
  width: 100%;
  padding-bottom: 40px;
}

/* Accent light sweep on entering Advanced mode (one-shot, decorative). */
.advanced-sweep {
  position: absolute;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  overflow: hidden;
}
.advanced-sweep::before {
  content: '';
  position: absolute;
  top: -8%;
  bottom: -8%;
  left: -70%;
  width: 55%;
  background: linear-gradient(105deg, transparent, color-mix(in srgb, var(--color-warning) 50%, transparent), transparent);
  filter: blur(26px);
  transform: skewX(-12deg);
  animation: adv-sweep 0.9s cubic-bezier(0.5, 0, 0.3, 1) forwards;
}
/* A second, thinner beam follows from the left a beat later, for a layered
   double-sweep of the warning colour. */
.advanced-sweep::after {
  content: '';
  position: absolute;
  top: -8%;
  bottom: -8%;
  left: -70%;
  width: 34%;
  background: linear-gradient(105deg, transparent, color-mix(in srgb, var(--color-warning) 40%, transparent), transparent);
  filter: blur(20px);
  transform: skewX(-12deg);
  animation: adv-sweep 0.95s cubic-bezier(0.5, 0, 0.3, 1) 0.18s forwards;
}
@keyframes adv-sweep {
  from { left: -70%; }
  to { left: 135%; }
}

.bento-grid {
  display: grid;
  /* minmax(0, 1fr) so a tile whose content has a large intrinsic width (e.g. the
     shot-map goal frame) can't blow the column out past the viewport. */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  grid-auto-rows: minmax(120px, auto);
  /* Backfill holes left by wide tiles so the grid packs tight instead of leaving
     big empty gaps, and let each tile take its natural height (start) rather than
     stretching to match a tall neighbour — that stretching was making the small
     stat cards balloon to ~270px on desktop. */
  grid-auto-flow: row dense;
  /* Tiles in the same row stretch to a common height so rows read as clean,
     even bands (a short Player Card next to a tall Shot Map now match instead of
     leaving a ragged hole). Content inside each tile stays top-aligned via the
     tile's own flex column, so stretching just fills the bottom gap. */
  align-items: stretch;
}

/* Header stat cards: compact, uniform height. They share their own top row, so
   stretch (the grid default) makes all four match the tallest — and the reduced
   padding keeps that height tight instead of the old ~260px tower. */
.bento-grid > :deep(.header-stat-tile) {
  padding: 16px;
  min-height: 116px;
  justify-content: center;
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

/* Loading skeleton tiles (mirror the bento tile chrome). */
.skel-tile {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--space-5);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  min-height: 120px;
}
.skel-tile--stat { grid-column: span 1; min-height: 92px; }
.skel-tile--wide { grid-column: span 2; }
@media (min-width: 768px) {
  .skel-tile { grid-column: span 1; }
  .skel-tile--wide { grid-column: span 4; }
}
@media (min-width: 1200px) {
  .skel-tile--wide { grid-column: span 2; }
}

.bento-grid > :deep(.bento-item) {
  grid-column: span 2;
}

.bento-grid > :deep(.header-stat-tile) {
  grid-column: span 1;
}

.advanced-fab {
  position: fixed;
  left: 50%;
  /* Sit ABOVE the floating bottom nav (which clears ~84px), not on top of it. */
  bottom: calc(102px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  /* Above the nav bar (z 2100) so the warning is never hidden behind it. */
  z-index: 2200;
  /* The bubble bursts upward out of the nav. */
  transform-origin: bottom center;
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
  /* Idle: a warm warning glow breathes in/out (overridden by the burst on enter). */
  animation: fab-glow 2.2s ease-in-out infinite;
}

/* The warning icon pulses + ticks for a lively, attention-drawing cue. */
.advanced-fab > i {
  animation: fab-ico 1.7s ease-in-out infinite;
}

@keyframes fab-glow {
  0%, 100% { box-shadow: var(--shadow-lg), 0 0 8px rgba(255, 183, 77, 0.18); border-color: rgba(255, 183, 77, 0.4); }
  50%      { box-shadow: var(--shadow-lg), 0 0 26px rgba(255, 183, 77, 0.6); border-color: rgba(255, 183, 77, 0.85); }
}

@keyframes fab-ico {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50%      { transform: scale(1.25) rotate(-12deg); }
}

.advanced-fab:hover {
  transform: translateX(-50%) translateY(-3px);
  border-color: var(--color-warning);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(255, 183, 77, 0.5);
}

/* No bottom nav on desktop, so the warning can sit lower. */
@media (min-width: 1025px) {
  .advanced-fab { bottom: 28px; }
}

.advanced-fab svg { flex: 0 0 auto; }

.advanced-fab__action {
  padding: 7px 15px;
  border-radius: var(--radius-pill);
  background: var(--color-warning);
  color: #1c1404;
  font-weight: var(--font-weight-bold);
}

/* Bubble burst: the warning pops up out of the nav bar with a squash-and-stretch
   wobble, like a bubble bursting free, then settles. */
.fab-anim-enter-active {
  animation: fab-burst 0.62s cubic-bezier(0.34, 1.56, 0.5, 1);
}

@keyframes fab-burst {
  0%   { opacity: 0; transform: translateX(-50%) translateY(46px) scale(0.2); }
  45%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.16, 0.84); }
  68%  { transform: translateX(-50%) translateY(3px) scale(0.95, 1.06); }
  84%  { transform: translateX(-50%) translateY(-1px) scale(1.02, 0.98); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

.fab-anim-leave-active {
  transition: opacity 0.28s ease, transform 0.34s cubic-bezier(0.5, 0, 0.75, 0);
}

.fab-anim-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(34px) scale(0.4);
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  /* A group section that holds a single tile shouldn't leave half the row empty
     — let it span the full width. */
  .bento-grid:has(> :only-child) > :only-child {
    grid-column: 1 / -1;
  }

  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 4;
  }
}

@media (min-width: 1200px) {
  /* Per-section spans are tuned so every section fills all 4 columns with no
     ragged end-gaps, and tall/short tiles are paired sensibly. */
  .bento-grid > :deep(.bento-item--wide) {
    grid-column: span 2;
  }

  /* Simple: row = Player Card (1) + Shot Map (3); row = Pitch Insights (2) +
     Match Ratings (2); Season Goals as a full-width banner below (it's short,
     so it would balloon if trapped in the tall Player Card row). */
  .bento-grid > :deep(.shot-map-tile) {
    grid-column: span 3;
  }

  .bento-grid > :deep(.player-card-tile) {
    grid-column: span 1;
  }

  .bento-grid > :deep(.season-goals-tile) {
    grid-column: 1 / -1;
  }

  /* Attack: Playmaking (2) + Goals & Assists (2); the Last-10 chart full width. */
  .bento-grid > :deep(.playmaking-tile) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.goals-assists-tile) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.goals-assists-chart-tile) {
    grid-column: 1 / -1;
  }

  /* Season: Season Totals (2) + Season Insights (2). */
  .bento-grid > :deep(.season-totals-tile) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.insights-tile) {
    grid-column: span 2;
  }

  /* Training & load: Recent Practice (2) + Load Management (2). */
  .bento-grid > :deep(.practice-recent-tile) {
    grid-column: span 2;
  }

  .bento-grid > :deep(.load-management-tile) {
    grid-column: span 2;
  }
}
</style>