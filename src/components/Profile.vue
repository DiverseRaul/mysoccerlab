<template>
  <div class="profile-page">
    <div class="profile-hero-wrap">
      <PageHero
        title="Profile"
        subtitle="Manage your account, profile, and achievements."
        :chip="editableProfile.position || 'Player'"
      />
    </div>

    <div class="profile-container">
      <!-- Profile Information -->
      <div class="profile-section card-glass">
        <div class="section-header section-header--row">
          <h3>Player Details</h3>
          <span class="save-status" :class="`save-status--${saveStatus}`">
            <span class="save-status__dot"></span>
            <template v-if="saveStatus === 'saving'">Saving…</template>
            <template v-else-if="saveStatus === 'saved'">Saved</template>
            <template v-else-if="saveStatus === 'error'">Couldn’t save</template>
            <template v-else>Auto-saves as you type</template>
          </span>
        </div>
        <div v-if="user" class="profile-content">
          <!-- Profile Picture Section -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <img 
                v-if="editableProfile.avatarUrl" 
                :src="editableProfile.avatarUrl" 
                alt="Profile Avatar" 
                class="profile-avatar"
              />
              <div v-else class="profile-avatar placeholder">
                {{ editableProfile.playerName ? editableProfile.playerName.substring(0, 2).toUpperCase() : '??' }}
              </div>
              
              <div class="avatar-upload-overlay">
                <label for="avatar-upload" class="upload-btn">
                  <span>📷</span>
                  <span v-if="uploadingAvatar">Uploading...</span>
                  <span v-else>Change</span>
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  @change="uploadAvatar" 
                  :disabled="uploadingAvatar"
                  style="display: none;"
                />
              </div>
            </div>
          </div>

          <div class="field-grid">
            <!-- Player Name -->
            <div class="info-item">
              <span class="info-label">Player Name</span>
              <div class="info-input-container">
                <input v-model="editableProfile.playerName" class="info-input" type="text" placeholder="Enter your player name" />
              </div>
            </div>

            <!-- Email -->
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value readonly">{{ user.email }}</span>
            </div>

            <!-- Profile Visibility -->
            <div class="info-item">
              <span class="info-label">Profile Visibility</span>
              <div class="info-input-container toggle-container">
                <label class="switch">
                  <input
                    type="checkbox"
                    v-model="editableProfile.isPublic"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ editableProfile.isPublic ? 'Public' : 'Private' }}</span>
              </div>
            </div>

            <!-- Heatmap Tracking -->
            <div class="info-item">
              <span class="info-label">Heatmap Tracking</span>
              <div class="info-input-container toggle-container">
                <label class="switch">
                  <input
                    type="checkbox"
                    v-model="editableProfile.enableHeatmapTracking"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ editableProfile.enableHeatmapTracking ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>

            <!-- Default Match Logger View -->
            <div class="info-item">
              <span class="info-label">Default Match Logger</span>
              <div class="info-input-container">
                <select
                  class="info-input"
                  v-model="editableProfile.defaultMatchLoggerView"
                >
                  <option value="map">Map (tap the pitch)</option>
                  <option value="counters">Counters (+/- cards)</option>
                </select>
              </div>
            </div>

            <!-- Birthday -->
            <div class="info-item">
              <span class="info-label">Birthday</span>
              <div class="info-input-container">
                <input v-model="editableProfile.dateOfBirth" class="info-input" type="date" />
              </div>
            </div>

            <!-- Member Since -->
            <div class="info-item">
              <span class="info-label">Member Since</span>
              <span class="info-value readonly">{{ formatDate(user.created_at) }}</span>
            </div>

            <!-- Position -->
            <div class="info-item full-width-item">
              <span class="info-label">Position</span>
              <div class="info-input-container">
                <div class="field-selector">
                  <div class="field-graphic">
                    <!-- Field Lines -->
                    <div class="field-line penalty-area-top"></div>
                    <div class="field-line center-circle"></div>
                    <div class="field-line penalty-area-bottom"></div>
                    <div class="field-line center-line"></div>
                    
                    <!-- Positions -->
                    <div 
                      v-for="pos in availablePositions" 
                      :key="pos.value"
                      class="position-dot"
                      :class="{ active: editableProfile.position === pos.value }"
                      :style="{ top: pos.top + '%', left: pos.left + '%' }"
                      @click="editableProfile.position = pos.value"
                      :title="pos.label"
                    >
                      <span class="pos-abbr">{{ pos.abbr }}</span>
                    </div>
                  </div>
                  <div class="selected-position-label">
                    Selected: <strong>{{ editableProfile.position || 'None' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preferred Foot -->
            <div class="info-item">
              <span class="info-label">Preferred Foot</span>
              <div class="info-input-container">
                <select v-model="editableProfile.preferredFoot" class="info-select">
                  <option value="">Select Foot</option>
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>

            <!-- Jersey Number -->
            <div class="info-item">
              <span class="info-label">Jersey Number</span>
              <div class="info-input-container">
                <input v-model.number="editableProfile.jerseyNumber" class="info-input" type="number" min="1" max="99" placeholder="1-99" />
              </div>
            </div>

            <!-- Club Team -->
            <div class="info-item">
              <span class="info-label">Club Team</span>
              <div class="info-input-container">
                <input v-model="editableProfile.clubTeam" class="info-input" type="text" placeholder="Enter your club team" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="profile-actions">
          <button @click="signOut" class="btn btn-ghost">Sign Out</button>
          <button @click="confirmDeleteAccount" class="btn btn-danger">Delete Account</button>
        </div>
      </div>

      <!-- Achievements -->
      <div class="profile-section card-glass">
        <div class="section-header">
          <h3>🏆 Achievements</h3>
        </div>
        <div class="achievements-grid">
          <div class="achievement" :class="{ unlocked: true }">
            <div class="achievement-icon">🎯</div>
            <div class="achievement-info"><h4>Welcome</h4><p>Joined the community</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: editableProfile.playerName }">
            <div class="achievement-icon">📝</div>
            <div class="achievement-info"><h4>Identity</h4><p>Set your player name</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: editableProfile.position }">
            <div class="achievement-icon">⚽</div>
            <div class="achievement-info"><h4>Specialist</h4><p>Chose your position</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: editableProfile.jerseyNumber }">
            <div class="achievement-icon">👕</div>
            <div class="achievement-info"><h4>Numbered</h4><p>Picked a jersey number</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: editableProfile.preferredFoot }">
            <div class="achievement-icon">🦶</div>
            <div class="achievement-info"><h4>Footed</h4><p>Set your preferred foot</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: editableProfile.clubTeam }">
            <div class="achievement-icon">🏟️</div>
            <div class="achievement-info"><h4>Team Player</h4><p>Added your club team</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: isProfileComplete }">
            <div class="achievement-icon">👑</div>
            <div class="achievement-info"><h4>All-Star</h4><p>Completed your profile</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: profileEditCount >= 5 }">
            <div class="achievement-icon">✏️</div>
            <div class="achievement-info"><h4>Perfectionist</h4><p>Edited profile 5+ times</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: profileAge >= 7 }">
            <div class="achievement-icon">🗓️</div>
            <div class="achievement-info"><h4>Regular</h4><p>Active for 7+ days</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: profileAge >= 30 }">
            <div class="achievement-icon">💎</div>
            <div class="achievement-info"><h4>Veteran</h4><p>Active for 30+ days</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: profileAge >= 90 }">
            <div class="achievement-icon">🏆</div>
            <div class="achievement-info"><h4>Legend</h4><p>Active for 90+ days</p></div>
          </div>
          <div class="achievement" :class="{ unlocked: profileAge >= 365 }">
            <div class="achievement-icon">🌟</div>
            <div class="achievement-info"><h4>Champion</h4><p>Active for 1+ year</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import PageHero from './ui/PageHero.vue'

export default {
  name: 'ProfileView',
  components: { PageHero },
  setup() {
    const user = ref(null)
    const router = useRouter()
    // 'idle' | 'saving' | 'saved' | 'error' — drives the inline auto-save chip.
    const saveStatus = ref('idle')
    const editableProfile = ref({
      playerName: '',
      position: '',
      preferredFoot: '',
      jerseyNumber: null,
      clubTeam: '',
      dateOfBirth: '',
      isPublic: false,
      enableHeatmapTracking: true,
      defaultMatchLoggerView: 'map',
      avatarUrl: null
    })
    const profileEditCount = ref(0)
    const uploadingAvatar = ref(false)

    // Auto-save plumbing: a deep watcher on editableProfile debounces a save.
    // `ready` gates out the initial load assignment so we don't save on mount.
    let ready = false
    let saveTimer = null
    let statusTimer = null

    const availablePositions = [
      { value: 'Striker', label: 'Striker', abbr: 'ST', top: 15, left: 50 },
      { value: 'Winger', label: 'Left Winger', abbr: 'LW', top: 20, left: 15 },
      { value: 'Winger', label: 'Right Winger', abbr: 'RW', top: 20, left: 85 },
      { value: 'Attacking Midfielder', label: 'Attacking Midfielder', abbr: 'CAM', top: 35, left: 50 },
      { value: 'Central Midfielder', label: 'Central Midfielder', abbr: 'CM', top: 50, left: 50 },
      { value: 'Defensive Midfielder', label: 'Defensive Midfielder', abbr: 'CDM', top: 60, left: 50 },
      { value: 'Wing-Back', label: 'Left Wing Back', abbr: 'LWB', top: 55, left: 10 },
      { value: 'Wing-Back', label: 'Right Wing Back', abbr: 'RWB', top: 55, left: 90 },
      { value: 'Full-Back', label: 'Left Back', abbr: 'LB', top: 75, left: 15 },
      { value: 'Full-Back', label: 'Right Back', abbr: 'RB', top: 75, left: 85 },
      { value: 'Center-Back', label: 'Center Back', abbr: 'CB', top: 75, left: 50 },
      { value: 'Goalkeeper', label: 'Goalkeeper', abbr: 'GK', top: 90, left: 50 },
    ]

    const isProfileComplete = computed(() => {
      return editableProfile.value.playerName && 
             editableProfile.value.position && 
             editableProfile.value.preferredFoot &&
             editableProfile.value.jerseyNumber &&
             editableProfile.value.clubTeam
    })

    const profileAge = computed(() => {
      if (!user.value?.created_at) return 0
      const createdAt = new Date(user.value.created_at)
      const now = new Date()
      const diffTime = Math.abs(now - createdAt)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    })

    const scheduleSave = () => {
      if (!ready) return
      saveStatus.value = 'saving'
      if (statusTimer) { clearTimeout(statusTimer); statusTimer = null }
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(saveProfile, 700)
    }

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
        await loadProfile()
        // Let the load assignment settle before arming the auto-save watcher.
        await nextTick()
        ready = true
        watch(editableProfile, scheduleSave, { deep: true })
      } else {
        router.push('/login')
      }
    })

    onBeforeUnmount(() => {
      if (saveTimer) clearTimeout(saveTimer)
      if (statusTimer) clearTimeout(statusTimer)
    })

    const loadProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error)
          return
        }

        const profile = {
          playerName: profileData?.player_name || '',
          position: profileData?.position || '',
          preferredFoot: profileData?.preferred_foot || '',
          jerseyNumber: profileData?.jersey_number || null,
          clubTeam: profileData?.club_team || '',
          dateOfBirth: profileData?.date_of_birth || '',
          isPublic: profileData?.is_public || false,
          enableHeatmapTracking: profileData?.enable_heatmap_tracking ?? true,
          defaultMatchLoggerView: profileData?.default_match_logger_view === 'counters' ? 'counters' : 'map',
          avatarUrl: profileData?.avatar_url || null
        }
        profileEditCount.value = profileData?.edit_count || 0

        editableProfile.value = { ...profile }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    const uploadAvatar = async (event) => {
      try {
        uploadingAvatar.value = true
        if (!event.target.files || event.target.files.length === 0) {
          throw new Error('You must select an image to upload.')
        }

        const file = event.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.value.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        editableProfile.value.avatarUrl = publicUrl
      } catch (error) {
        console.error('Error uploading avatar:', error)
        alert('Error uploading avatar!')
      } finally {
        uploadingAvatar.value = false
      }
    }

    async function saveProfile() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .single()

        // The DB CHECK constraints reject '' for position/preferred_foot (only
        // the enumerated values or NULL are allowed), and jersey_number must be
        // 1–99. Coerce empties to null so an unset field doesn't blow up the save.
        const jersey = parseInt(editableProfile.value.jerseyNumber, 10)
        const profileData = {
          user_id: currentUser.id,
          player_name: editableProfile.value.playerName,
          position: editableProfile.value.position || null,
          preferred_foot: editableProfile.value.preferredFoot || null,
          jersey_number: Number.isInteger(jersey) ? jersey : null,
          club_team: editableProfile.value.clubTeam,
          date_of_birth: editableProfile.value.dateOfBirth || null,
          is_public: editableProfile.value.isPublic,
          enable_heatmap_tracking: editableProfile.value.enableHeatmapTracking,
          default_match_logger_view: editableProfile.value.defaultMatchLoggerView,
          avatar_url: editableProfile.value.avatarUrl,
          edit_count: profileEditCount.value + 1
        }

        const writeProfile = async (payload) => {
          if (existingProfile) {
            return supabase.from('user_profiles').update(payload).eq('user_id', currentUser.id)
          }
          return supabase.from('user_profiles').insert([payload])
        }

        let { error } = await writeProfile(profileData)

        // Resilience: if the DB schema is behind on a migration (PGRST204 =
        // "could not find the 'X' column"), drop the newer optional columns and
        // retry so the rest of the profile still saves. The dropped preference
        // persists once the matching migration (0011/0012) is applied.
        if (error && error.code === 'PGRST204') {
          const OptionalColumns = ['default_match_logger_view', 'enable_heatmap_tracking']
          const fallback = { ...profileData }
          OptionalColumns.forEach((Col) => delete fallback[Col])
          const retry = await writeProfile(fallback)
          error = retry.error
          if (!error) {
            console.warn('[profile] Saved without newer columns — apply migrations 0011/0012 in Supabase to persist logger view & heatmap preferences.')
          }
        }

        if (error) {
          console.error('Error saving profile:', error)
          saveStatus.value = 'error'
          return
        }

        profileEditCount.value += 1
        saveStatus.value = 'saved'
        // Fade the "Saved" chip back to the idle hint after a moment.
        if (statusTimer) clearTimeout(statusTimer)
        statusTimer = setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 2200)
      } catch (error) {
        console.error('Error saving profile:', error)
        saveStatus.value = 'error'
      }
    }

    const confirmDeleteAccount = () => {
      if (confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
        deleteAccount()
      }
    }

    const deleteAccount = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        // This would ideally be a single RPC call in Supabase for atomicity
        await supabase.from('user_profiles').delete().eq('user_id', currentUser.id)
        await supabase.from('user_achievements').delete().eq('user_id', currentUser.id)
        await supabase.from('matches').delete().eq('user_id', currentUser.id)
        await supabase.from('goals').delete().eq('user_id', currentUser.id)

        const { error } = await supabase.auth.admin.deleteUser(currentUser.id)
        if (error) throw error

        alert('Account deleted successfully.')
        router.push('/')
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('Error deleting account. Please contact support.')
      }
    }

    const signOut = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const formatBirthday = (dateString) => {
      if (!dateString) return null
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return {
      user,
      saveStatus,
      editableProfile,
      isProfileComplete,
      profileAge,
      profileEditCount,
      uploadingAvatar,
      uploadAvatar,
      confirmDeleteAccount,
      signOut,
      formatDate,
      formatBirthday,
      availablePositions
    }
  }
}
</script>

<style scoped>
/* --- Shared Design Tokens --- */
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
}

.profile-page {
  padding: 100px 40px 40px;
  min-height: 100vh;
  color: #fff;
  background: var(--app-page-bg);
}

.profile-page > * {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}

.profile-hero-wrap {
  margin: 3rem auto 24px;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

/* --- Avatar Section --- */
.avatar-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #4cda9c;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 0 20px rgba(76, 218, 156, 0.2);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: #888;
  background: #222;
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-upload-overlay {
  opacity: 1;
}

.upload-btn {
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  cursor: pointer;
}

/* --- Cards --- */
.profile-section {
  background: rgba(15, 18, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4);
}

.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header h3 {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

/* Inline auto-save indicator */
.save-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #89938d;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.save-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
}

.save-status--saving {
  color: #ffb74d;
  border-color: rgba(255, 183, 77, 0.3);
  background: rgba(255, 183, 77, 0.08);
}

.save-status--saving .save-status__dot {
  animation: save-pulse 0.9s ease-in-out infinite;
}

.save-status--saved {
  color: #4cda9c;
  border-color: rgba(76, 218, 156, 0.3);
  background: rgba(76, 218, 156, 0.1);
}

.save-status--error {
  color: #ef5350;
  border-color: rgba(239, 83, 80, 0.4);
  background: rgba(239, 83, 80, 0.1);
}

@keyframes save-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .save-status--saving .save-status__dot { animation: none; }
}

.field-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width-item {
  grid-column: 1 / -1;
}

.info-label {
  color: #89938d;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: #fff;
  font-weight: 500;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 48px;
  display: flex;
  align-items: center;
  font-size: 1rem;
}

.info-value.readonly {
  background: transparent;
  border-color: transparent;
  padding-left: 0;
  color: #ccc;
}

.info-input, .info-select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-size: 1rem;
  width: 100%;
  transition: all 0.3s ease;
  min-height: 48px;
  font-family: inherit;
}

.info-input:focus, .info-select:focus {
  outline: none;
  border-color: #4cda9c;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 2px rgba(76, 218, 156, 0.2);
}

.info-select option {
  background: #1a1d21;
  color: #fff;
}

/* Field Selector Styles */
.field-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.field-graphic {
  width: 300px;
  height: 400px;
  background-color: #1e3a29;
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.field-line {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.center-line {
  top: 50%;
  left: 0;
  width: 100%;
  height: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.center-circle {
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.penalty-area-top {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 15%;
  border-top: none;
}

.penalty-area-bottom {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 15%;
  border-bottom: none;
}

.position-dot {
  position: absolute;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.position-dot:hover {
  background: rgba(76, 218, 156, 0.6);
  border-color: #fff;
  transform: translate(-50%, -50%) scale(1.1);
}

.position-dot.active {
  background: #4cda9c;
  border-color: #fff;
  box-shadow: 0 0 10px #4cda9c;
  z-index: 3;
}

.pos-abbr {
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
}

.position-dot.active .pos-abbr {
  color: #003822;
}

.selected-position-label {
  color: #4cda9c;
  font-size: 1rem;
}

/* Toggle Switch Styles */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
}

.toggle-label {
  font-weight: 500;
  color: #fff;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #333;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #4cda9c;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4cda9c;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Actions --- */
.profile-actions {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 22px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.btn-ghost {
  background: transparent;
  color: #e1e2e6;
  border-color: rgba(255, 255, 255, 0.14);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.btn-danger {
  background: rgba(239, 83, 80, 0.14);
  color: #ef5350;
  border-color: rgba(239, 83, 80, 0.4);
}
.btn-danger:hover {
  background: rgba(239, 83, 80, 0.24);
  transform: translateY(-1px);
}

/* --- Achievements --- */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  opacity: 0.5;
  transition: all 0.3s ease;
}

.achievement.unlocked {
  opacity: 1;
  background: rgba(76, 218, 156, 0.1);
  border-color: rgba(76, 218, 156, 0.3);
}

.achievement-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.achievement.unlocked .achievement-icon {
  background: rgba(76, 218, 156, 0.2);
}

.achievement-info h4 {
  color: #fff;
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 700;
}

.achievement-info p {
  color: #89938d;
  margin: 0;
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  /* Match the Dashboard's mobile rhythm exactly (60px top, 16px sides). */
  .profile-page {
    padding: 60px 16px 40px;
  }

  .profile-content {
    flex-direction: column;
    align-items: center;
  }

  .avatar-section {
    margin-bottom: 2rem;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }
  .profile-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .btn {
    justify-content: center;
  }
}
</style>