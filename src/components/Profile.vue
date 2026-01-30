<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>Player Profile</h1>
      <p>Manage your account, profile, and achievements.</p>
    </div>

    <div class="profile-container">
      <!-- Profile Information -->
      <div class="profile-section card-glass">
        <div class="section-header">
          <h3>👤 Player Details</h3>
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
              
              <div v-if="isEditing" class="avatar-upload-overlay">
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
                <input v-if="isEditing" v-model="editableProfile.playerName" class="info-input" type="text" placeholder="Enter your player name" />
                <span v-else class="info-value">{{ editableProfile.playerName || 'Not set' }}</span>
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
                    :disabled="!isEditing" 
                    v-model="editableProfile.isPublic"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label">{{ editableProfile.isPublic ? 'Public' : 'Private' }}</span>
              </div>
            </div>

            <!-- Email -->
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value readonly">{{ user.email }}</span>
            </div>

            <!-- Birthday -->
            <div class="info-item">
              <span class="info-label">Birthday</span>
              <div class="info-input-container">
                <input v-if="isEditing" v-model="editableProfile.dateOfBirth" class="info-input" type="date" />
                <span v-else class="info-value">{{ formatBirthday(editableProfile.dateOfBirth) || 'Not set' }}</span>
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
                <div v-if="isEditing" class="field-selector">
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
                <span v-else class="info-value">{{ editableProfile.position || 'Not set' }}</span>
              </div>
            </div>

            <!-- Preferred Foot -->
            <div class="info-item">
              <span class="info-label">Preferred Foot</span>
              <div class="info-input-container">
                <select v-if="isEditing" v-model="editableProfile.preferredFoot" class="info-select">
                  <option value="">Select Foot</option>
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Both">Both</option>
                </select>
                <span v-else class="info-value">{{ editableProfile.preferredFoot || 'Not set' }}</span>
              </div>
            </div>

            <!-- Jersey Number -->
            <div class="info-item">
              <span class="info-label">Jersey Number</span>
              <div class="info-input-container">
                <input v-if="isEditing" v-model.number="editableProfile.jerseyNumber" class="info-input" type="number" min="1" max="99" placeholder="1-99" />
                <span v-else class="info-value">{{ editableProfile.jerseyNumber || 'Not set' }}</span>
              </div>
            </div>

            <!-- Club Team -->
            <div class="info-item">
              <span class="info-label">Club Team</span>
              <div class="info-input-container">
                <input v-if="isEditing" v-model="editableProfile.clubTeam" class="info-input" type="text" placeholder="Enter your club team" />
                <span v-else class="info-value">{{ editableProfile.clubTeam || 'Not set' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="profile-actions">
          <div class="edit-actions">
            <button v-if="!isEditing" @click="startEditing" class="btn btn-primary">
              <span>✏️</span> Edit Profile
            </button>
            <template v-else>
              <button @click="saveProfile" class="btn btn-success">
                <span>💾</span> Save Changes
              </button>
              <button @click="cancelEditing" class="btn btn-secondary">
                <span>❌</span> Cancel
              </button>
            </template>
          </div>
          <div class="account-actions">
            <button @click="signOut" class="btn btn-danger-outline">
              <span>🚪</span> Sign Out
            </button>
            <button @click="confirmDeleteAccount" class="btn btn-danger">
              <span>🗑️</span> Delete Account
            </button>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

export default {
  name: 'ProfileView',
  setup() {
    const user = ref(null)
    const router = useRouter()
    const isEditing = ref(false)
    const editableProfile = ref({
      playerName: '',
      position: '',
      preferredFoot: '',
      jerseyNumber: null,
      clubTeam: '',
      dateOfBirth: '',
      isPublic: false,
      avatarUrl: null
    })
    const originalProfile = ref({})
    const profileEditCount = ref(0)
    const uploadingAvatar = ref(false)

    const availablePositions = [
      { value: 'Striker', label: 'Striker', abbr: 'ST', top: 10, left: 50 },
      { value: 'Center-Forward', label: 'Center Forward', abbr: 'CF', top: 20, left: 50 },
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

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
        await loadProfile()
      } else {
        router.push('/login')
      }
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
          avatarUrl: profileData?.avatar_url || null
        }
        profileEditCount.value = profileData?.edit_count || 0

        editableProfile.value = { ...profile }
        originalProfile.value = { ...profile }
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

    const startEditing = () => {
      isEditing.value = true
      originalProfile.value = { ...editableProfile.value }
    }

    const cancelEditing = () => {
      isEditing.value = false
      editableProfile.value = { ...originalProfile.value }
    }

    const saveProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .single()

        const profileData = {
          user_id: currentUser.id,
          player_name: editableProfile.value.playerName,
          position: editableProfile.value.position,
          preferred_foot: editableProfile.value.preferredFoot,
          jersey_number: editableProfile.value.jerseyNumber,
          club_team: editableProfile.value.clubTeam,
          date_of_birth: editableProfile.value.dateOfBirth || null,
          is_public: editableProfile.value.isPublic,
          avatar_url: editableProfile.value.avatarUrl,
          edit_count: profileEditCount.value + 1
        }

        let error
        if (existingProfile) {
          const result = await supabase.from('user_profiles').update(profileData).eq('user_id', currentUser.id)
          error = result.error
        } else {
          const result = await supabase.from('user_profiles').insert([profileData])
          error = result.error
        }

        if (error) {
          console.error('Error saving profile:', error)
          alert('Error saving profile. Please try again.')
          return
        }

        isEditing.value = false
        originalProfile.value = { ...editableProfile.value }
        profileEditCount.value += 1
        alert('Profile updated successfully!')
      } catch (error) {
        console.error('Error saving profile:', error)
        alert('Error saving profile. Please try again.')
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
      isEditing,
      editableProfile,
      isProfileComplete,
      profileAge,
      profileEditCount,
      uploadingAvatar,
      uploadAvatar,
      startEditing,
      cancelEditing,
      saveProfile,
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
  padding-bottom: 40px;
}

.page-header {
  text-align: center;
  margin-top: 5rem;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #89938d;
  font-size: 1.1rem;
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

.section-header h3 {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
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
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.edit-actions, .account-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #4cda9c;
  color: #003822;
}
.btn-primary:hover {
  background: #3cb885;
  transform: translateY(-2px);
}

.btn-success {
  background: #4cda9c;
  color: #003822;
}
.btn-success:hover {
  background: #3cb885;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-danger {
  background: rgba(239, 83, 80, 0.2);
  color: #ef5350;
}
.btn-danger:hover {
  background: rgba(239, 83, 80, 0.3);
  transform: translateY(-2px);
}

.btn-danger-outline {
  background: transparent;
  color: #ef5350;
  border: 1px solid rgba(239, 83, 80, 0.5);
}
.btn-danger-outline:hover {
  background: rgba(239, 83, 80, 0.1);
  transform: translateY(-2px);
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
  .edit-actions, .account-actions {
    flex-direction: column;
  }
  .btn {
    justify-content: center;
  }
  .page-header h1 {
    font-size: 2.2rem;
  }
}
</style>