<template>
  <div class="matches-section">
    <MatchList
      v-if="!activeMatch"
      :matches="matches"
      :seasons="seasons"
      @select-match="selectMatch"
      @add-match="showAddMatch = true"
      @assign-season="onAssignSeason"
    />
    <MatchDetail
      v-else
      :active-match="activeMatch"
      :positions="positions"
      :is-goalkeeper-mode="isGoalkeeperMode"
      :goalkeeper-stats="goalkeeperStats"
      :logger-view="LoggerView"
      :viz-view="vizView"
      :selected-event="selectedEvent"
      :selected-event-placement-marker="selectedEventPlacementMarker"
      :enable-heatmap-tracking="EnableHeatmapTracking"
      :match-xg="matchXg"
      :match-goals="matchGoals"
      :match-shots="matchShots"
      :combined-events="combinedEvents"
      :timeline-events="timelineEvents"
      :logged-event-coordinates="LoggedEventCoordinates"
      :editor-heatmap-points="EditorHeatmapPoints"
      :my-goals-for-match="myGoalsForMatch"
      :shots-on-target="shotsOnTarget"
      :shots-off-target="shotsOffTarget"
      :show-trajectory="showTrajectory"
      :shot-trajectory="shotTrajectory"
      :get-match-result="getMatchResult"
      :format-date="formatDate"
      :get-stat-color-class="getStatColorClass"
      :calculate-match-rating="calculateMatchRating"
      :get-shot-marker-style="getShotMarkerStyle"
      :select-event-for-viz="selectEventForViz"
      :remove-event-group="removeEventGroup"
      :increment-stat="incrementStat"
      :increment-gk-stat="incrementGkStat"
      :log-event="LogEvent"
      :handle-my-goal="handleMyGoal"
      :handle-shot="handleShot"
      :on-map-log-event="OnMapLogEvent"
      :delete-logged-event="DeleteLoggedEvent"
      :on-timeline-delete="onTimelineDelete"
      :on-quick-increment="OnQuickIncrement"
      :on-quick-increment-gk="OnQuickIncrementGk"
      @back="handleBackToMatches"
      @update-position="updatePosition"
      @update:is-goalkeeper-mode="isGoalkeeperMode = $event"
      @update:logger-view="LoggerView = $event"
      @update:viz-view="vizView = $event"
      @open-share="openShareModal"
      @edit-match="showEditMatch = true"
      @delete-match="confirmDeleteMatch"
    />
  </div>

  <!-- Event Capture Flow (4-modal state machine) -->
  <EventCaptureFlow
    ref="eventCaptureFlow"
    @shot-captured="onShotCaptured"
    @goal-captured="onGoalCaptured"
    @event-captured="onEventCaptured"
  />

  <Teleport to="body">
    <transition name="msl-toast">
      <div v-if="Toast" class="msl-toast" :class="`msl-toast--${Toast.Tone}`" data-testid="match-toast">{{ Toast.Message }}</div>
    </transition>
  </Teleport>

  <AddMatchModal v-model="showAddMatch" :EnableHeatmapTracking="EnableHeatmapTracking" @submit="onAddMatch" />

  <!-- Edit Match Modal -->
  <div v-if="showEditMatch" class="modal-overlay" @click.self="showEditMatch = false">
    <div class="modal card-glass" @click.stop>
      <div class="modal-header">
        <h3>Edit Match</h3>
        <button @click="showEditMatch = false" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Opponent</label>
          <input v-model="activeMatch.opponent" type="text" required />
        </div>
        <div class="form-group">
          <label>Date</label>
          <input v-model="activeMatch.match_date" type="date" required />
        </div>
        <div class="modal-buttons">
          <button type="button" @click="showEditMatch = false" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="onUpdateMatch" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
    <div class="modal card-glass" @click.stop>
      <div class="modal-header">
        <h3>Delete Match</h3>
        <button @click="showDeleteConfirm = false" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this match against <strong>{{ activeMatch.opponent }}</strong>?</p>
        <p class="warning-text">This action cannot be undone and will delete all match data including goals, shots, and statistics.</p>
        <div class="modal-buttons">
          <button type="button" @click="showDeleteConfirm = false" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="onDeleteMatch" class="btn btn-danger">Delete Match</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Share Match Modal — delegated to the dedicated component
       (caption editor, layout variants, copy-as-text live there) -->
  <ShareMatchModal
    v-model="showShareModal"
    :match="activeMatch"
    :my-team-label="myTeamLabel"
    :my-goals="myGoalsForMatch"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import EventCaptureFlow from './dashboard/matches/EventCaptureFlow.vue'
import MatchList from './dashboard/matches/MatchList.vue'
import MatchDetail from './dashboard/matches/MatchDetail.vue'
import AddMatchModal from './dashboard/matches/AddMatchModal.vue'
import ShareMatchModal from './dashboard/matches/ShareMatchModal.vue'
import { BuildLoggedEventCoordinates } from '../lib/matchEvents'
import { toast } from '../lib/toast'
import { useMatchData } from '../composables/useMatchData'
import { useEventLogging } from '../composables/useEventLogging'
import { useMatchStats } from '../composables/useMatchStats'
import { useShotViz } from '../composables/useShotViz'

const props = defineProps({
  matches: { type: Array, required: true },
  activeSeason: { type: Object, default: null },
  seasons: { type: Array, default: () => [] },
  // When set (e.g. from an Overview chart), open this match on mount.
  openMatchId: { type: [Number, String], default: null }
})

const emit = defineEmits(['match-updated', 'match-opened'])

// --- Shell-local UI state ---
const showAddMatch = ref(false)
const showEditMatch = ref(false)
const showDeleteConfirm = ref(false)
const showShareModal = ref(false)
const eventCaptureFlow = ref(null)
const myClubTeamName = ref('You')
const myTeamLabel = computed(() => myClubTeamName.value || 'You')
const positions = ref([
  'Goalkeeper',
  'Center-Back',
  'Full-Back',
  'Wing-Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Winger',
  'Striker'
])
const isGoalkeeperMode = ref(false)
const EnableHeatmapTracking = ref(true)
const LoggerView = ref('map')

// Lightweight transient feedback (e.g. penalty conceded).
const Toast = ref(null)
let ToastTimer = null
const flashToast = (Message, Tone = 'info') => {
  Toast.value = { Message, Tone }
  clearTimeout(ToastTimer)
  ToastTimer = setTimeout(() => { Toast.value = null }, 2600)
}

// --- Composables ---
const {
  activeMatch,
  matchGoals,
  matchShots,
  goalkeeperStats,
  MatchHeatmapPoints,
  selectMatch,
  addMatch,
  loadGoalkeeperStats,
  updateMatch,
  updatePosition,
  deleteMatch,
} = useMatchData({ isGoalkeeperMode, activeSeason: () => props.activeSeason, emit })

const {
  vizView,
  selectedEvent,
  selectedEventPlacementMarker,
  EditorHeatmapPoints,
  matchXg,
  timelineEvents,
  combinedEvents,
  showTrajectory,
  shotTrajectory,
  selectEventForViz,
  getShotMarkerStyle,
} = useShotViz({ matchGoals, matchShots, MatchHeatmapPoints })

const {
  incrementStat,
  incrementGkStat,
  onShotCaptured,
  onGoalCaptured,
  removeEvent,
  removeEventGroup,
  handleMyGoal,
  handleShot,
  LogEvent,
  onEventCaptured,
  OnMapLogEvent,
  DeleteLoggedEvent,
  OnQuickIncrement,
  OnQuickIncrementGk,
} = useEventLogging({
  activeMatch,
  matchGoals,
  matchShots,
  goalkeeperStats,
  MatchHeatmapPoints,
  selectedEvent,
  eventCaptureFlow,
  EnableHeatmapTracking,
  loadGoalkeeperStats,
  flashToast,
})

const {
  calculateMatchRating,
  getStatColorClass,
  getMatchResult,
  formatDate,
} = useMatchStats({
  matches: () => props.matches,
  activeMatch,
  matchGoals,
  matchShots,
  goalkeeperStats,
})

// --- Shell-local derived state ---
const LoggedEventCoordinates = computed(() =>
  BuildLoggedEventCoordinates(matchGoals.value, matchShots.value, MatchHeatmapPoints.value)
)

const myGoalsForMatch = computed(() => {
  if (!activeMatch.value) return 0
  return matchGoals.value.length
})

const shotsOnTarget = computed(() => {
  if (!activeMatch.value) return 0
  return matchShots.value.filter(s => s.on_target).length
})

const shotsOffTarget = computed(() => {
  if (!activeMatch.value) return 0
  return matchShots.value.filter(s => !s.on_target).length
})

// Bridges timeline delete events to the right logging operation.
const onTimelineDelete = (event) => {
  if (event.kind === 'goal') return removeEvent({ type: 'Goal', id: event.id })
  if (event.kind === 'shot') return removeEvent({ type: 'Shot', id: event.id })
  return DeleteLoggedEvent({ Source: 'heatmap', Id: event.id, EventKey: event.eventType })
}

// --- Shell orchestration ---
const onAssignSeason = async ({ match, seasonId }) => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({ season_id: seasonId })
      .eq('id', match.id)
    if (error) throw error
    match.season_id = seasonId
  } catch (e) {
    console.error('Error assigning season:', e)
  }
}

const onAddMatch = async (formData) => {
  const { error } = await addMatch(formData, { onSuccess: () => { showAddMatch.value = false } })
  if (error) {
    // toast handled here to keep the data layer UI-agnostic
    toast.error('Error adding match. Make sure your Supabase tables are set up correctly.')
  }
}

const onUpdateMatch = () => updateMatch({ onSuccess: () => { showEditMatch.value = false } })

const handleBackToMatches = () => {
  activeMatch.value = null
  emit('match-updated')
}

const confirmDeleteMatch = () => {
  showDeleteConfirm.value = true
}

const onDeleteMatch = () => deleteMatch({ onSuccess: () => { showDeleteConfirm.value = false } })

const loadMyClubTeamName = async () => {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return

    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('club_team')
      .eq('user_id', user.id)
      .single()

    if (error) return
    if (profileData?.club_team) myClubTeamName.value = profileData.club_team
  } catch (e) {
    // ignore
  }
}

const openShareModal = async () => {
  await loadMyClubTeamName()
  showShareModal.value = true
}

const LoadHeatmapPreference = async () => {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('enable_heatmap_tracking, default_match_logger_view')
      .eq('user_id', user.id)
      .single()
    if (error) return
    EnableHeatmapTracking.value = profileData?.enable_heatmap_tracking ?? true
    LoggerView.value = profileData?.default_match_logger_view === 'counters' ? 'counters' : 'map'
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadMyClubTeamName()
  LoadHeatmapPreference()
  // Deep-open a match requested from elsewhere (e.g. the ratings chart).
  if (props.openMatchId != null) {
    const target = props.matches.find(m => m.id === props.openMatchId)
    if (target) selectMatch(target)
    emit('match-opened')
  }
})
</script>

<style scoped>
.matches-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
  padding-bottom: 40px;
}

/* Transient feedback toast (teleported to body) */
.msl-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 1300;
  max-width: 90vw;
  padding: 12px 20px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-bg-surface-3, rgba(30, 34, 38, 0.96));
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.msl-toast--danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}

.msl-toast--success {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-on-accent);
}

.msl-toast-enter-active,
.msl-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.msl-toast-enter-from,
.msl-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #1a1d21;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  border: 1px solid rgba(255,255,255,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 { margin: 0; }

.close-btn {
  background: transparent;
  border: none;
  color: #89938d;
  font-size: 1.5rem;
  cursor: pointer;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #89938d;
  font-size: 0.9rem;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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
</style>
