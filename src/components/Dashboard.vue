<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ userName }}!</p>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-container-inner">
        <div class="tabs-row">
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
            <button class="tab-btn" :class="{ active: activeTab === 'matches' }" @click="activeTab = 'matches'">Matches</button>
            <button class="tab-btn" :class="{ active: activeTab === 'ai-coach' }" @click="activeTab = 'ai-coach'">AI Coach</button>
          </div>
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
        />

        <MatchManager
          v-if="activeTab === 'matches'"
          :matches="filteredMatches"
          :activeSeason="activeSeason"
          :seasons="seasons"
          @match-updated="loadData"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import DashboardOverview from './DashboardOverview.vue'
import MatchManager from './MatchManager.vue'
import DashboardAICoach from './DashboardAICoach.vue'
import SeasonSelector from './SeasonSelector.vue'

const router = useRouter()
const matches = ref([])
const allShotsData = ref([])
const allGoalsData = ref([])
const userName = ref('')
const userPosition = ref('')
const userPreferredFoot = ref('')
const userClubTeam = ref('')
const activeTab = ref('overview')
const seasons = ref([])
const activeSeason = ref(null)

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

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }
  await loadSeasons()
  await loadData()
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
  background-color: #050608;
  padding: 30px 40px;
  padding-top: 100px;
}

.dashboard-container-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  max-width: 1200px;
  margin: 3rem auto 24px;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.dashboard-header p {
  font-size: 1.1rem;
  color: #89938d;
  margin: 4px 0 0;
}

.tabs-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 12px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  width: fit-content;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #89938d;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #e1e2e6;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: #005233;
  color: #89f8c1;
  box-shadow: 0 2px 12px rgba(0, 82, 51, 0.3);
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
    padding-top: 60px;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .tabs {
    width: 100%;
    justify-content: space-between;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
