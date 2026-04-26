<template>
  <BentoItem :delay="400" extra-class="player-card-tile">
    <div class="card-header">
      <h3>Player Card</h3>
    </div>
    <div class="ea-fc-card">
      <div class="player-upper">
        <div class="player-info">
          <div class="overall-rating" :class="ratingAccent">{{ overallRating }}</div>
          <div class="position">OVR</div>
        </div>
      </div>
      <div class="player-name">
        {{ userName ? userName.toUpperCase() : 'PLAYER' }}
      </div>
      <div class="radar-chart-container">
        <svg viewBox="0 0 260 260" class="radar-svg">
          <polygon
            v-for="level in radarConfig.levels"
            :key="level"
            :points="getLevelPolygon(level)"
            class="radar-level"
          />
          <line
            v-for="(stat, i) in radarStats"
            :key="'line-' + i"
            :x1="radarConfig.center"
            :y1="radarConfig.center"
            :x2="getPointOnCircle(100, i, 6).x"
            :y2="getPointOnCircle(100, i, 6).y"
            class="radar-axis"
          />
          <polygon :points="radarPolygonPoints" class="radar-polygon" />
          <circle
            v-for="(stat, i) in radarStats"
            :key="'point-' + i"
            :cx="getPointOnCircle(stat.value, i, 6).x"
            :cy="getPointOnCircle(stat.value, i, 6).y"
            r="4"
            class="radar-point"
          />
          <g v-for="(stat, i) in radarLabels" :key="'label-' + i">
            <text
              :x="stat.x"
              :y="stat.y"
              class="radar-label"
              text-anchor="middle"
              dominant-baseline="middle"
            >{{ stat.label }}</text>
            <text
              :x="stat.x"
              :y="stat.y + 14"
              class="radar-value"
              text-anchor="middle"
              dominant-baseline="middle"
              :class="getRatingColor(stat.value)"
            >{{ stat.value }}</text>
          </g>
        </svg>
      </div>
      <div class="card-bottom-decor"></div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import { getRatingColor } from '../../../lib/rating'

const props = defineProps({
  matches: { type: Array, required: true },
  userName: { type: String, default: '' }
})

const matchCount = computed(() => props.matches.length)

const totalGoals = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.my_goals || 0), 0)
)

const totalAssists = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.assists || 0), 0)
)

const totalSuccessfulPasses = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.successful_passes || 0), 0)
)

const totalUnsuccessfulPasses = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.unsuccessful_passes || 0), 0)
)

const totalShotsOnTarget = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.shots_on_target || 0), 0)
)

const totalTackles = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.tackles || 0), 0)
)

const totalInterceptions = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.interceptions || 0), 0)
)

const totalClearances = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.clearances || 0), 0)
)

const totalFouls = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.fouls || 0), 0)
)

const wins = computed(() =>
  props.matches.filter(m => m.score_for > m.score_against).length
)

const winRate = computed(() => {
  if (matchCount.value === 0) return 0
  return Math.round((wins.value / matchCount.value) * 100)
})

const passAccuracy = computed(() => {
  const total = totalSuccessfulPasses.value + totalUnsuccessfulPasses.value
  if (total === 0) return 0
  return Math.round((totalSuccessfulPasses.value / total) * 100)
})

const clamp = (n) => Math.min(99, Math.max(30, Math.round(n)))

const shootingStat = computed(() => {
  if (matchCount.value === 0) return 65
  const avgGoals = totalGoals.value / matchCount.value
  const avgShotsOnTarget = totalShotsOnTarget.value / matchCount.value
  return clamp(50 + (avgGoals * 15) + (avgShotsOnTarget * 5))
})

const passingStat = computed(() => {
  if (matchCount.value === 0) return 65
  const avgPasses = (totalSuccessfulPasses.value + totalUnsuccessfulPasses.value) / matchCount.value
  return clamp(40 + (passAccuracy.value * 0.4) + (avgPasses * 0.5))
})

const defendingStat = computed(() => {
  if (matchCount.value === 0) return 65
  const avgTackles = totalTackles.value / matchCount.value
  const avgInterceptions = totalInterceptions.value / matchCount.value
  const avgClearances = totalClearances.value / matchCount.value
  return clamp(45 + (avgTackles * 8) + (avgInterceptions * 6) + (avgClearances * 4))
})

const dribblingStat = computed(() => {
  if (matchCount.value === 0) return 65
  const avgDribbles = props.matches.reduce((sum, m) => sum + (m.dribbles || 0), 0) / matchCount.value
  const avgGoals = totalGoals.value / matchCount.value
  return clamp(50 + (avgDribbles * 6) + (avgGoals * 5))
})

const paceStat = computed(() => {
  if (matchCount.value === 0) return 70
  const avgAssists = totalAssists.value / matchCount.value
  return clamp(60 + (avgAssists * 8) + (winRate.value * 0.2))
})

const physicalStat = computed(() => {
  if (matchCount.value === 0) return 65
  const avgFouls = totalFouls.value / matchCount.value
  const avgTackles = totalTackles.value / matchCount.value
  return clamp(55 + (avgTackles * 6) + (avgFouls * 2) + (matchCount.value * 0.5))
})

const overallRating = computed(() => {
  if (matchCount.value === 0) return 65
  const avg = (
    shootingStat.value + passingStat.value + defendingStat.value +
    dribblingStat.value + paceStat.value + physicalStat.value
  ) / 6
  return clamp(avg)
})

const ratingAccent = computed(() => getRatingColor((overallRating.value / 99) * 10))

// ── Radar chart ────────────────────────────────────────────────
const radarConfig = {
  size: 260,
  center: 130,
  radius: 90,
  levels: [25, 50, 75, 100]
}

const radarStats = computed(() => [
  { label: 'PAC', value: paceStat.value },
  { label: 'SHO', value: shootingStat.value },
  { label: 'PAS', value: passingStat.value },
  { label: 'DRI', value: dribblingStat.value },
  { label: 'DEF', value: defendingStat.value },
  { label: 'PHY', value: physicalStat.value }
])

const getPointOnCircle = (value, index, total) => {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const r = (value / 100) * radarConfig.radius
  return {
    x: radarConfig.center + r * Math.cos(angle),
    y: radarConfig.center + r * Math.sin(angle)
  }
}

const radarPolygonPoints = computed(() =>
  radarStats.value.map((stat, i) => {
    const { x, y } = getPointOnCircle(stat.value, i, 6)
    return `${x},${y}`
  }).join(' ')
)

const getLevelPolygon = (level) =>
  Array.from({ length: 6 }).map((_, i) => {
    const { x, y } = getPointOnCircle(level, i, 6)
    return `${x},${y}`
  }).join(' ')

const radarLabels = computed(() =>
  radarStats.value.map((stat, i) => {
    const { x, y } = getPointOnCircle(125, i, 6)
    return { ...stat, x, y }
  })
)
</script>

<style scoped>
.player-card-tile {
  padding: 0;
  background: linear-gradient(160deg, var(--color-player-card-bg) 0%, var(--color-bg-page) 100%);
  border: 1px solid rgba(218, 165, 32, 0.3);
}

.card-header {
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-player-card-gold);
}

.ea-fc-card {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.player-upper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.overall-rating {
  font-size: 3rem;
  font-weight: var(--font-weight-heavy);
  line-height: 1;
  color: var(--color-text-primary);
}

.position {
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-player-card-gold);
}

.player-name {
  font-size: 1.25rem;
  font-weight: var(--font-weight-heavy);
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 12px;
  color: var(--color-text-primary);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 6px;
}

.radar-chart-container {
  width: 100%;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.radar-svg {
  width: 100%;
  height: 100%;
  max-width: 260px;
  overflow: visible;
}

.radar-level {
  fill: none;
  stroke: var(--color-border-soft);
  stroke-width: 1;
}

.radar-axis {
  stroke: var(--color-border-soft);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.radar-polygon {
  fill: rgba(76, 218, 156, 0.3);
  stroke: var(--color-accent);
  stroke-width: 2;
  filter: drop-shadow(0 0 8px rgba(76, 218, 156, 0.4));
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.radar-point {
  fill: var(--color-player-card-bg);
  stroke: var(--color-accent);
  stroke-width: 2;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.radar-label {
  fill: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
}

.radar-value {
  fill: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
}

/* Rating tier colors for the OVR badge and radar values. */
.rating-world-class { color: var(--color-rating-world-class); fill: var(--color-rating-world-class); }
.rating-elite       { color: var(--color-rating-elite);       fill: var(--color-rating-elite); }
.rating-excellent   { color: var(--color-rating-excellent);   fill: var(--color-rating-excellent); }
.rating-good        { color: var(--color-rating-good);        fill: var(--color-rating-good); }
.rating-average     { color: var(--color-rating-average);     fill: var(--color-rating-average); }
.rating-poor        { color: var(--color-rating-poor);        fill: var(--color-rating-poor); }
.rating-bad         { color: var(--color-rating-bad);         fill: var(--color-rating-bad); }
</style>
