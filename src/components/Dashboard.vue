<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ userEmail ? userEmail.split('@')[0] : 'player' }}!</p>
    </div>

    <div class="dashboard-container">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
        <button class="tab-btn" :class="{ active: activeTab === 'matches' }" @click="activeTab = 'matches'">Matches</button>
      </div>

      <DashboardOverview 
        v-if="activeTab === 'overview'"
        :matches="matches"
        :userEmail="userEmail"
        :allShotsData="allShotsData"
        :allGoalsData="allGoalsData"
      />

      <MatchManager 
        v-if="activeTab === 'matches'"
        :matches="matches"
        @match-updated="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import DashboardOverview from './DashboardOverview.vue'
import MatchManager from './MatchManager.vue'

const router = useRouter()
const matches = ref([])
const userEmail = ref('')
const activeTab = ref('overview')
const allShotsData = ref([])
const allGoalsData = ref([])

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    router.push('/login')
    return
  }
  
  userEmail.value = user.email
  await loadData()
})

watch(activeTab, async (newTab, oldTab) => {
  if (oldTab && newTab !== oldTab) {
    await loadData()
  }
})

const loadData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return
    }

    const matchIds = matchesData.map(m => m.id)
    if (matchIds.length === 0) {
      matches.value = []
      return
    }

    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('match_id, quadrant, field_position')
      .in('match_id', matchIds)

    if (goalsError) {
      console.error('Error fetching goals for matches:', goalsError)
    }

    const { data: shotsData, error: shotsError } = await supabase
      .from('shots')
      .select('match_id, on_target, quadrant, field_position')
      .in('match_id', matchIds)
    
    allShotsData.value = shotsData || []
    allGoalsData.value = goalsData || []

    if (shotsError) {
      console.error('Error fetching shots for matches:', shotsError)
      matches.value = matchesData
      return
    }

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
          acc[stats.match_id] = stats
          return acc
        }, {})
      }
    }

    const statsByMatch = shotsData.reduce((acc, shot) => {
      if (!acc[shot.match_id]) {
        acc[shot.match_id] = { shots_on_target: 0, shots_off_target: 0 }
      }
      if (shot.on_target) {
        acc[shot.match_id].shots_on_target++
      } else {
        acc[shot.match_id].shots_off_target++
      }
      return acc
    }, {})

    const goalsByMatch = (goalsData || []).reduce((acc, goal) => {
      acc[goal.match_id] = (acc[goal.match_id] || 0) + 1
      return acc
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
  background-color: #050608; /* Much darker background */
  color: #e1e2e6;
  padding: 20px;
  padding-top: 80px; /* Space for global nav if needed */
}

.dashboard-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* --- Header Styles --- */
.dashboard-header {
  max-width: 1100px;
  margin: 35px auto 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin: 0;
}

/* --- Tabs Styles --- */
.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
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
  background: #005233; /* Primary Container */
  color: #89f8c1; /* On Primary Container */
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
