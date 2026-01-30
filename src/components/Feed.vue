<template>
  <div class="feed-page">
    <div class="feed-container">
      <div class="feed-header">
        <div class="header-left">
          <h1>Activity Feed</h1>
          <p>See how the community is performing</p>
        </div>
        <div class="header-actions">
          <button class="btn-icon" @click="showFindPlayers = true" title="Search Players">
            🔍
          </button>
        </div>
      </div>

      <!-- Feed Tabs -->
      <div class="feed-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'following' }" 
          @click="switchTab('following')"
        >
          Following
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'explore' }" 
          @click="switchTab('explore')"
        >
          Explore
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading updates...</p>
      </div>

      <div v-else-if="matches.length === 0" class="empty-state">
        <div class="empty-icon">{{ activeTab === 'following' ? '👥' : '🌍' }}</div>
        <h3>{{ activeTab === 'following' ? 'No updates yet' : 'No public matches found' }}</h3>
        <p v-if="activeTab === 'following'">Follow other players to see their match stats here.</p>
        <p v-else>Check back later for community updates.</p>
        <button v-if="activeTab === 'following'" class="btn-secondary" @click="showFindPlayers = true">Discover Players</button>
      </div>

      <div v-else class="feed-list">
        <div v-for="match in matches" :key="match.id" class="feed-card">
          <div class="card-header">
            <div class="user-info">
              <div class="avatar-circle">
                {{ getInitials(match.profile?.player_name || match.profile?.email) }}
              </div>
              <div class="user-details">
                <span class="player-name">{{ match.profile?.player_name || formatEmail(match.profile?.email) }}</span>
                <span class="match-meta">{{ match.profile?.position || 'Player' }} • {{ formatDate(match.match_date) }}</span>
              </div>
            </div>
            <div class="match-result-badge" :class="getMatchResultClass(match)">
              {{ getMatchResult(match) }}
            </div>
          </div>

          <div class="card-content">
            <div class="score-row">
              <div class="score-block">
                <span class="score-val">{{ match.score_for }}</span>
                <span class="score-lbl">US</span>
              </div>
              <div class="vs-divider">
                <span>VS</span>
              </div>
              <div class="score-block">
                <span class="score-val">{{ match.score_against }}</span>
                <span class="score-lbl">{{ match.opponent.substring(0, 3).toUpperCase() }}</span>
              </div>
            </div>
            
            <div class="stats-mini-grid">
              <div class="mini-stat">
                <span class="ms-val">{{ match.my_goals || 0 }}</span>
                <span class="ms-lbl">Gols</span>
              </div>
              <div class="mini-stat">
                <span class="ms-val">{{ match.assists || 0 }}</span>
                <span class="ms-lbl">Ast</span>
              </div>
              <div class="mini-stat rating-stat">
                <span class="ms-val">{{ calculateMatchRating(match) }}</span>
                <span class="ms-lbl">Rat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Find Players Modal -->
    <div v-if="showFindPlayers" class="modal-overlay" @click.self="showFindPlayers = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Find Players</h2>
          <button class="close-btn" @click="showFindPlayers = false">&times;</button>
        </div>
        
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by name..."
            @input="searchUsers"
            autofocus
          >
        </div>

        <div class="users-list">
          <div v-if="searching" class="mini-spinner"></div>
          <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="no-results">
            No players found.
          </div>
          <div v-for="user in searchResults" :key="user.id" class="user-row">
            <div class="user-info-mini">
              <img 
                v-if="user.avatar_url" 
                :src="user.avatar_url" 
                class="avatar-mini-img" 
                alt="Avatar"
              />
              <div v-else class="avatar-mini">
                {{ getInitials(user.player_name || user.email) }}
              </div>
              <div class="user-details-mini">
                <span class="name">{{ user.player_name || formatEmail(user.email) }}</span>
                <span class="position" v-if="user.position">{{ user.position }}</span>
              </div>
            </div>
            <button 
              class="btn-follow" 
              :class="{ 'following': user.isFollowing }"
              @click="toggleFollow(user)"
              :disabled="user.loading"
            >
              {{ user.isFollowing ? 'Unfollow' : 'Follow' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const matches = ref([])
const showFindPlayers = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const currentUser = ref(null)
const followingIds = ref(new Set())
const activeTab = ref('following')

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }
  currentUser.value = user
  await loadFollowing()
  await loadFeed()
})

const switchTab = (tab) => {
  activeTab.value = tab
  loadFeed()
}

const loadFollowing = async () => {
  const { data, error } = await supabase
    .from('user_relationships')
    .select('following_id')
    .eq('follower_id', currentUser.value.id)

  if (data) {
    followingIds.value = new Set(data.map(r => r.following_id))
  }
}

const loadFeed = async () => {
  try {
    loading.value = true
    matches.value = [] // Clear current matches
    
    let query = supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (activeTab.value === 'following') {
      const followedIds = Array.from(followingIds.value)
      if (followedIds.length === 0) {
        matches.value = []
        loading.value = false
        return
      }
      query = query.in('user_id', followedIds)
    } else {
      // Explore mode: fetch matches from public profiles (excluding own)
      // This requires a join or subquery logic which implies we rely on the RLS policy "Users can view matches of public profiles"
      // However, we still need to filter by user_id != current_user
      query = query.neq('user_id', currentUser.value.id)
    }

    const { data: matchesData, error: matchesError } = await query

    if (matchesError) throw matchesError

    if (!matchesData || matchesData.length === 0) {
      matches.value = []
      return
    }

    // Fetch profiles for these users
    const userIds = [...new Set(matchesData.map(m => m.user_id))]
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, player_name, position, is_public')
      .in('user_id', userIds)

    const profileMap = {}
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.user_id] = p
      })
    }

    // Filter out matches where we don't have profile access or strictly rely on what returned
    // Since RLS handles visibility, matchesData should only contain allowed matches.
    // But we might want to filter 'explore' tab to ONLY show public profiles if RLS is broader?
    // The RLS policy I wrote allows viewing matches if profile is public. So we are good.

    matches.value = matchesData.map(match => ({
      ...match,
      profile: profileMap[match.user_id] || { player_name: 'Unknown Player' }
    }))

  } catch (error) {
    console.error('Error loading feed:', error)
  } finally {
    loading.value = false
  }
}

const searchUsers = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  try {
    // Search in user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, player_name, position, avatar_url')
      .ilike('player_name', `%${searchQuery.value}%`)
      .limit(20)

    if (error) throw error
    
    // Filter out current user
    const filtered = data.filter(u => u.user_id !== currentUser.value.id)
    
    // Add isFollowing status
    searchResults.value = filtered.map(u => ({
      ...u,
      id: u.user_id, // Normalize ID
      isFollowing: followingIds.value.has(u.user_id),
      loading: false
    }))
    
  } catch (e) {
    console.error('Search error:', e)
  } finally {
    searching.value = false
  }
}

const toggleFollow = async (userToToggle) => {
  if (userToToggle.loading) return
  userToToggle.loading = true
  
  try {
    if (userToToggle.isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('follower_id', currentUser.value.id)
        .eq('following_id', userToToggle.id)
        
      if (!error) {
        userToToggle.isFollowing = false
        followingIds.value.delete(userToToggle.id)
        if (activeTab.value === 'following') await loadFeed() // Refresh feed
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: currentUser.value.id,
          following_id: userToToggle.id
        })
        
      if (!error) {
        userToToggle.isFollowing = true
        followingIds.value.add(userToToggle.id)
        if (activeTab.value === 'following') await loadFeed() // Refresh feed
      }
    }
  } catch (e) {
    console.error('Toggle follow error:', e)
  } finally {
    userToToggle.loading = false
  }
}

// Helpers
const getInitials = (name) => {
  if (!name) return '?'
  return name.substring(0, 2).toUpperCase()
}

const formatEmail = (email) => {
  if (!email) return 'Player'
  return email.split('@')[0]
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
  
  if (diffDays <= 1) return 'Today'
  if (diffDays <= 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric'
  })
}

const getMatchResult = (match) => {
  if (match.score_for > match.score_against) return 'W'
  if (match.score_for < match.score_against) return 'L'
  return 'D'
}

const getMatchResultClass = (match) => {
  const result = getMatchResult(match)
  if (result === 'W') return 'badge-win'
  if (result === 'L') return 'badge-loss'
  return 'badge-draw'
}

const calculateMatchRating = (match) => {
  let rating = 6.0
  rating += (match.my_goals || 0) * 1.7
  rating += (match.assists || 0) * 1.0
  rating += (match.shots_on_target || 0) * 0.2
  rating += (match.tackles || 0) * 0.1
  rating += (match.interceptions || 0) * 0.2
  rating += (match.successful_passes || 0) * 0.05
  return Math.min(10, Math.max(0, rating)).toFixed(1)
}
</script>

<style scoped>
.feed-page {
  min-height: 100vh;
  background-color: #050608;
  color: #e1e2e6;
  padding: 80px 20px 20px;
}

.feed-container {
  max-width: 500px;
  margin: 0 auto;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 5rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-left p {
  margin: 4px 0 0;
  color: #89938d;
  font-size: 0.9rem;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Tabs */
.feed-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  color: #888;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #1a1a1a;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-card {
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  transition: transform 0.2s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.85rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
}

.match-meta {
  font-size: 0.75rem;
  color: #666;
}

.match-result-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge-win { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
.badge-loss { background: rgba(244, 67, 54, 0.2); color: #f44336; }
.badge-draw { background: rgba(255, 193, 7, 0.2); color: #FFC107; }

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 12px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-val {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.score-lbl {
  font-size: 0.65rem;
  color: #666;
  margin-top: 2px;
  text-transform: uppercase;
}

.vs-divider {
  font-size: 0.7rem;
  font-weight: 700;
  color: #444;
}

.stats-mini-grid {
  display: flex;
  gap: 16px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ms-val {
  font-weight: 700;
  color: #ccc;
  font-size: 1rem;
}

.ms-lbl {
  font-size: 0.65rem;
  color: #666;
}

.rating-stat .ms-val {
  color: #4cda9c;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #888;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #4CAF50;
  color: #4CAF50;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 20px;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  padding-top: 100px;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 { margin: 0; font-size: 1.2rem; }

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.search-box {
  padding: 20px;
}

.search-box input {
  width: 100%;
  background: #000;
  border: 1px solid #333;
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.users-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.no-results {
  text-align: center;
  color: #666;
  padding: 20px 0;
  font-size: 0.9rem;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-mini {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
  color: #ccc;
}

.avatar-mini-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #333;
}

.user-details-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-details-mini .name { font-weight: 500; font-size: 1rem; color: #eee; }
.user-details-mini .position { font-size: 0.8rem; color: #888; margin-left: 2px; }

.btn-follow {
  padding: 4px 12px;
  border-radius: 14px;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: #fff;
  color: #000;
  transition: all 0.2s;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #666;
}

.spinner, .mini-spinner {
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner { width: 24px; height: 24px; margin-bottom: 10px; }
.mini-spinner { width: 16px; height: 16px; margin: 0 auto; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
