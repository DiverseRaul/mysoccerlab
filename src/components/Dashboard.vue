<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ userEmail }}! 🎉</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ players.length }}</h3>
          <p>Total Players</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚽</div>
        <div class="stat-content">
          <h3>{{ matches.length }}</h3>
          <p>Matches Played</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <h3>{{ wins }}</h3>
          <p>Wins</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>{{ winRate }}%</h3>
          <p>Win Rate</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Players Section -->
      <div class="card">
        <div class="card-header">
          <h2>Players</h2>
          <button class="btn" @click="showAddPlayer = true">Add Player</button>
        </div>
        <div class="players-list" v-if="players.length > 0">
          <div v-for="player in players" :key="player.id" class="player-item">
            <div class="player-info">
              <h4>{{ player.name }}</h4>
              <p>Position: {{ player.position }} | Goals: {{ player.goals }}</p>
            </div>
            <button @click="deletePlayer(player.id)" class="delete-btn">❌</button>
          </div>
        </div>
        <p v-else class="empty-state">No players added yet. Add your first player!</p>
      </div>

      <!-- Recent Matches -->
      <div class="card">
        <div class="card-header">
          <h2>Recent Matches</h2>
          <button class="btn" @click="showAddMatch = true">Add Match</button>
        </div>
        <div class="matches-list" v-if="matches.length > 0">
          <div v-for="match in matches.slice(0, 5)" :key="match.id" class="match-item">
            <div class="match-info">
              <h4>{{ match.opponent }}</h4>
              <p>{{ match.score_for }} - {{ match.score_against }} | {{ formatDate(match.date) }}</p>
              <span class="match-result" :class="getMatchResult(match)">
                {{ getMatchResult(match).toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="empty-state">No matches recorded yet. Add your first match!</p>
      </div>
    </div>

    <!-- Add Player Modal -->
    <div v-if="showAddPlayer" class="modal-overlay" @click="showAddPlayer = false">
      <div class="modal" @click.stop>
        <h3>Add New Player</h3>
        <form @submit.prevent="addPlayer">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newPlayer.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Position</label>
            <select v-model="newPlayer.position" required>
              <option value="">Select Position</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>
          </div>
          <div class="form-group">
            <label>Goals</label>
            <input v-model.number="newPlayer.goals" type="number" min="0" />
          </div>
          <div class="modal-buttons">
            <button type="button" @click="showAddPlayer = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn">Add Player</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Match Modal -->
    <div v-if="showAddMatch" class="modal-overlay" @click="showAddMatch = false">
      <div class="modal" @click.stop>
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
            <button type="submit" class="btn">Add Match</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const players = ref([])
    const matches = ref([])
    const userEmail = ref('')
    const showAddPlayer = ref(false)
    const showAddMatch = ref(false)
    
    const newPlayer = ref({
      name: '',
      position: '',
      goals: 0
    })
    
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
        // Load players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: false })

        if (playersError && playersError.code !== 'PGRST116') {
          console.error('Error loading players:', playersError)
        } else if (playersData) {
          players.value = playersData
        }

        // Load matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
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

    const addPlayer = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .insert([newPlayer.value])
          .select()

        if (error) throw error

        players.value.unshift(data[0])
        newPlayer.value = { name: '', position: '', goals: 0 }
        showAddPlayer.value = false
      } catch (error) {
        console.error('Error adding player:', error)
        alert('Error adding player. Make sure your Supabase tables are set up correctly.')
      }
    }

    const addMatch = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .insert([newMatch.value])
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

    const deletePlayer = async (id) => {
      if (!confirm('Are you sure you want to delete this player?')) return
      
      try {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', id)

        if (error) throw error

        players.value = players.value.filter(player => player.id !== id)
      } catch (error) {
        console.error('Error deleting player:', error)
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
      players,
      matches,
      userEmail,
      showAddPlayer,
      showAddMatch,
      newPlayer,
      newMatch,
      wins,
      winRate,
      addPlayer,
      addMatch,
      deletePlayer,
      getMatchResult,
      formatDate
    }
  }
}
</script>

<style scoped>
.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  font-size: 2rem;
  color: #4CAF50;
  margin: 0;
}

.stat-content p {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  color: #2c3e50;
  margin: 0;
}

.player-item, .match-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.player-info h4, .match-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.player-info p, .match-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.match-result {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-top: 0.5rem;
  display: inline-block;
}

.match-result.win {
  background: #d4edda;
  color: #155724;
}

.match-result.loss {
  background: #f8d7da;
  color: #721c24;
}

.match-result.draw {
  background: #fff3cd;
  color: #856404;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #2c3e50;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}
</style>
