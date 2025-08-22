<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ userEmail ? userEmail.split('@')[0] : 'player' }}!</p>
    </div>

    <div class="dashboard-container">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">Dashboard</button>
        <button class="tab-btn" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">Profile</button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'dashboard'" class="dashboard-view">
          <div class="stats-grid">
            <div class="stat-card card-glass">
              <div class="stat-icon">⚽</div>
              <div class="stat-content">
                <h3>{{ matches.length }}</h3>
                <p>Matches Played</p>
              </div>
            </div>
            <div class="stat-card card-glass">
              <div class="stat-icon">🏆</div>
              <div class="stat-content">
                <h3>{{ wins }}</h3>
                <p>Wins</p>
              </div>
            </div>
            <div class="stat-card card-glass">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <h3>{{ winRate }}%</h3>
                <p>Win Rate</p>
              </div>
            </div>
          </div>

          <!-- Add Match Modal -->
    <div v-if="showAddMatch" class="modal-overlay" @click="showAddMatch = false">
          <div class="modal card-glass" @click.stop>
            <h3>Add New Match</h3>
            <form @submit.prevent="addMatch">
              <div class="form-group">
                <label>Opponent</label>
                <input v-model="newMatch.opponent" type="text" required />
              </div>
              <div class="form-group">
                <label>Date</label>
                <input v-model="newMatch.date" type="date" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Our Score</label>
                  <input v-model.number="newMatch.score_for" type="number" min="0" required />
                </div>
                <div class="form-group">
                  <label>Their Score</label>
                  <input v-model.number="newMatch.score_against" type="number" min="0" required />
                </div>
              </div>
              <div class="modal-buttons">
                <button type="button" @click="showAddMatch = false" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Match</button>
              </div>
            </form>
          </div>
        </div>

        <div v-if="activeTab === 'profile'">
          <ProfileView />
        </div>

        </div> <!-- Closes dashboard-view -->
      </div> <!-- Closes tab-content -->
    </div> <!-- Closes dashboard-container -->
  </div> <!-- Closes dashboard-page -->
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import ProfileView from './Profile.vue'

export default {
  name: 'Dashboard',
  components: {
    ProfileView
  },
  setup() {
    const router = useRouter()
    const matches = ref([])
    const userEmail = ref('')
    const showAddMatch = ref(false)
    const activeTab = ref('dashboard')
    
        
    const newMatch = ref({
      opponent: '',
      date: '',
      score_for: 0,
      score_against: 0
    })

    const wins = computed(() => {
      return matches.value.filter(match => match.score_for > match.score_against).length
    })

    const winRate = computed(() => {
      if (matches.value.length === 0) return 0
      return Math.round((wins.value / matches.value.length) * 100)
    })

    onMounted(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      userEmail.value = user.email
      await loadData()
    })

    const loadData = async () => {
      try {
        // Load matches for the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (matchesError && matchesError.code !== 'PGRST116') {
          console.error('Error loading matches:', matchesError)
        } else if (matchesData) {
          matches.value = matchesData
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    
    const addMatch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const matchData = { ...newMatch.value, user_id: user.id }

        const { data, error } = await supabase
          .from('matches')
          .insert([matchData])
          .select()

        if (error) throw error

        matches.value.unshift(data[0])
        newMatch.value = { opponent: '', date: '', score_for: 0, score_against: 0 }
        showAddMatch.value = false
      } catch (error) {
        console.error('Error adding match:', error)
        alert('Error adding match. Make sure your Supabase tables are set up correctly.')
      }
    }

    
    const getMatchResult = (match) => {
      if (match.score_for > match.score_against) return 'win'
      if (match.score_for < match.score_against) return 'loss'
      return 'draw'
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      matches,
      userEmail,
      showAddMatch,
      newMatch,
      wins,
      winRate,
      addMatch,
      getMatchResult,
      formatDate,
      activeTab
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-top: 5rem;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #888;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #222;
}

.tab-btn {
  padding: 1rem 2rem;
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  color: #4CAF50;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4CAF50;
}

.card-glass {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #222;
  border-radius: 16px;
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  font-size: 2rem;
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 2rem;
  color: #f0f0f0;
  margin: 0;
}

.stat-content p {
  color: #888;
  margin: 0;
  font-size: 0.9rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #222;
}

.card-header h2 {
  color: #f0f0f0;
  margin: 0;
}

.player-item, .match-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #1a1a1a;
  transition: background 0.3s ease;
}

.player-item:hover, .match-item:hover {
  background: #222;
}

.player-info h4, .match-info h4 {
  margin: 0 0 0.25rem 0;
  color: #f0f0f0;
}

.player-info p, .match-info p {
  margin: 0;
  color: #888;
  font-size: 0.9rem;
}

.match-result {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.match-result.win { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
.match-result.loss { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.match-result.draw { background: rgba(255, 165, 0, 0.2); color: #ffa500; }

.delete-btn {
  background: none; border: none; cursor: pointer; color: #888; transition: color 0.3s ease;
}
.delete-btn:hover { color: #ff4757; }

.empty-state { text-align: center; color: #888; padding: 2rem; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}

.modal {
  width: 90%; max-width: 400px; max-height: 90vh; overflow-y: auto; padding: 2rem;
}

.modal h3 { margin-top: 0; color: #f0f0f0; }

.form-row { display: flex; gap: 1rem; }
.form-row .form-group { flex: 1; }

.form-group label { color: #aaa; }
.form-group input, .form-group select { background: #1a1a1a; border: 1px solid #333; color: #f0f0f0; }
.form-group input:focus, .form-group select:focus { border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2); }

.modal-buttons { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }

.btn-primary { background: #4CAF50; color: white; border: none; }
.btn-primary:hover { background: #45a049; }
.btn-secondary { background: #333; color: #ccc; border: 1px solid #444; }
.btn-secondary:hover { background: #444; }

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
