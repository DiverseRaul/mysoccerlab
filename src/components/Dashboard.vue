<template>
  <div class="dashboard-page">
    <div class="dashboard-hero-wrap">
      <PageHero
        title="Dashboard"
        :subtitle="userName ? `Welcome back, ${userName}` : 'Your season at a glance'"
        :chip="activeSeason ? activeSeason.name : 'All time'"
      />
    </div>

    <div class="dashboard-container">
      <div class="dashboard-container-inner">
        <div class="tabs-row">
          <ScrollableTabs
            :TabItems="DashboardTabItems"
            :ActiveKey="activeTab"
            @Select="activeTab = $event"
          />
          <SeasonSelector
            :seasons="seasons"
            :activeSeason="activeSeason"
            @update:activeSeason="setActiveSeason"
            @season-created="onSeasonCreated"
            @season-deleted="onSeasonDeleted"
            @season-updated="onSeasonUpdated"
          />
        </div>

        <DashboardOverview
          v-if="activeTab === 'overview'"
          :matches="filteredMatches"
          :userName="userName"
          :allShotsData="filteredShotsData"
          :allGoalsData="filteredGoalsData"
          :allHeatmapData="filteredHeatmapData"
        />

        <MatchManager
          v-if="activeTab === 'matches'"
          :matches="filteredMatches"
          :activeSeason="activeSeason"
          :seasons="seasons"
          @match-updated="loadData"
        />

        <PracticeTracker
          v-if="activeTab === 'practice'"
          :userName="userName"
        />

        <DashboardAICoach
          v-if="activeTab === 'ai-coach'"
          :matches="filteredMatches"
          :userName="userName"
          :userPosition="userPosition"
          :userPreferredFoot="userPreferredFoot"
          :userClubTeam="userClubTeam"
        />
      </div>
    </div>

    <button
      type="button"
      class="ai-fab"
      :class="{ 'is-active': activeTab === 'ai-coach' }"
      :aria-label="activeTab === 'ai-coach' ? 'Close AI Coach' : 'Open AI Coach'"
      data-testid="ai-fab"
      @click="ToggleAiCoach"
    >
      <svg v-if="activeTab !== 'ai-coach'" class="ai-fab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M18.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
      </svg>
      <svg v-else class="ai-fab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>

    <WelcomeIntro v-if="ShowIntro" @Done="DismissIntro" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { ResolveSession } from '../lib/authSession'
import WelcomeIntro from './onboarding/WelcomeIntro.vue'
import DashboardOverview from './DashboardOverview.vue'
import MatchManager from './MatchManager.vue'
import DashboardAICoach from './DashboardAICoach.vue'
import SeasonSelector from './SeasonSelector.vue'
import PracticeTracker from './dashboard/practice/PracticeTracker.vue'
import ScrollableTabs from './ui/ScrollableTabs.vue'
import PageHero from './ui/PageHero.vue'

const DashboardTabItems = [
  { Key: 'overview', Label: 'Overview' },
  { Key: 'matches', Label: 'Matches' },
  { Key: 'practice', Label: 'Practice' }
]

const router = useRouter()
const matches = ref([])
const allShotsData = ref([])
const allGoalsData = ref([])
const allHeatmapData = ref([])
const userName = ref('')
const userPosition = ref('')
const userPreferredFoot = ref('')
const userClubTeam = ref('')
const activeTab = ref('overview')
const PreviousTab = ref('overview')
const seasons = ref([])
const activeSeason = ref(null)

const ToggleAiCoach = () => {
  if (activeTab.value === 'ai-coach') {
    activeTab.value = PreviousTab.value || 'overview'
  } else {
    PreviousTab.value = activeTab.value
    activeTab.value = 'ai-coach'
  }
}

// --- Computed filtered data ---
const filteredMatches = computed(() => {
  if (!activeSeason.value) return matches.value
  return matches.value.filter(m => m.season_id === activeSeason.value.id)
})

const filteredGoalsData = computed(() => {
  if (!activeSeason.value) return allGoalsData.value
  const ids = new Set(filteredMatches.value.map(m => m.id))
  return allGoalsData.value.filter(g => ids.has(g.match_id))
})

const filteredShotsData = computed(() => {
  if (!activeSeason.value) return allShotsData.value
  const ids = new Set(filteredMatches.value.map(m => m.id))
  return allShotsData.value.filter(s => ids.has(s.match_id))
})

const filteredHeatmapData = computed(() => {
  if (!activeSeason.value) return allHeatmapData.value
  const ids = new Set(filteredMatches.value.map(m => m.id))
  return allHeatmapData.value.filter(h => ids.has(h.match_id))
})

// Intro shown to brand-new players (no matches yet, never dismissed).
const ShowIntro = ref(false)
const IntroStorageKey = ref('')

const MaybeShowIntro = (userId) => {
  IntroStorageKey.value = `msl-intro-seen:${userId}`
  try {
    if (localStorage.getItem(IntroStorageKey.value)) return
  } catch { /* storage unavailable — show nothing rather than nag forever */ return }
  if (matches.value.length === 0) ShowIntro.value = true
}

const DismissIntro = () => {
  ShowIntro.value = false
  try { localStorage.setItem(IntroStorageKey.value, '1') } catch { /* ignore */ }
}

onMounted(async () => {
  // ResolveSession waits out the Google OAuth redirect (tokens still in the
  // URL while this mounts) instead of bouncing fresh sign-ins to /login.
  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  await loadSeasons()
  await loadData()
  MaybeShowIntro(session.user.id)
})

const loadSeasons = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  seasons.value = data || []
  // Auto-select the most recently created season if any
  if (seasons.value.length > 0 && !activeSeason.value) {
    activeSeason.value = seasons.value[0]
  }
}

const setActiveSeason = (season) => {
  activeSeason.value = season
}

const onSeasonCreated = (season) => {
  seasons.value.unshift(season)
  activeSeason.value = season
}

const onSeasonDeleted = (seasonId) => {
  seasons.value = seasons.value.filter(s => s.id !== seasonId)
  if (activeSeason.value?.id === seasonId) {
    activeSeason.value = seasons.value[0] || null
  }
}

const onSeasonUpdated = (updated) => {
  if (!updated) return
  const idx = seasons.value.findIndex(s => s.id === updated.id)
  if (idx !== -1) seasons.value.splice(idx, 1, updated)
  if (activeSeason.value?.id === updated.id) {
    activeSeason.value = updated
  }
}

const loadData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('player_name, position, preferred_foot, club_team')
      .eq('user_id', user.id)
      .single()

    if (profileData) {
      userName.value = profileData.player_name || user.email.split('@')[0]
      userPosition.value = profileData.position || ''
      userPreferredFoot.value = profileData.preferred_foot || ''
      userClubTeam.value = profileData.club_team || ''
    } else {
      userName.value = user.email.split('@')[0]
    }

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (matchesError) { console.error('Error fetching matches:', matchesError); return }

    const matchIds = matchesData.map(m => m.id)
    if (matchIds.length === 0) { matches.value = []; return }

    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('match_id, quadrant, field_position')
      .in('match_id', matchIds)

    if (goalsError) console.error('Error fetching goals:', goalsError)

    const { data: shotsData, error: shotsError } = await supabase
      .from('shots')
      .select('match_id, on_target, quadrant, field_position')
      .in('match_id', matchIds)

    allShotsData.value = shotsData || []
    allGoalsData.value = goalsData || []

    // Season heatmap + pass-direction data (own-user RLS covers this). Retry
    // without x2_pct/y2_pct if the DB is behind on migration 0016.
    let heatmapRes = await supabase
      .from('match_heatmap_points')
      .select('match_id, x_pct, y_pct, event_type, x2_pct, y2_pct')
      .in('match_id', matchIds)
    if (heatmapRes.error) {
      heatmapRes = await supabase
        .from('match_heatmap_points')
        .select('match_id, x_pct, y_pct, event_type')
        .in('match_id', matchIds)
    }
    allHeatmapData.value = heatmapRes.data || []

    if (shotsError) { console.error('Error fetching shots:', shotsError); matches.value = matchesData; return }

    const goalkeeperMatchIds = matchesData
      .filter(m => m.position_played && m.position_played.toLowerCase().includes('goalkeeper'))
      .map(m => m.id)

    let goalkeeperStatsByMatch = {}
    if (goalkeeperMatchIds.length > 0) {
      const { data: goalkeeperData, error: goalkeeperError } = await supabase
        .from('goalkeeper_match_stats')
        .select('*')
        .in('match_id', goalkeeperMatchIds)
      if (!goalkeeperError && goalkeeperData) {
        goalkeeperStatsByMatch = goalkeeperData.reduce((acc, stats) => {
          acc[stats.match_id] = stats; return acc
        }, {})
      }
    }

    const statsByMatch = shotsData.reduce((acc, shot) => {
      if (!acc[shot.match_id]) acc[shot.match_id] = { shots_on_target: 0, shots_off_target: 0 }
      if (shot.on_target) acc[shot.match_id].shots_on_target++
      else acc[shot.match_id].shots_off_target++
      return acc
    }, {})

    const goalsByMatch = (goalsData || []).reduce((acc, goal) => {
      acc[goal.match_id] = (acc[goal.match_id] || 0) + 1; return acc
    }, {})

    matches.value = matchesData.map(match => ({
      ...match,
      my_goals: goalsByMatch[match.id] || 0,
      shots_on_target: statsByMatch[match.id]?.shots_on_target || 0,
      shots_off_target: statsByMatch[match.id]?.shots_off_target || 0,
      goalkeeper_stats: goalkeeperStatsByMatch[match.id] || null,
    }))
  } catch (error) {
    console.error('Error in loadData:', error)
  }
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--app-page-bg);
  padding: 30px 40px;
  padding-top: 100px;
}

.dashboard-container-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.dashboard-hero-wrap {
  max-width: 1280px;
  margin: 3rem auto 24px;
}

.tabs-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tabs-row > :first-child {
  flex: 0 1 auto;
  min-width: 0;
}

.ai-fab {
  position: fixed;
  right: 24px;
  bottom: 28px;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 1px solid rgba(137, 248, 193, 0.45);
  border-radius: 50%;
  background: radial-gradient(circle at 30% 25%, #5ee3ad 0%, var(--color-accent) 45%, var(--color-brand) 100%);
  color: #04130c;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(0, 82, 51, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.ai-fab:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 16px 40px rgba(0, 82, 51, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.ai-fab:active {
  transform: translateY(-1px) scale(0.98);
}

.ai-fab.is-active {
  background: var(--color-bg-surface);
  border-color: var(--color-border-soft);
  color: var(--color-text-primary);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.ai-fab__icon {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
    padding-top: 60px;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .tabs-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .ai-fab {
    right: 18px;
    bottom: 20px;
    width: 56px;
    height: 56px;
  }
}
</style>
