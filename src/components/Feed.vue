<template>
  <div class="feed-page">
    <div class="feed-container">
      <div class="feed-hero">
        <PageHero title="The Pitch" subtitle="Live from players around you">
          <template #action>
            <button class="btn-icon" @click="showFindPlayers = true" title="Search Players" aria-label="Find players">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </template>
        </PageHero>
      </div>

      <div class="feed-tabs">
        <ScrollableTabs
          :TabItems="FeedTabItems"
          :ActiveKey="activeTab"
          @Select="switchTab"
        />
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
        <FeedCard
          v-for="(match, index) in matches"
          :key="match.id"
          :Match="match"
          :Index="index"
          :ShotData="shotDataByMatch[match.id] ?? null"
          @load-shotmap="loadShotData"
          @view-profile="openProfile"
        />
      </div>
    </div>

    <UserProfileModal
      v-if="profileModal.userId"
      :userId="profileModal.userId"
      :seedName="profileModal.name"
      :seedPosition="profileModal.position"
      :isFollowing="followingIds.has(profileModal.userId)"
      @close="profileModal.userId = null"
      @toggle-follow="toggleFollowById"
    />

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
import { ref, reactive, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import ScrollableTabs from './ui/ScrollableTabs.vue'
import FeedCard from './ui/FeedCard.vue'
import UserProfileModal from './ui/UserProfileModal.vue'
import PageHero from './ui/PageHero.vue'

const FeedTabItems = [
  { Key: 'following', Label: 'Following' },
  { Key: 'explore', Label: 'Explore' }
]

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
// Per-match spatial shot data, fetched lazily when a card's shot map is opened.
const shotDataByMatch = reactive({})
// Profile popup state (opened from a feed card's author).
const profileModal = reactive({ userId: null, name: '', position: '' })

const openProfile = (userId) => {
  if (!userId) return
  const Match = matches.value.find((m) => m.user_id === userId)
  profileModal.name = Match?.profile?.player_name || ''
  profileModal.position = Match?.profile?.position || ''
  profileModal.userId = userId
}

// Follow/unfollow by id (used by the profile popup); keeps followingIds in sync.
const toggleFollowById = async (userId) => {
  const isFollowing = followingIds.value.has(userId)
  try {
    if (isFollowing) {
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('follower_id', currentUser.value.id)
        .eq('following_id', userId)
      if (!error) {
        followingIds.value.delete(userId)
        if (activeTab.value === 'following') await loadFeed()
      }
    } else {
      const { error } = await supabase
        .from('user_relationships')
        .insert({ follower_id: currentUser.value.id, following_id: userId })
      if (!error) followingIds.value.add(userId)
    }
  } catch (e) {
    console.error('Toggle follow error:', e)
  }
}

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

    // Eagerly batch-load every card's spatial data (3 queries total) so each
    // card shows its shot map + heatmap immediately, like the home demo.
    await loadAllShotData(matchesData.map(m => m.id))

  } catch (error) {
    console.error('Error loading feed:', error)
  } finally {
    loading.value = false
  }
}

// Batch-fetch goals, shots, and heatmap points for every loaded match in one
// round-trip each, then group by match_id. RLS gates cross-user reads; denied
// rows just come back empty.
const loadAllShotData = async (matchIds) => {
  if (!matchIds || matchIds.length === 0) return
  try {
    const [goalsRes, shotsRes, heatmapRes] = await Promise.all([
      supabase.from('goals').select('match_id, quadrant, field_position').in('match_id', matchIds),
      supabase.from('shots').select('match_id, on_target, quadrant, field_position').in('match_id', matchIds),
      supabase.from('match_heatmap_points').select('match_id, x_pct, y_pct, event_type').in('match_id', matchIds)
    ])
    const groupByMatch = (rows) => {
      const map = {}
      for (const row of rows || []) {
        if (!map[row.match_id]) map[row.match_id] = []
        map[row.match_id].push(row)
      }
      return map
    }
    const goalsByMatch = groupByMatch(goalsRes.data)
    const shotsByMatch = groupByMatch(shotsRes.data)
    const heatmapByMatch = groupByMatch(heatmapRes.data)
    for (const id of matchIds) {
      shotDataByMatch[id] = {
        goals: goalsByMatch[id] || [],
        shots: shotsByMatch[id] || [],
        heatmap: heatmapByMatch[id] || []
      }
    }
  } catch (error) {
    console.error('Error batch-loading feed shot data:', error)
  }
}

// Lazily fetch a single match's goals + shots when its shot map is first opened.
// RLS (migration 0013) gates cross-user reads; denied rows return [] silently.
const loadShotData = async (matchId) => {
  if (matchId == null || shotDataByMatch[matchId]) return
  try {
    const [goalsRes, shotsRes, heatmapRes] = await Promise.all([
      supabase.from('goals').select('match_id, quadrant, field_position').eq('match_id', matchId),
      supabase.from('shots').select('match_id, on_target, quadrant, field_position').eq('match_id', matchId),
      supabase.from('match_heatmap_points').select('x_pct, y_pct, event_type').eq('match_id', matchId)
    ])
    shotDataByMatch[matchId] = {
      goals: goalsRes.data || [],
      shots: shotsRes.data || [],
      heatmap: heatmapRes.data || []
    }
  } catch (error) {
    console.error('Error loading shot map data:', error)
    shotDataByMatch[matchId] = { goals: [], shots: [], heatmap: [] }
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

</script>

<style scoped>
.feed-page {
  position: relative;
  min-height: 100vh;
  background: var(--app-page-bg);
  color: var(--color-text-secondary);
  padding: 128px 20px 64px;
  overflow-x: clip;
}

/* Faint pitch-stripe texture for depth (stadium-at-night feel). */
.feed-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.014) 0px,
    rgba(255, 255, 255, 0.014) 2px,
    transparent 2px,
    transparent 64px
  );
  mask-image: linear-gradient(180deg, #000 0%, transparent 60%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 60%);
}

.feed-container {
  position: relative;
  max-width: 520px;
  margin: 0 auto;
}

.feed-hero {
  margin-bottom: var(--space-5);
}

.btn-icon {
  background: var(--color-bg-surface-2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-subtle);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex: 0 0 auto;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
}

.btn-icon:hover {
  background: var(--color-bg-surface-3);
  border-color: var(--color-accent-border);
}

.btn-icon:hover svg {
  color: var(--color-accent);
}

.feed-tabs {
  margin-bottom: var(--space-6);
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.empty-state {
  text-align: center;
  padding: 72px 24px;
  color: var(--color-text-muted);
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.empty-state h3 {
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.btn-secondary {
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  padding: 12px 22px;
  min-height: 44px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  margin-top: 24px;
  font-size: var(--font-size-sm);
  transition: background 0.2s ease;
}

.btn-secondary:hover {
  background: var(--color-accent-border);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  padding-top: 100px;
}

.modal-content {
  background: var(--color-bg-surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 { margin: 0; font-size: var(--font-size-md); }

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.search-box {
  padding: 20px 24px;
}

.search-box input {
  width: 100%;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.users-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.no-results {
  text-align: center;
  color: var(--color-text-faint);
  padding: 24px 0;
  font-size: var(--font-size-sm);
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
}

.avatar-mini {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-brand));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: #ffffff;
  flex: 0 0 auto;
}

.avatar-mini-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-bg-surface-3);
  flex: 0 0 auto;
}

.user-details-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-details-mini .name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.user-details-mini .position {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.btn-follow {
  padding: 10px 18px;
  min-height: 40px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  background: var(--color-accent);
  color: #04130c;
  flex: 0 0 auto;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-follow.following {
  background: transparent;
  border-color: var(--color-border-soft);
  color: var(--color-text-secondary);
}

.btn-follow:disabled {
  opacity: 0.6;
  cursor: default;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  color: var(--color-text-muted);
}

.spinner, .mini-spinner {
  border: 2px solid var(--color-border-soft);
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner { width: 28px; height: 28px; margin-bottom: 12px; }
.mini-spinner { width: 18px; height: 18px; margin: 0 auto; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .feed-page {
    padding: 108px 16px 40px;
  }
}
</style>
