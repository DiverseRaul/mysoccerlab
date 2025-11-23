<template>
  <div class="dashboard-overview">
    <div class="bento-grid">
      <!-- Key Stats Row -->
      <div class="bento-item stat-tile" style="--delay: 0ms">
        <div class="stat-icon-circle">⚽</div>
        <div class="stat-content">
          <h3>{{ matches.length }}</h3>
          <p>Matches</p>
        </div>
      </div>
      
      <div class="bento-item stat-tile" style="--delay: 100ms">
        <div class="stat-icon-circle">🏆</div>
        <div class="stat-content">
          <h3>{{ wins }}</h3>
          <p>Wins</p>
        </div>
      </div>
      
      <div class="bento-item stat-tile" style="--delay: 200ms">
        <div class="stat-icon-circle">📊</div>
        <div class="stat-content">
          <h3>{{ winRate }}%</h3>
          <p>Win Rate</p>
        </div>
      </div>
      
      <div class="bento-item stat-tile" style="--delay: 300ms">
        <div class="stat-icon-circle">⭐</div>
        <div class="stat-content">
          <h3 :class="getStatColorClass('rating', averageRating)">{{ averageRating }}</h3>
          <p>Avg Rating</p>
        </div>
      </div>

      <!-- Player Card (Tall Item) -->
      <div class="bento-item bento-item--tall player-card-tile" style="--delay: 400ms">
        <div class="card-header">
          <h3>Player Card</h3>
        </div>
        <div class="ea-fc-card">
          <div class="player-upper">
            <div class="player-info">
              <div class="overall-rating" :class="getStatColorClass('rating', overallRating)">
                {{ overallRating }}
              </div>
              <div class="position">OVR</div>
            </div>
            <!-- Player Image Removed -->
          </div>
          <div class="player-name">
            {{ userEmail ? userEmail.split('@')[0].toUpperCase() : 'PLAYER' }}
          </div>
          <div class="radar-chart-container">
            <svg viewBox="0 0 260 260" class="radar-svg">
              <!-- Background Levels -->
              <polygon 
                v-for="level in radarConfig.levels" 
                :key="level"
                :points="getLevelPolygon(level)"
                class="radar-level"
              />
              
              <!-- Axis Lines -->
              <line 
                v-for="(stat, i) in radarStats" 
                :key="'line-' + i"
                :x1="radarConfig.center" 
                :y1="radarConfig.center" 
                :x2="getPointOnCircle(100, i, 6).x" 
                :y2="getPointOnCircle(100, i, 6).y"
                class="radar-axis"
              />

              <!-- Data Polygon -->
              <polygon :points="radarPolygonPoints" class="radar-polygon" />

              <!-- Data Points -->
              <circle 
                v-for="(stat, i) in radarStats" 
                :key="'point-' + i"
                :cx="getPointOnCircle(stat.value, i, 6).x"
                :cy="getPointOnCircle(stat.value, i, 6).y"
                r="4"
                class="radar-point"
              />

              <!-- Labels -->
              <g v-for="(stat, i) in radarLabels" :key="'label-' + i">
                <text 
                  :x="stat.x" 
                  :y="stat.y" 
                  class="radar-label"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  {{ stat.label }}
                </text>
                <text 
                  :x="stat.x" 
                  :y="stat.y + 14" 
                  class="radar-value"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  :class="getStatColorClass('rating', stat.value)"
                >
                  {{ stat.value }}
                </text>
              </g>
            </svg>
          </div>
          <div class="card-bottom-decor"></div>
        </div>
      </div>

      <!-- Performance Overview Section -->
      <div class="bento-item performance-tile" style="--delay: 500ms">
        <div class="tile-header">
          <h4>Goals & Assists</h4>
        </div>
        <div class="stats-row">
          <div class="stat-group">
            <span class="big-number">{{ totalGoals }}</span>
            <span class="label">Goals</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-group">
            <span class="big-number">{{ totalAssists }}</span>
            <span class="label">Assists</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-group">
            <span class="big-number">{{ (totalGoals + totalAssists) }}</span>
            <span class="label">G+A</span>
          </div>
        </div>
        
        <div class="chart-content shooting-stats">
          <div class="stat-bar-container">
            <div class="bar-header">
              <span class="label-small">Shooting Accuracy</span>
              <span class="value-small">{{ shotAccuracy }}%</span>
            </div>
            <div class="simple-bar-track">
              <div class="simple-bar-fill" :style="{ width: shotAccuracy + '%' }"></div>
            </div>
          </div>
          
          <div class="stat-bar-container">
            <div class="bar-header">
              <span class="label-small">Conversion Rate</span>
              <span class="value-small">{{ shotConversionRate }}%</span>
            </div>
            <div class="simple-bar-track">
              <div class="simple-bar-fill fill-gold" :style="{ width: shotConversionRate + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-item performance-tile" style="--delay: 600ms">
        <div class="tile-header header-spaced">
          <h4>Passing</h4>
        </div>
        <div class="chart-content">
          <div class="stacked-bar-container">
            <div class="stacked-bar">
              <div class="bar-segment segment-good" :style="{ width: passAccuracy + '%' }"></div>
              <div class="bar-segment segment-bad" :style="{ width: (100 - passAccuracy) + '%' }"></div>
            </div>
            <div class="bar-legend">
              <div class="legend-item">
                <div class="dot dot-good"></div>
                <span>Good ({{ passAccuracy }}%)</span>
              </div>
              <div class="legend-item">
                <div class="dot dot-bad"></div>
                <span>Bad ({{ 100 - passAccuracy }}%)</span>
              </div>
            </div>
          </div>
          
          <div class="stats-row mini-stats">
            <div class="stat-group">
              <span class="medium-number">{{ totalSuccessfulPasses + totalUnsuccessfulPasses }}</span>
              <span class="label">Passes</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-group">
              <span class="medium-number">{{ totalChancesCreated }}</span>
              <span class="label">Chances</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-item performance-tile" style="--delay: 700ms">
        <div class="tile-header header-spaced">
          <h4>Defensive Actions</h4>
        </div>
        <div class="chart-content">
          <div class="donut-chart-container">
            <svg viewBox="0 0 200 200" class="donut-svg">
              <path 
                v-for="(slice, i) in getDonutPaths" 
                :key="i"
                :d="slice.path"
                :fill="slice.color"
                class="donut-segment"
              />
              <!-- Center Text -->
              <text x="100" y="95" text-anchor="middle" class="donut-total-label">Total</text>
              <text x="100" y="115" text-anchor="middle" class="donut-total-value">{{ totalTackles + totalInterceptions + totalClearances }}</text>
            </svg>
            <div class="donut-legend">
              <div v-for="(slice, i) in getDonutPaths" :key="i" class="legend-item">
                <div class="dot" :style="{ background: slice.color }"></div>
                <span>{{ slice.label }} ({{ slice.value }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shot Map (Large Featured Item) -->
      <div class="bento-item bento-item--wide shot-map-tile" style="--delay: 800ms">
        <ShotMapSection 
          :allShotsData="allShotsData"
          :allGoalsData="allGoalsData"
        />
      </div>

      <!-- Season Insights (Large Featured Item Next to Shot Map) -->
      <div class="bento-item bento-item--wide insights-tile" style="--delay: 850ms">
        <div class="tile-header">
          <h4>Season Insights</h4>
        </div>
        <div class="insights-content">
          <!-- Form Guide -->
          <div class="insight-block">
            <span class="insight-label">Recent Form</span>
            <div class="form-guide">
              <div 
                v-for="(match, i) in formGuide" 
                :key="i" 
                class="form-dot"
                :class="match.class"
                :title="match.result + ' vs ' + match.opponent"
              >
                {{ match.letter }}
              </div>
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Best Match -->
          <div class="insight-block" v-if="bestMatch">
            <span class="insight-label">Best Performance</span>
            <div class="best-match-card">
              <div class="match-opp-info">
                <span class="opp-name">{{ bestMatch.opponent }}</span>
                <span class="match-score" :class="getMatchResultClass(bestMatch)">
                  {{ bestMatch.score_for }} - {{ bestMatch.score_against }}
                </span>
              </div>
              <div class="match-rating-display">
                <span class="rating-val" :class="getStatColorClass('rating', calculateMatchRating(bestMatch))">
                  {{ calculateMatchRating(bestMatch) }}
                </span>
                <span class="rating-lbl">RATING</span>
              </div>
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Records Grid -->
          <div class="records-grid">
            <div class="record-item">
              <span class="rec-val">{{ maxGoalsRecord }}</span>
              <span class="rec-lbl">Most Goals</span>
            </div>
            <div class="record-item">
              <span class="rec-val">{{ maxAssistsRecord }}</span>
              <span class="rec-lbl">Most Assists</span>
            </div>
            <div class="record-item">
              <span class="rec-val" style="color: #FFD700">{{ totalYellowCards }}</span>
              <span class="rec-lbl">Yellow Cards</span>
            </div>
            <div class="record-item">
              <span class="rec-val" style="color: #ff5252">{{ totalRedCards }}</span>
              <span class="rec-lbl">Red Cards</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Form Charts -->
      <div class="bento-item bento-item--wide trends-tile" style="--delay: 900ms">
        <div class="tile-header">
          <h4>Match Ratings History (Last 10 Matches)</h4>
          <div class="rating-badges">
            <span class="badge">Avg: {{ recentAverageRating }}</span>
            <span class="badge highlight">Best: {{ recentHighestRating }}</span>
          </div>
        </div>
        <div class="chart-area">
          <div class="chart-container">
            <div v-for="(match, index) in recentMatches" :key="match.id" class="bar-group">
              <div class="bar-value">{{ calculateMatchRating(match) }}</div>
              <div class="bar-track">
                <div 
                  class="bar-fill" 
                  :style="{ height: parseFloat(calculateMatchRating(match)) === 0 ? '4px' : Math.max((parseFloat(calculateMatchRating(match)) / 10) * 100, 15) + '%' }" 
                  :class="getStatColorClass('rating', calculateMatchRating(match))"
                ></div>
              </div>
              <div class="bar-label">{{ match.opponent.length > 3 ? match.opponent.substring(0, 3) : match.opponent }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-item bento-item--wide trends-tile" style="--delay: 1000ms">
        <div class="tile-header">
          <h4>Goals & Assists (Last 10 Matches)</h4>
          <div class="rating-badges">
            <span class="badge">Avg: {{ averageGoalsPerMatch }}</span>
          </div>
        </div>
        <div class="chart-area">
          <div class="chart-container">
            <div v-for="(match, index) in recentMatches" :key="match.id" class="bar-group">
              <div class="bar-value">{{ (match.my_goals || 0) + (match.assists || 0) }}</div>
              <div class="bar-track">
                <div 
                  class="bar-fill goal-fill" 
                  :style="{ height: ((match.my_goals || 0) + (match.assists || 0)) === 0 ? '4px' : Math.max(((match.my_goals || 0) + (match.assists || 0)) / Math.max(maxGoalsInMatch, 1) * 100, 15) + '%' }"
                ></div>
              </div>
              <div class="bar-label">{{ match.opponent.length > 3 ? match.opponent.substring(0, 3) : match.opponent }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShotMapSection from './ShotMapSection.vue'

const props = defineProps({
  matches: {
    type: Array,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  allShotsData: {
    type: Array,
    required: true
  },
  allGoalsData: {
    type: Array,
    required: true
  }
})

const formGuide = computed(() => {
  // Take the 5 most recent matches (assuming props.matches is sorted newest first)
  return props.matches.slice(0, 5).map(match => {
    const result = getMatchResult(match)
    let letter = 'D'
    let className = 'form-draw'
    
    if (result === 'Win') {
      letter = 'W'
      className = 'form-win'
    } else if (result === 'Loss') {
      letter = 'L'
      className = 'form-loss'
    }
    
    return { letter, class: className, result, opponent: match.opponent }
  })
})

const bestMatch = computed(() => {
  if (props.matches.length === 0) return null
  return props.matches.reduce((best, current) => {
    const bestRating = parseFloat(calculateMatchRating(best))
    const currentRating = parseFloat(calculateMatchRating(current))
    return currentRating > bestRating ? current : best
  }, props.matches[0])
})

const maxGoalsRecord = computed(() => {
  if (props.matches.length === 0) return 0
  return Math.max(...props.matches.map(m => m.my_goals || 0))
})

const maxAssistsRecord = computed(() => {
  if (props.matches.length === 0) return 0
  return Math.max(...props.matches.map(m => m.assists || 0))
})

const totalYellowCards = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.yellow_card || 0), 0)
})

const totalRedCards = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.red_card || 0), 0)
})

const getMatchResultClass = (match) => {
  const result = getMatchResult(match)
  if (result === 'Win') return 'text-win'
  if (result === 'Loss') return 'text-loss'
  return 'text-draw'
}

const wins = computed(() => {
  return props.matches.filter(match => match.score_for > match.score_against).length
})

const winRate = computed(() => {
  if (props.matches.length === 0) return 0
  return Math.round((wins.value / props.matches.length) * 100)
})

const averageRating = computed(() => {
  if (props.matches.length === 0) return '0.0'
  const totalRating = props.matches.reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
  return (totalRating / props.matches.length).toFixed(2)
})

const recentMatches = computed(() => {
  // Sort by date descending first to get the actual most recent matches
  const sorted = [...props.matches].sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
  // Take top 10. No reverse() means Newest -> Oldest (Most recent on left)
  return sorted.slice(0, 10)
})

const recentAverageRating = computed(() => {
  if (recentMatches.value.length === 0) return '0.0'
  const totalRating = recentMatches.value.reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
  return (totalRating / recentMatches.value.length).toFixed(2)
})

const recentHighestRating = computed(() => {
  if (recentMatches.value.length === 0) return '0.0'
  const ratings = recentMatches.value.map(match => parseFloat(calculateMatchRating(match)))
  return Math.max(...ratings).toFixed(2)
})

const totalGoals = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.my_goals || 0), 0)
})

const totalShotsOnTarget = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.shots_on_target || 0), 0)
})

const totalShotsOffTarget = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.shots_off_target || 0), 0)
})

const totalShots = computed(() => totalShotsOnTarget.value + totalShotsOffTarget.value)

const shotConversionRate = computed(() => {
  if (totalShots.value === 0) return 0
  // Cap at 100 in case of data inconsistencies
  return Math.min(100, Math.round((totalGoals.value / totalShots.value) * 100))
})

const shotAccuracy = computed(() => {
  if (totalShots.value === 0) return 0
  return Math.min(100, Math.round((totalShotsOnTarget.value / totalShots.value) * 100))
})

const totalAssists = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.assists || 0), 0)
})

const totalSuccessfulPasses = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.successful_passes || 0), 0)
})

const totalUnsuccessfulPasses = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.unsuccessful_passes || 0), 0)
})

const totalChancesCreated = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.created_chances || 0), 0)
})

const passAccuracy = computed(() => {
  const total = totalSuccessfulPasses.value + totalUnsuccessfulPasses.value
  if (total === 0) return 0
  return Math.round((totalSuccessfulPasses.value / total) * 100)
})

const totalTackles = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.tackles || 0), 0)
})

const totalInterceptions = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.interceptions || 0), 0)
})

const totalClearances = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.clearances || 0), 0)
})

const totalFouls = computed(() => {
  return props.matches.reduce((sum, match) => sum + (match.fouls || 0), 0)
})

const averageGoalsPerMatch = computed(() => {
  if (props.matches.length === 0) return '0.0'
  return ((totalGoals.value + totalAssists.value) / props.matches.length).toFixed(1)
})

const maxGoalsInMatch = computed(() => {
  if (props.matches.length === 0) return 1
  return Math.max(...props.matches.map(match => (match.my_goals || 0) + (match.assists || 0)), 1)
})

const overallRating = computed(() => {
  if (props.matches.length === 0) return 65
  const avgStats = (shootingStat.value + passingStat.value + defendingStat.value + dribblingStat.value + paceStat.value + physicalStat.value) / 6
  return Math.min(99, Math.max(30, Math.round(avgStats)))
})

const shootingStat = computed(() => {
  if (props.matches.length === 0) return 65
  const avgGoals = totalGoals.value / props.matches.length
  const avgShotsOnTarget = props.matches.reduce((sum, match) => {
    return sum + (match.shots_on_target || 0)
  }, 0) / props.matches.length
  
  let rating = 50 + (avgGoals * 15) + (avgShotsOnTarget * 5)
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const passingStat = computed(() => {
  if (props.matches.length === 0) return 65
  const accuracy = passAccuracy.value
  const avgPasses = (totalSuccessfulPasses.value + totalUnsuccessfulPasses.value) / props.matches.length
  
  let rating = 40 + (accuracy * 0.4) + (avgPasses * 0.5)
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const defendingStat = computed(() => {
  if (props.matches.length === 0) return 65
  const avgTackles = totalTackles.value / props.matches.length
  const avgInterceptions = totalInterceptions.value / props.matches.length
  const avgClearances = totalClearances.value / props.matches.length
  
  let rating = 45 + (avgTackles * 8) + (avgInterceptions * 6) + (avgClearances * 4)
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const dribblingStat = computed(() => {
  if (props.matches.length === 0) return 65
  const avgDribbles = props.matches.reduce((sum, match) => sum + (match.dribbles || 0), 0) / props.matches.length
  const avgGoals = totalGoals.value / props.matches.length
  
  let rating = 50 + (avgDribbles * 6) + (avgGoals * 5)
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const paceStat = computed(() => {
  if (props.matches.length === 0) return 70
  const avgAssists = totalAssists.value / props.matches.length
  const winRateBonus = winRate.value * 0.2
  
  let rating = 60 + (avgAssists * 8) + winRateBonus
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const physicalStat = computed(() => {
  if (props.matches.length === 0) return 65
  const avgFouls = totalFouls.value / props.matches.length
  const avgTackles = totalTackles.value / props.matches.length
  const matchesPlayed = props.matches.length
  
  let rating = 55 + (avgTackles * 6) + (avgFouls * 2) + (matchesPlayed * 0.5)
  return Math.min(99, Math.max(30, Math.round(rating)))
})

const formStat = computed(() => {
  if (props.matches.length === 0) return 65
  const recent = recentMatches.value.slice(0, 10)
  if (recent.length === 0) return 65
  
  const recentRatings = recent.map(match => parseFloat(calculateMatchRating(match)))
  const avgRecentRating = recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length
  
  let formRating = 30 + (avgRecentRating * 6.9)
  
  const recentWins = recent.filter(match => match.score_for > match.score_against).length
  const winBonus = (recentWins / recent.length) * 10
  
  return Math.min(99, Math.max(30, Math.round(formRating + winBonus)))
})

const calculateMatchRating = (match) => {
  if (!match) return '0.00'

  let rating = 6.0
  const shotsOnTarget = match.shots_on_target || 0
  const shotsOffTarget = match.shots_off_target || 0
  const myGoalsCount = match.my_goals || 0

  const isGoalkeeper = match.position_played && match.position_played.toLowerCase().includes('goalkeeper')

  if (isGoalkeeper && match.goalkeeper_stats) {
    rating += (match.goalkeeper_stats.saves || 0) * 0.175
    rating += (match.goalkeeper_stats.catches || 0) * 0.175
    rating += (match.goalkeeper_stats.punches || 0) * 0.15
    rating += (match.goalkeeper_stats.penalties_saved || 0) * 1.25
    rating -= (match.goalkeeper_stats.goals_conceded || 0) * 1
  } else if (isGoalkeeper) {
    const goalsAgainst = match.score_against || 0
    rating -= goalsAgainst * 1
  }

  rating += myGoalsCount * 1.7
  rating += (match.assists || 0) * 1.0
  rating += shotsOnTarget * 0.2
  rating += shotsOffTarget * 0.1
  rating += (match.tackles || 0) * 0.1
  rating += (match.interceptions || 0) * 0.2
  rating += (match.dribbles || 0) * 0.1
  rating += (match.successful_passes || 0) * 0.05
  rating += (match.created_chances || 0) * 0.25

  rating -= (match.fouls || 0) * 0.25
  rating -= (match.lost_possessions || 0) * 0.15
  rating -= (match.unsuccessful_passes || 0) * 0.05
  rating -= (match.own_goals || 0) * 2.0

  rating -= (match.yellow_card || 0) * 0.75
  rating -= (match.red_card || 0) * 3

  return Math.max(0, Math.min(10, rating)).toFixed(2)
}

const getMatchResult = (match) => {
  if (match.score_for > match.score_against) return 'Win'
  if (match.score_for < match.score_against) return 'Loss'
  return 'Draw'
}

const ratingColorConfig = {
  excellent: { threshold: 9.0, class: 'stat-excellent' },
  good: { threshold: 8.0, class: 'stat-good' },
  mid: { threshold: 6.5, class: 'stat-mid' },
  bad: { threshold: 5.0, class: 'stat-bad' },
  horrible: { threshold: 0, class: 'stat-horrible' },
}

const getStatColorClass = (statType, value) => {
  const numValue = parseFloat(value) || 0
  if (statType === 'rating') {
    if (numValue >= ratingColorConfig.excellent.threshold) return ratingColorConfig.excellent.class
    if (numValue >= ratingColorConfig.good.threshold) return ratingColorConfig.good.class
    if (numValue >= ratingColorConfig.mid.threshold) return ratingColorConfig.mid.class
    if (numValue >= ratingColorConfig.bad.threshold) return ratingColorConfig.bad.class
    return ratingColorConfig.horrible.class
  }
  if (statType === 'goals') {
    if (numValue >= 2) return 'stat-good'
    if (numValue >= 1) return 'stat-mid'
    return 'stat-bad'
  }
  if (statType === 'assists') {
    if (numValue >= 2) return 'stat-good'
    if (numValue >= 1) return 'stat-mid'
    return 'stat-bad'
  }
  return ''
}

// Radar Chart Logic
const radarStats = computed(() => [
  { label: 'PAC', value: paceStat.value, fullLabel: 'Pace' },
  { label: 'SHO', value: shootingStat.value, fullLabel: 'Shooting' },
  { label: 'PAS', value: passingStat.value, fullLabel: 'Passing' },
  { label: 'DRI', value: dribblingStat.value, fullLabel: 'Dribbling' },
  { label: 'DEF', value: defendingStat.value, fullLabel: 'Defending' },
  { label: 'PHY', value: physicalStat.value, fullLabel: 'Physical' }
])

const radarConfig = {
  size: 260,
  center: 130,
  radius: 90,
  levels: [25, 50, 75, 100]
}

const getPointOnCircle = (value, index, total) => {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2 // Start at top (-90deg)
  const r = (value / 100) * radarConfig.radius
  const x = radarConfig.center + r * Math.cos(angle)
  const y = radarConfig.center + r * Math.sin(angle)
  return { x, y }
}

const radarPolygonPoints = computed(() => {
  return radarStats.value.map((stat, i) => {
    const { x, y } = getPointOnCircle(stat.value, i, 6)
    return `${x},${y}`
  }).join(' ')
})

const getLevelPolygon = (level) => {
  return Array.from({ length: 6 }).map((_, i) => {
    const { x, y } = getPointOnCircle(level, i, 6)
    return `${x},${y}`
  }).join(' ')
}

const radarLabels = computed(() => {
  return radarStats.value.map((stat, i) => {
    // Push labels out a bit further than radius
    const { x, y } = getPointOnCircle(125, i, 6) // 125% radius position
    return {
      ...stat,
      x,
      y
    }
  })
})

// Donut Chart Logic
const donutConfig = {
  size: 200,
  center: 100,
  radius: 80,
  hole: 50
}

const getDonutPaths = computed(() => {
  const total = totalTackles.value + totalInterceptions.value + totalClearances.value
  if (total === 0) return []

  let startAngle = -Math.PI / 2 // Start at top
  const data = [
    { value: totalTackles.value, color: '#4cda9c', label: 'Tackles' },       // Green
    { value: totalInterceptions.value, color: '#FFC107', label: 'Interceptions' }, // Gold
    { value: totalClearances.value, color: '#2979FF', label: 'Clearances' }   // Blue
  ]

  return data.map(item => {
    if (item.value === 0) return null
    const sliceAngle = (item.value / total) * 2 * Math.PI
    const endAngle = startAngle + sliceAngle

    // Calculate coordinates
    const x1 = donutConfig.center + donutConfig.radius * Math.cos(startAngle)
    const y1 = donutConfig.center + donutConfig.radius * Math.sin(startAngle)
    const x2 = donutConfig.center + donutConfig.radius * Math.cos(endAngle)
    const y2 = donutConfig.center + donutConfig.radius * Math.sin(endAngle)
    
    // For donut hole (inner circle) - go backwards from end to start
    const x3 = donutConfig.center + donutConfig.hole * Math.cos(endAngle)
    const y3 = donutConfig.center + donutConfig.hole * Math.sin(endAngle)
    const x4 = donutConfig.center + donutConfig.hole * Math.cos(startAngle)
    const y4 = donutConfig.center + donutConfig.hole * Math.sin(startAngle)

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0

    const path = [
      `M ${x1} ${y1}`, // Move to start outer
      `A ${donutConfig.radius} ${donutConfig.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc to end outer
      `L ${x3} ${y3}`, // Line to end inner
      `A ${donutConfig.hole} ${donutConfig.hole} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Arc to start inner (sweep 0 for reverse)
      'Z' // Close
    ].join(' ')

    startAngle = endAngle
    return { ...item, path }
  }).filter(Boolean)
})
</script>

<style scoped>
/* --- Material 3 Tokens (Green Theme) --- */
:root {
  --md-sys-color-primary: #4cda9c;
  --md-sys-color-on-primary: #003822;
  --md-sys-color-primary-container: #005233;
  --md-sys-color-on-primary-container: #89f8c1;
  --md-sys-color-secondary: #b3ccbf;
  --md-sys-color-surface: #101418;
  --md-sys-color-surface-variant: #2d3135;
  --md-sys-color-on-surface: #e1e2e6;
  --md-sys-color-outline: #89938d;
  --md-radius-l: 28px;
  --md-radius-m: 16px;
  --md-radius-s: 12px;
}

.dashboard-overview {
  color: white;
  width: 100%;
  padding-bottom: 40px;
}

/* --- Bento Grid Layout --- */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; /* Reduced gap */
  width: 100%;
  grid-auto-rows: minmax(140px, auto); /* Control row height */
}

/* Responsive Breakpoints for Grid */
@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .bento-item--wide {
    grid-column: span 4;
  }
  
  .bento-item--tall {
    grid-row: span 2;
    grid-column: span 2;
  }

  .stat-tile {
    grid-column: span 1;
  }
}

@media (min-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .bento-item--wide {
    grid-column: span 2;
  }
  
  .shot-map-tile {
    grid-column: span 2;
    grid-row: span 2;
  }
  
  .player-card-tile {
    grid-column: span 1;
    grid-row: span 2;
  }
  
  .performance-tile {
    grid-column: span 1;
  }
}

/* --- Bento Items Styling --- */
.bento-item {
  background: rgba(15, 18, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px; /* Slightly smaller radius */
  padding: 20px; /* Reduced padding */
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4);
  
  /* Entry Animation */
  animation: slideInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  animation-delay: var(--delay, 0ms);
}

.bento-item:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5);
  background: rgba(25, 30, 35, 0.9);
  border-color: rgba(76, 218, 156, 0.3); /* Green tint on hover */
}

.bento-item::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at top right, rgba(76, 218, 156, 0.1), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.bento-item:hover::after {
  opacity: 1;
}

/* --- Stat Tiles --- */
.stat-tile {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 32px 20px;
}

.stat-icon-circle {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.stat-tile:hover .stat-icon-circle {
  transform: scale(1.1) rotate(5deg);
  background: rgba(76, 218, 156, 0.15);
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #fff 30%, #a5d6a7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.stat-content p {
  margin: 4px 0 0;
  color: #a0a0a0;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* --- Player Card (EA FC Style) --- */
.player-card-tile {
  padding: 0; /* Custom padding for this one */
  background: linear-gradient(160deg, #0f1113 0%, #050608 100%);
  border: 1px solid rgba(218, 165, 32, 0.3); /* Gold tint border */
}

.player-card-tile .card-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-card-tile .card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #daa520; /* Gold */
}

.ea-fc-card {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.player-upper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.overall-rating {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  color: #fff;
}

.position {
  font-size: 1rem;
  font-weight: 600;
  color: #daa520;
}

.divider {
  width: 30px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  margin: 6px 0;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #333, #111);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  border: 3px solid rgba(218, 165, 32, 0.5);
}

.player-name {
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

/* --- Radar Chart Styles --- */
.radar-chart-container {
  width: 100%;
  height: 220px; /* Reduced height */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.radar-svg {
  width: 100%;
  height: 100%;
  max-width: 260px; /* Reduced max-width */
  overflow: visible;
}

.radar-level {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.radar-axis {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.radar-polygon {
  fill: rgba(76, 218, 156, 0.3);
  stroke: #4cda9c;
  stroke-width: 2;
  filter: drop-shadow(0 0 8px rgba(76, 218, 156, 0.4));
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.radar-point {
  fill: #101418;
  stroke: #4cda9c;
  stroke-width: 2;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.radar-label {
  fill: #aaa;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.radar-value {
  fill: #fff;
  font-size: 0.9rem;
  font-weight: 700;
}

/* --- Stats Row (Goals Breakdown) --- */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 10px 0;
}

.mini-stats {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.big-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.medium-number {
  font-size: 1.6rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #fff 30%, #89f8c1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.label {
  font-size: 0.8rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent);
}

/* --- Chart Styles --- */
.chart-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Stacked Bar */
.stacked-bar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-labels-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 4px;
}

.stacked-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  display: flex;
  overflow: hidden;
}

.bar-segment {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.segment-good { background: #4cda9c; }
.segment-bad { background: #ef5350; }
.segment-primary { background: #4cda9c; }
.segment-secondary { background: #89f8c1; }

.bar-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #ccc;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-good { background: #4cda9c; }
.dot-bad { background: #ef5350; }

.total-label, .total-passes-label {
  text-align: center;
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}

.header-spaced {
  margin-bottom: 30px; /* Increased spacing as requested */
}

/* Shooting Stats */
.shooting-stats {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px;
}

.stat-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #ccc;
  font-weight: 500;
}

.simple-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.simple-bar-fill {
  height: 100%;
  background: #4cda9c;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.fill-gold {
  background: #FFC107;
}

/* Donut Chart */
.donut-chart-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.donut-svg {
  width: 180px;
  height: 180px;
  overflow: visible;
}

.donut-segment {
  transition: all 0.3s ease;
  cursor: pointer;
  transform-origin: center;
}

.donut-segment:hover {
  filter: brightness(1.2);
  transform: scale(1.05);
}

.donut-total-label {
  fill: #888;
  font-size: 14px;
  font-weight: 600;
}

.donut-total-value {
  fill: #fff;
  font-size: 24px;
  font-weight: 800;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

/* --- Trends Tiles (Charts) --- */
.rating-badges {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #ccc;
}

.badge.highlight {
  background: rgba(76, 218, 156, 0.15);
  color: #4cda9c;
}

.chart-area {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding-top: 20px;
  overflow-x: auto;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 120px;
  gap: 8px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
  min-width: 30px;
}

.bar-value {
  font-size: 0.75rem;
  margin-bottom: 4px;
  color: #888;
  opacity: 1; /* Always visible */
  transform: translateY(0); /* No transform */
  transition: all 0.3s;
}

.bar-group:hover .bar-value {
  color: #fff; /* Highlight text on hover instead */
}

.bar-track {
  width: 12px;
  height: 80%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: currentColor; /* Use the color from the class (red/green/etc) */
  border-radius: 10px;
  transition: height 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.goal-fill {
  background: linear-gradient(to top, #4cda9c, #89f8c1);
}

.bar-label {
  font-size: 0.65rem;
  color: #666;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* --- Stat Color Classes --- */
.stat-excellent { color: #4cda9c !important; }
.stat-good { color: #81c784 !important; }
.stat-mid { color: #ffb74d !important; }
.stat-bad { color: #e57373 !important; }
.stat-horrible { color: #ef5350 !important; }

/* --- Insights Tile --- */
.insights-tile .tile-header {
  margin-bottom: 16px;
}

.insights-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.insight-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.insight-label {
  font-size: 0.75rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.form-guide {
  display: flex;
  gap: 6px;
}

.form-dot {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #000;
}

.form-win { background: #4cda9c; }
.form-draw { background: #bdbdbd; }
.form-loss { background: #ef5350; }

.divider-line {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
}

/* Best Match Card */
.best-match-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-opp-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.opp-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.match-score {
  font-size: 0.8rem;
  font-weight: 700;
}

.text-win { color: #4cda9c; }
.text-loss { color: #ef5350; }
.text-draw { color: #bdbdbd; }

.match-rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rating-val {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
}

.rating-lbl {
  font-size: 0.6rem;
  color: #888;
  font-weight: 600;
}

/* Records Grid */
.records-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.record-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  border-radius: 8px;
}

.rec-val {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
}

.rec-lbl {
  font-size: 0.65rem;
  color: #888;
  text-transform: uppercase;
}

/* Responsive adjustments for new tile */
@media (min-width: 1200px) {
  .insights-tile {
    grid-column: span 2;
    grid-row: span 2; /* Make it same height as shot map if possible */
  }
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 12px; /* Smaller gap */
  }
  
  .bento-item {
    padding: 16px;
    border-radius: 20px;
  }

  .stat-tile {
    padding: 16px;
    flex-direction: row;
    text-align: left;
    justify-content: flex-start;
  }
  
  .stat-icon-circle {
    margin-bottom: 0;
    width: 42px;
    height: 42px;
    font-size: 1.5rem;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .bento-item--wide, 
  .bento-item--tall, 
  .shot-map-tile {
    grid-column: span 1;
    grid-row: auto;
  }

  .chart-container {
    overflow-x: auto;
    justify-content: flex-start;
    padding-right: 10px;
    gap: 12px;
  }
  
  .bar-group {
    min-width: 32px;
  }
  
  .player-card-tile .card-header {
    padding: 16px;
  }
  
  .ea-fc-card {
    padding: 0 16px 16px;
  }
  
  .overall-rating {
    font-size: 2.5rem;
  }
  
  .player-name {
    font-size: 1.3rem;
  }
  
  .big-number {
    font-size: 1.5rem;
  }
  
  .tile-header h4 {
    font-size: 1rem;
  }
}
</style>
