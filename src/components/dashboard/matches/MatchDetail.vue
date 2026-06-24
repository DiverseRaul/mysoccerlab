<template>
  <div class="live-match-view card-glass">
    <div class="match-header-redesign">
      <button @click="$emit('back')" class="back-button">
        <i class="ph ph-arrow-left" style="font-size:20px" aria-hidden="true"></i>
        <span>Back to Matches</span>
      </button>

      <div class="match-card" :class="`match-card--${getMatchResult(activeMatch).toLowerCase()}`">
        <div class="match-card-content">
          <div class="match-info">
            <h3 class="opponent-name">vs {{ activeMatch.opponent }}</h3>
            <div class="match-date">{{ formatDate(activeMatch.match_date) }}</div>
          </div>
          <div class="score-display">
            <div class="score-container">
              <span class="score-number">{{ activeMatch.score_for }}</span>
              <span class="score-divider">–</span>
              <span class="score-number">{{ activeMatch.score_against }}</span>
            </div>
            <span class="result-badge" :class="getMatchResult(activeMatch).toLowerCase()">{{ getMatchResult(activeMatch) }}</span>
          </div>
        </div>
      </div>
    </div>



    <div class="live-rating-bar" data-testid="live-rating-bar">
      <span class="live-rating-bar__value" :class="getStatColorClass('rating', calculateMatchRating(activeMatch))">{{ calculateMatchRating(activeMatch) }}</span>
      <div class="live-rating-bar__meta">
        <span class="live-rating-bar__label">Match Rating</span>
        <span class="live-rating-bar__tier" :class="getStatColorClass('rating', calculateMatchRating(activeMatch))">{{ getRatingLabel(calculateMatchRating(activeMatch)) }}</span>
      </div>
      <div class="live-rating-bar__xg" title="Total expected goals from logged shots">
        <span class="live-rating-bar__xg-value">{{ matchXg }}</span>
        <span class="live-rating-bar__xg-label">xG</span>
      </div>
    </div>

    <div class="match-view-controls">
      <div class="position-controls">
        <div class="position-display">
          <label for="position-select" class="position-display__label">Position Played</label>
          <div class="position-select-wrap">
            <select id="position-select" v-model="activeMatch.position_played" @change="$emit('update-position')" class="position-select">
              <option v-for="position in positions" :key="position" :value="position">{{ position }}</option>
            </select>
          </div>
        </div>
        <div class="goalkeeper-toggle">
          <label for="gk-mode" class="goalkeeper-toggle__label">Goalkeeper Mode</label>
          <label class="switch">
            <input type="checkbox" id="gk-mode" :checked="isGoalkeeperMode" @change="$emit('update:isGoalkeeperMode', $event.target.checked)">
            <span class="slider round"></span>
          </label>
        </div>
      </div>
      <div class="logger-view-row">
        <span class="logger-view-row__label">Logging view</span>
        <div class="logger-view-toggle" data-testid="match-logger-toggle" role="tablist" aria-label="Logging mode">
          <button
            type="button"
            class="logger-view-toggle__btn"
            :class="{ active: loggerView === 'map' }"
            role="tab"
            :aria-selected="loggerView === 'map'"
            data-testid="logger-view-map"
            @click="$emit('update:loggerView', 'map')"
          >Map</button>
          <button
            type="button"
            class="logger-view-toggle__btn"
            :class="{ active: loggerView === 'counters' }"
            role="tab"
            :aria-selected="loggerView === 'counters'"
            data-testid="logger-view-counters"
            @click="$emit('update:loggerView', 'counters')"
          >Counters</button>
        </div>
      </div>
    </div>

    <div v-if="loggerView === 'counters'" class="live-view-content single-column">
      <!-- Combined Performance + Goals & Shots panel -->
      <div class="live-stats-panel">
        <div class="perf-and-events">
          <!-- Event log sub-section (rating now lives in the shared header bar) -->
          <div class="event-log-sub">
            <div class="event-log-title">Goals &amp; Shots</div>
            <div class="event-list">
              <div v-for="item in combinedEvents" :key="item.type + item.id" class="event-item" @click="selectEventForViz(item)">
                <div class="event-time-and-icon">
                  <span class="event-icon">{{ item.type === 'Goal' ? '⚽' : '🎯' }}</span>
                </div>
                <div class="event-details">
                  <span class="event-type">
                    {{ item.details }}
                    <span v-if="item.count > 1" class="event-count">({{ item.count }}x)</span>
                  </span>
                  <span v-if="item.type === 'Goal'" class="event-subtype">({{ item.goal_type }})</span>
                </div>
                <div v-if="item.quadrant" class="event-quadrant-indicator">🎯</div>
                <button @click.stop="removeEventGroup(item)" class="remove-event-btn">&times;</button>
              </div>
            </div>
            <div v-if="selectedEvent" class="shot-visualization">
              <div class="viz-header">
                <div class="view-toggles">
                  <button
                    @click="$emit('update:vizView', 'field')"
                    class="viz-toggle-btn"
                    :class="{ active: vizView === 'field' }"
                  >
                    Origin
                  </button>
                  <button
                    @click="$emit('update:vizView', 'goal')"
                    class="viz-toggle-btn"
                    :class="{ active: vizView === 'goal' }"
                  >
                    Placement
                  </button>
                </div>
              </div>

              <div class="viz-container">
                <div v-if="vizView === 'field'" class="viz-section">
                  <div class="field-grid-container viz-field">
                    <!-- SVG Field Markings (Dark Theme) -->
                    <svg class="field-markings-svg" viewBox="0 0 68 52.5" preserveAspectRatio="none">
                      <rect x="0" y="0" width="68" height="52.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
                      <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                      <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                      <circle cx="34" cy="11" r="0.4" fill="rgba(255,255,255,0.8)" />
                      <path d="M 26.68 16.5 A 9.15 9.15 0 0 0 41.32 16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                      <path d="M 24.85 52.5 A 9.15 9.15 0 0 1 43.15 52.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                      <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                      <path d="M 68 2 A 2 2 0 0 1 66 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                      <path d="M 30.34 0 L 30.34 -1.5 L 37.66 -1.5 L 37.66 0" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8" />
                    </svg>
                    <svg class="field-markings-svg overlay" viewBox="0 0 68 52.5" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
                      <line
                        v-if="showTrajectory"
                        :x1="shotTrajectory.x1"
                        :y1="shotTrajectory.y1"
                        :x2="shotTrajectory.x2"
                        :y2="shotTrajectory.y2"
                        stroke="rgba(255,255,255,0.4)"
                        stroke-width="0.5"
                        stroke-dasharray="2"
                      />
                    </svg>
                    <div
                      v-if="selectedEvent.field_position"
                      class="shot-marker"
                      :class="{
                        'off-target': selectedEvent.type === 'Shot' && !selectedEvent.on_target,
                        'goal': selectedEvent.type === 'Goal'
                      }"
                      :style="getShotMarkerStyle(selectedEvent)"
                    ></div>
                    <div v-else class="viz-placeholder">
                      <span>No origin recorded</span>
                    </div>
                  </div>
                </div>

                <div v-if="vizView === 'goal'" class="viz-section">
                  <div class="goal-grid-container viz-grid">
                    <ShotField
                      mode="placement"
                      :placement-marker="selectedEventPlacementMarker"
                      :quadrant="selectedEvent.quadrant || 0"
                      :show-placeholder="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="live-controls-panel">
        <h4>Match Events</h4>
        <div v-if="isGoalkeeperMode && goalkeeperStats" class="live-match-controls gk-controls">
          <div class="stat-control-group">
            <span class="stat-label">Saves</span>
            <div class="button-group">
              <button @click="incrementGkStat('saves', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ goalkeeperStats.saves || 0 }}</span>
              <button @click="incrementGkStat('saves', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Catches</span>
            <div class="button-group">
              <button @click="incrementGkStat('catches', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ goalkeeperStats.catches || 0 }}</span>
              <button @click="incrementGkStat('catches', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Punches</span>
            <div class="button-group">
              <button @click="incrementGkStat('punches', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ goalkeeperStats.punches || 0 }}</span>
              <button @click="incrementGkStat('punches', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Penalties Saved</span>
            <div class="button-group">
              <button @click="incrementGkStat('penalties_saved', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ goalkeeperStats.penalties_saved || 0 }}</span>
              <button @click="incrementGkStat('penalties_saved', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group error-stat">
            <span class="stat-label">Error Led to Goal</span>
            <div class="button-group">
              <button @click="incrementGkStat('errors_led_to_goal', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ goalkeeperStats.errors_led_to_goal || 0 }}</span>
              <button @click="incrementGkStat('errors_led_to_goal', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Goal</span>
            <div class="button-group">
              <span class="stat-value-display">{{ myGoalsForMatch }}</span>
              <button @click="handleMyGoal(1)" class="btn btn-success">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Assist</span>
            <div class="button-group">
              <button @click="incrementStat('assists', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.assists || 0 }}</span>
              <button @click="logEvent('assists', 'Assist')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Good Pass</span>
            <div class="button-group">
              <button @click="incrementStat('successful_passes', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.successful_passes || 0 }}</span>
              <button @click="logEvent('successful_passes', 'Pass')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Bad Pass</span>
            <div class="button-group">
              <button @click="incrementStat('unsuccessful_passes', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.unsuccessful_passes || 0 }}</span>
              <button @click="logEvent('unsuccessful_passes', 'Bad Pass')" class="btn">+</button>
            </div>
          </div>
        </div>
        <div v-else class="live-match-controls">
          <div class="stat-control-group">
            <span class="stat-label">My Goal</span>
            <div class="button-group">
              <span class="stat-value-display">{{ myGoalsForMatch }}</span>
              <button @click="handleMyGoal(1)" class="btn btn-success">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">My Assist</span>
            <div class="button-group">
              <button @click="incrementStat('assists', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.assists || 0 }}</span>
              <button @click="logEvent('assists', 'Assist')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Shot</span>
            <div class="button-group">
              <span class="stat-value-display">{{ shotsOnTarget + shotsOffTarget }}</span>
              <button @click="handleShot()" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Tackle</span>
            <div class="button-group">
              <button @click="incrementStat('tackles', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.tackles || 0 }}</span>
              <button @click="logEvent('tackles', 'Tackle')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Interception</span>
            <div class="button-group">
              <button @click="incrementStat('interceptions', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.interceptions || 0 }}</span>
              <button @click="logEvent('interceptions', 'Interception')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Clearance</span>
            <div class="button-group">
              <button @click="incrementStat('clearances', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.clearances || 0 }}</span>
              <button @click="logEvent('clearances', 'Clearance')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Dribble</span>
            <div class="button-group">
              <button @click="incrementStat('dribbles', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.dribbles || 0 }}</span>
              <button @click="logEvent('dribbles', 'Dribble')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Chance Created</span>
            <div class="button-group">
              <button @click="incrementStat('created_chances', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.created_chances || 0 }}</span>
              <button @click="logEvent('created_chances', 'Chance')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Possession Lost</span>
            <div class="button-group">
              <button @click="incrementStat('lost_possessions', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.lost_possessions || 0 }}</span>
              <button @click="incrementStat('lost_possessions', 1)" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Good Pass</span>
            <div class="button-group">
              <button @click="incrementStat('successful_passes', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.successful_passes || 0 }}</span>
              <button @click="logEvent('successful_passes', 'Pass')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Bad Pass</span>
            <div class="button-group">
              <button @click="incrementStat('unsuccessful_passes', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.unsuccessful_passes || 0 }}</span>
              <button @click="logEvent('unsuccessful_passes', 'Bad Pass')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Foul</span>
            <div class="button-group">
              <button @click="incrementStat('fouls', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.fouls || 0 }}</span>
              <button @click="logEvent('fouls', 'Foul')" class="btn">+</button>
            </div>
          </div>
          <div class="stat-control-group error-stat">
            <span class="stat-label">Error Led to Goal</span>
            <div class="button-group">
              <button @click="incrementStat('errors_led_to_goal', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.errors_led_to_goal || 0 }}</span>
              <button @click="incrementStat('errors_led_to_goal', 1)" class="btn">+</button>
            </div>
          </div>
        </div>
        <h4>Disciplinary</h4>
        <div class="live-match-controls card-controls">
          <div class="stat-control-group">
            <span class="stat-label">Yellow Card</span>
            <div class="button-group">
              <button @click="incrementStat('yellow_card', -1)" class="btn btn-secondary card-btn-remove">-</button>
              <span class="stat-value-display">{{ activeMatch.yellow_card || 0 }}</span>
              <button @click="incrementStat('yellow_card', 1)" class="btn btn-warning card-btn"></button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Red Card</span>
            <div class="button-group">
              <button @click="incrementStat('red_card', -1)" class="btn btn-secondary card-btn-remove">-</button>
              <span class="stat-value-display">{{ activeMatch.red_card || 0 }}</span>
              <button @click="incrementStat('red_card', 1)" class="btn btn-danger card-btn"></button>
            </div>
          </div>
        </div>
        <h4>Score Events</h4>
        <div class="live-match-controls">
          <div class="stat-control-group">
            <span class="stat-label">Our Goal</span>
            <div class="button-group">
              <button @click="incrementStat('score_for', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.score_for || 0 }}</span>
              <button @click="incrementStat('score_for', 1)" class="btn btn-primary">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Their Goal</span>
            <div class="button-group">
              <button @click="incrementStat('score_against', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.score_against || 0 }}</span>
              <button @click="incrementStat('score_against', 1)" class="btn btn-danger">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Own Goal</span>
            <div class="button-group">
              <button @click="incrementStat('own_goals', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.own_goals || 0 }}</span>
              <button @click="incrementStat('own_goals', 1)" class="btn btn-danger">+</button>
            </div>
          </div>
          <div class="stat-control-group">
            <span class="stat-label">Penalty Conceded</span>
            <div class="button-group">
              <button @click="incrementStat('penalties_conceded', -1)" class="btn btn-danger">-</button>
              <span class="stat-value-display">{{ activeMatch.penalties_conceded || 0 }}</span>
              <button @click="incrementStat('penalties_conceded', 1)" class="btn btn-danger">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loggerView === 'map'" class="map-logger-view">
      <MatchMapLogger
        :Coordinates="loggedEventCoordinates"
        :HeatmapPoints="editorHeatmapPoints"
        :TimelineEvents="timelineEvents"
        @LogEvent="onMapLogEvent"
        @DeletePin="deleteLoggedEvent"
        @delete-event="onTimelineDelete"
      />
      <EventSummaryPanel
        :ActiveMatch="activeMatch"
        :GoalCount="matchGoals.length"
        :ShotCount="matchShots.length"
        :IsGoalkeeperMode="isGoalkeeperMode"
        :GoalkeeperStats="goalkeeperStats"
      />
      <QuickLogControls
        :ActiveMatch="activeMatch"
        :IsGoalkeeperMode="isGoalkeeperMode"
        :GoalkeeperStats="goalkeeperStats"
        @Increment="onQuickIncrement"
        @IncrementGk="onQuickIncrementGk"
      />
    </div>

    <div
      v-if="loggerView === 'counters' && activeMatch.track_heatmap_for_match && enableHeatmapTracking && editorHeatmapPoints.length"
      class="heatmap-view"
    >
      <h4 class="heatmap-view__title">Match Heatmap</h4>
      <HeatmapCanvas :points="editorHeatmapPoints" />
    </div>

    <div v-if="loggerView === 'counters'" class="timeline-wrap">
      <MatchTimeline :Events="timelineEvents" @delete="onTimelineDelete" />
    </div>

    <div class="match-actions">
      <button @click="$emit('open-share')" class="action-btn share-btn">
        <i class="ph ph-share-network" style="font-size:16px" aria-hidden="true"></i>
        Share Match
      </button>
      <button @click="$emit('edit-match')" class="action-btn edit-btn">
        <i class="ph ph-pencil-simple" style="font-size:16px" aria-hidden="true"></i>
        Edit Match
      </button>
      <button @click="$emit('delete-match')" class="action-btn delete-btn">
        <i class="ph ph-trash" style="font-size:16px" aria-hidden="true"></i>
        Delete Match
      </button>
    </div>
  </div>
</template>

<script setup>
import HeatmapCanvas from '../../ui/HeatmapCanvas.vue'
import ShotField from '../../ui/ShotField.vue'
import MatchTimeline from './MatchTimeline.vue'
import MatchMapLogger from './MatchMapLogger.vue'
import QuickLogControls from './QuickLogControls.vue'
import EventSummaryPanel from '../overview/EventSummaryPanel.vue'
import { getRatingLabel } from '../../../lib/rating'

defineProps({
  activeMatch: { type: Object, required: true },
  positions: { type: Array, required: true },
  isGoalkeeperMode: { type: Boolean, default: false },
  goalkeeperStats: { type: Object, default: null },
  loggerView: { type: String, required: true },
  vizView: { type: String, required: true },
  selectedEvent: { type: Object, default: null },
  selectedEventPlacementMarker: { type: Object, default: null },
  enableHeatmapTracking: { type: Boolean, default: true },
  // Aggregations / derived
  matchXg: { type: [Number, String], default: 0 },
  matchGoals: { type: Array, default: () => [] },
  matchShots: { type: Array, default: () => [] },
  combinedEvents: { type: Array, default: () => [] },
  timelineEvents: { type: Array, default: () => [] },
  loggedEventCoordinates: { type: Array, default: () => [] },
  editorHeatmapPoints: { type: Array, default: () => [] },
  myGoalsForMatch: { type: Number, default: 0 },
  shotsOnTarget: { type: Number, default: 0 },
  shotsOffTarget: { type: Number, default: 0 },
  showTrajectory: { type: Boolean, default: false },
  shotTrajectory: { type: Object, default: () => ({ x1: 0, y1: 0, x2: 0, y2: 0 }) },
  // Functions injected from the shell (composables)
  getMatchResult: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  getStatColorClass: { type: Function, required: true },
  calculateMatchRating: { type: Function, required: true },
  getShotMarkerStyle: { type: Function, required: true },
  selectEventForViz: { type: Function, required: true },
  removeEventGroup: { type: Function, required: true },
  incrementStat: { type: Function, required: true },
  incrementGkStat: { type: Function, required: true },
  logEvent: { type: Function, required: true },
  handleMyGoal: { type: Function, required: true },
  handleShot: { type: Function, required: true },
  onMapLogEvent: { type: Function, required: true },
  deleteLoggedEvent: { type: Function, required: true },
  onTimelineDelete: { type: Function, required: true },
  onQuickIncrement: { type: Function, required: true },
  onQuickIncrementGk: { type: Function, required: true },
})

defineEmits([
  'back',
  'update-position',
  'update:isGoalkeeperMode',
  'update:loggerView',
  'update:vizView',
  'open-share',
  'edit-match',
  'delete-match',
])
</script>

<style scoped>
/* --- Stat Color Classes (goals, assists) --- */
.stat-excellent { color: var(--color-accent) !important; }
.stat-good { color: #81c784 !important; }
.stat-mid { color: #ffb74d !important; }
.stat-bad { color: #e57373 !important; }
.stat-horrible { color: #ef5350 !important; }

/* --- Rating Color Classes (from rating.js getRatingColor) --- */
.rating-elite     { color: #00e5a0 !important; }
.rating-excellent { color: var(--color-accent) !important; }
.rating-good      { color: #81c784 !important; }
.rating-average   { color: #ffb74d !important; }
.rating-poor      { color: #e57373 !important; }
.rating-bad       { color: #ef5350 !important; }

/* World Class — solid blue, no glow */
.rating-world-class {
  color: #4fc3f7 !important;
}

/* Error Led to Goal row — same neutral row as other stats, just label tinted */
.error-stat { }

/* Logger view toggle (Counters / Map) */
.logger-view-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.logger-view-row__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.logger-view-toggle {
  display: flex;
  flex: 1;
  gap: 4px;
  padding: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.logger-view-toggle__btn {
  flex: 1;
  min-height: 40px;
  padding: 8px 20px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #b3ccbf;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.logger-view-toggle__btn.active {
  background: var(--color-brand);
  color: var(--color-brand-fg);
}
@media (max-width: 480px) {
  .logger-view-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .logger-view-row__label {
    text-align: center;
  }
}

/* Map-first logging layout */
.map-logger-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

/* Combined Performance + Events panel layout */
.perf-and-events {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.event-log-sub { flex: 1; }
.event-log-title {
  font-size: 0.72rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding-bottom: 6px;
  margin-bottom: 8px;
}

/* --- Live Match View --- */
.live-match-view {
  background: rgba(15, 18, 20, 0.9);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.match-header-redesign {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #89938d;
  cursor: pointer;
  font-size: 0.9rem;
  width: fit-content;
  transition: color 0.2s;
}

.back-button:hover {
  color: #fff;
}

/* ── Compact match card header (~40% shorter than before) ──── */
.match-card {
  position: relative;
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 14px 20px;
  overflow: hidden;
}

/* Result-colored accent stripe (mirrors the list cards) */
.match-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-neutral);
}
.match-card--win::before  { background: var(--color-success); }
.match-card--loss::before { background: var(--color-danger); }
.match-card--draw::before { background: var(--color-neutral); }

.match-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.opponent-name {
  font-size: 1.15rem;
  margin: 0;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-date {
  color: #89938d;
  font-size: 0.78rem;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.score-container {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.score-number { color: #fff; }

.score-divider {
  color: rgba(255, 255, 255, 0.25);
  font-weight: 400;
}

.result-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.win { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.loss { color: #ef5350; background: rgba(239, 83, 80, 0.1); }
.draw { color: #bdbdbd; background: rgba(189, 189, 189, 0.1); }

@media (max-width: 600px) {
  .match-card { padding: 12px 16px; }
  .match-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .score-display { align-self: stretch; justify-content: space-between; }
  .opponent-name { font-size: 1.05rem; }
  .score-container { font-size: 1.4rem; }
}

.match-view-controls {
  margin-bottom: 24px;
  background: rgba(0,0,0,0.2);
  padding: 16px;
  border-radius: 12px;
}

.position-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}

.position-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 200px;
  min-width: 0;
}

.position-display__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.position-select-wrap {
  position: relative;
  width: 100%;
}

.position-select-wrap::after {
  content: '';
  position: absolute;
  right: 14px;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-60%) rotate(45deg);
  border-right: 2px solid var(--color-brand-fg);
  border-bottom: 2px solid var(--color-brand-fg);
  pointer-events: none;
}

.position-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 100%;
  min-height: 44px;
  padding: 10px 38px 10px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.position-select:hover {
  border-color: color-mix(in srgb, var(--color-brand-fg) 40%, transparent);
}

.position-select:focus {
  outline: none;
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.09);
}

.position-display__label,
.goalkeeper-toggle__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.goalkeeper-toggle {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .position-controls {
    align-items: stretch;
  }
  .goalkeeper-toggle {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255,255,255,0.1);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-accent);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Live Stats Grid */
.live-view-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.live-stats-panel, .shot-log-panel, .live-controls-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  min-height: unset;
}

.live-view-content.single-column {
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .live-view-content.single-column {
    grid-template-columns: 280px 1fr;
  }
}

h4 {
  margin: 0 0 12px 0;
  font-size: 0.78rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
  gap: 2px;
}

.rating-display span {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.rating-display label {
  font-size: 0.72rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
}

.rating-tier-label {
  font-size: 0.82rem;
  font-weight: 700;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
}

/* Always-visible match rating bar — shows in both Map and Counters logging modes. */
.live-rating-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
  padding: 12px 18px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.live-rating-bar__value {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.live-rating-bar__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.live-rating-bar__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-muted);
}

.live-rating-bar__tier {
  font-size: 0.95rem;
  font-weight: 700;
}

.live-rating-bar__xg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin-left: 6px;
  padding-left: 14px;
  border-left: 1px solid var(--color-border-subtle);
}

.live-rating-bar__xg-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.live-rating-bar__xg-label {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-muted);
}

.timeline-wrap {
  margin-top: 24px;
}

/* Controls — responsive auto-fill grid on desktop, single column on mobile */
.live-match-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stat-control-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.stat-control-group:hover {
  border-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
  background: rgba(255,255,255,0.04);
}

.button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  padding: 12px 24px; /* Increased padding for bigger buttons */
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.2rem; /* Increased font size */
  transition: all 0.2s;
  min-width: 48px; /* Ensure minimum width */
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-primary { background: var(--color-accent); color: var(--color-on-accent); }
.btn-primary:hover { background: var(--color-accent-strong); }

.btn-danger { background: rgba(239, 83, 80, 0.2); color: #ef5350; }
.btn-danger:hover { background: rgba(239, 83, 80, 0.4); }

.btn-success { background: color-mix(in srgb, var(--color-accent) 20%, transparent); color: var(--color-accent); }
.btn-success:hover { background: color-mix(in srgb, var(--color-accent) 40%, transparent); }

.stat-value-display {
  font-weight: 700;
  width: 24px;
  text-align: center;
}

/* Event Log */
.event-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.event-item:hover {
  background: rgba(255,255,255,0.1);
}

.event-icon {
  font-size: 1.2rem;
}

.event-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-type {
  font-size: 0.9rem;
  font-weight: 600;
}

.event-subtype {
  font-size: 0.75rem;
  color: #89938d;
}

.event-count {
  font-size: 0.8rem;
  color: var(--color-accent);
  margin-left: 4px;
}

.remove-event-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
}

.remove-event-btn:hover { color: #ef5350; }

/* Viz Grid */
.shot-visualization {
  margin-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 16px;
}

.viz-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.viz-toggle-btn {
  background: transparent;
  border: none;
  color: #89938d;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.viz-toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.viz-toggle-btn:hover:not(.active) {
  color: #ccc;
}

.viz-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.viz-placeholder {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  color: #89938d;
  font-size: 0.9rem;
}

.viz-placeholder-text {
  text-align: center;
  margin-top: 8px;
  color: #89938d;
  font-size: 0.85rem;
}

.viz-grid .goal-grid {
  width: 100%;
  height: 180px; /* Bigger visualization height */
  border-width: 2px;
}

.viz-grid .goal-quadrant {
  font-size: 1.2rem;
  font-weight: 700;
}

.viz-field {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #1a1d21;
  border: 1px solid rgba(255,255,255,0.1);
}

.shot-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3b82f6; /* Blue for on-target/goal */
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  transform: translate(-50%, -50%);
}

.shot-marker.off-target {
  background: #ef5350; /* Red for off-target */
  box-shadow: 0 0 5px rgba(239, 83, 80, 0.5);
}

.shot-marker.goal {
  background: var(--color-accent); /* Green for goals */
  box-shadow: 0 0 5px color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: rgba(255,255,255,0.1);
  border: 4px solid #fff;
  width: 120px;
  height: 80px;
  margin: 0 auto;
}

.goal-quadrant {
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.goal-quadrant:hover { background: rgba(255,255,255,0.1); }
.goal-quadrant.highlight { background: color-mix(in srgb, var(--color-accent) 50%, transparent); }

/* Actions */
.heatmap-view {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.heatmap-view__title {
  margin: 0 0 16px;
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.match-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.action-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}

.delete-btn:hover {
  border-color: #ef5350;
  color: #ef5350;
}

.field-grid-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #1a1d21; /* Dark gray background */
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.4);
  cursor: crosshair;
}

.field-markings-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
  .match-card-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .score-display { align-items: center; }

  .live-view-content.single-column {
    grid-template-columns: 1fr;
  }
}

/* Share trigger button (live-view header). All other share styles live
   inside the dedicated <ShareMatchModal> component. */
.share-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
