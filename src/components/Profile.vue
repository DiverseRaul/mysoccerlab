<template>
  <div class="profile-page">
    <div class="profile-hero-wrap">
      <PageHero
        title="Profile"
        subtitle="Manage your account, profile, and achievements."
      >
        <template #action>
          <div class="profile-hero-meta">
            <ProBadge v-if="isPro" />
            <span class="profile-hero-chip">{{ editableProfile.position || 'Player' }}</span>
          </div>
        </template>
      </PageHero>
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
        <!-- Skeleton while the session + profile resolve. -->
        <div v-if="loading" class="profile-skel" aria-hidden="true">
          <Skeleton width="100px" height="100px" radius="50%" />
          <div class="profile-skel__fields">
            <Skeleton v-for="n in 6" :key="'pf' + n" width="100%" height="48px" radius="12px" />
          </div>
        </div>

        <div v-else-if="user" class="profile-content">
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

      <!-- Coach / Scout share link (free) -->
      <div class="profile-section card-glass">
        <div class="section-header section-header--row">
          <h3>🔗 Share with your coach</h3>
          <label class="switch">
            <input type="checkbox" :checked="shareEnabled" @change="toggleShare" :disabled="shareBusy" />
            <span class="slider round"></span>
          </label>
        </div>
        <p class="pro-section-desc">Give a coach or scout a private, read-only link to your dashboard. No account needed — turn it off anytime to revoke access.</p>

        <div v-if="shareEnabled && shareLinkUrl" class="share-link">
          <div class="share-link__row">
            <input class="share-link__input" :value="shareLinkUrl" readonly @focus="(e) => e.target.select()" />
            <button type="button" class="btn btn-primary" @click="copyShareLink">{{ shareCopied ? 'Copied!' : 'Copy' }}</button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="shareBusy" @click="regenerateLink">Generate new link (revokes old)</button>
        </div>
        <p v-else class="share-link__off">Sharing is off. Flip the switch to create a link.</p>
      </div>

      <!-- Lab Pro — always visible so free users see what they'd unlock -->
      <div class="profile-section pro-section" :class="{ 'is-pro': showPro }">
        <div class="pro-hero">
          <div class="pro-hero__brand">
            <span class="pro-hero__spark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M18.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" /></svg>
            </span>
            <div>
              <h3 class="pro-hero__title">Lab Pro</h3>
              <p class="pro-hero__tag">{{ showPro ? 'Your premium toolkit is active' : 'Unlock your premium toolkit' }}</p>
            </div>
          </div>
          <span v-if="showPro" class="pro-status pro-status--active"><span class="pro-status__dot"></span>Active</span>
          <router-link v-else to="/premium" class="btn btn-primary pro-upgrade">Unlock Lab Pro</router-link>
        </div>

        <!-- Free: benefit checklist -->
        <ul v-if="!showPro" class="pro-perks">
          <li v-for="p in proPerks" :key="p"><span class="pro-perks__check">✓</span>{{ p }}</li>
        </ul>

        <!-- Pro analytics (each tile shows a teaser for free users) -->
        <div class="pro-tiles">
          <PeerPercentilesTile />
          <ProfileAnalyticsTile />
        </div>

        <!-- Accent colour -->
        <div class="pro-block">
          <div class="pro-block__head">
            <span class="info-label">Accent colour</span>
            <span v-if="!showPro" class="pro-tag">PRO</span>
          </div>
          <p class="pro-hint">Pick a theme colour to recolour the app’s highlights.</p>
          <div class="accent-row">
            <button
              v-for="c in accentPresets"
              :key="c"
              type="button"
              class="accent-swatch"
              :class="{ 'is-active': showPro && accent.toLowerCase() === c }"
              :style="{ background: c }"
              :title="c"
              @click="showPro ? selectAccent(c) : goPremium()"
            ></button>
            <button v-if="showPro && accent" type="button" class="accent-reset" @click="resetAccent">Reset</button>
          </div>
        </div>

        <!-- Early access -->
        <div class="pro-block pro-block--row">
          <div>
            <div class="pro-block__head">
              <span class="info-label">Early access</span>
              <span v-if="!showPro" class="pro-tag">PRO</span>
            </div>
            <p class="pro-hint">Try new beta features before everyone else.<span v-if="showPro && earlyAccessOn" class="ea-chip">Enrolled</span></p>
          </div>
          <label class="switch" :class="{ 'is-disabled': !showPro }">
            <input type="checkbox" v-model="earlyAccessOn" :disabled="!showPro" @change="toggleEarlyAccess" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <!-- Data export / import -->
      <div class="profile-section card-glass">
        <div class="section-header section-header--row">
          <h3>💾 Your data</h3>
        </div>
        <p class="pro-section-desc">Download everything you’ve logged as a file, or bring it into another account. Importing <strong>adds</strong> to your current data — it never overwrites or deletes anything.</p>
        <div class="data-actions">
          <button type="button" class="btn btn-secondary" :disabled="dataBusy" @click="doExport">
            {{ exporting ? 'Preparing…' : 'Export my data' }}
          </button>
          <label class="btn btn-ghost data-import" :class="{ 'is-disabled': dataBusy }">
            Import from file
            <input type="file" accept="application/json,.json" :disabled="dataBusy" @change="onImportFile" />
          </label>
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

    <!-- Import preview / confirm -->
    <Teleport to="body">
      <div v-if="importPreview" class="data-modal" @click.self="cancelImport">
        <div class="data-modal__box" role="dialog" aria-modal="true">
          <h3 class="data-modal__title">Import this data?</h3>
          <p class="data-modal__msg">This file contains:</p>
          <ul class="data-modal__list">
            <li><strong>{{ importPreview.summary.matches }}</strong> matches</li>
            <li><strong>{{ importPreview.summary.goals }}</strong> goals · <strong>{{ importPreview.summary.shots }}</strong> shots</li>
            <li><strong>{{ importPreview.summary.seasons }}</strong> seasons</li>
            <li><strong>{{ importPreview.summary.practiceSessions }}</strong> practice sessions across <strong>{{ importPreview.summary.practiceDrills }}</strong> drills</li>
          </ul>
          <p class="data-modal__note">It will be added to your account. This can create duplicates if you import the same file twice.</p>
          <div class="data-modal__actions">
            <button type="button" class="btn btn-ghost" :disabled="importing" @click="cancelImport">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="importing" @click="confirmImport">
              {{ importing ? (importStep || 'Importing…') : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { exportUserData, downloadJson, readJsonFile, summarize, isValidExport, importUserData } from '../lib/dataTransfer'
import { ResolveSession } from '../lib/authSession'
import { useRouter } from 'vue-router'
import PageHero from './ui/PageHero.vue'
import ProBadge from './ui/ProBadge.vue'
import PeerPercentilesTile from './dashboard/overview/PeerPercentilesTile.vue'
import ProfileAnalyticsTile from './dashboard/overview/ProfileAnalyticsTile.vue'
import Skeleton from './ui/Skeleton.vue'
import { isPro, accentColor, earlyAccess, setAccent, setEarlyAccess, loadEntitlements } from '../lib/premium'
import { getShareState, enableShare, disableShare, regenerateShare, shareUrl } from '../lib/shareLink'

// A small set of dark-mode-friendly accent colours.
const ACCENT_PRESETS = ['#4cda9c', '#3b82f6', '#a855f7', '#f43f5e', '#f59e0b', '#22d3ee']

export default {
  name: 'ProfileView',
  components: { PageHero, ProBadge, PeerPercentilesTile, ProfileAnalyticsTile, Skeleton },
  props: {
    // Harness-only: render the screen without an auth redirect / server loads.
    previewMode: { type: Boolean, default: false }
  },
  setup(props) {
    const user = ref(null)
    const loading = ref(true) // true until session + profile have resolved
    const router = useRouter()

    // Lab Pro: single accent colour + early access.
    const showPro = computed(() => props.previewMode || isPro.value)
    const accent = ref('')
    const earlyAccessOn = ref(false)
    const accentPresets = ACCENT_PRESETS
    const proPerks = [
      'Peer percentiles vs your position',
      'See who views your profile',
      'Form & slump alerts',
      'Custom accent colour',
      'Early access to new features'
    ]
    const goPremium = () => router.push('/premium')

    const selectAccent = (c) => { accent.value = c; setAccent(c) }
    const saveAccent = () => setAccent(accent.value)
    const resetAccent = () => { accent.value = ''; setAccent('') }
    const toggleEarlyAccess = () => setEarlyAccess(earlyAccessOn.value)

    // Coach/scout share link.
    const shareToken = ref(null)
    const shareEnabled = ref(false)
    const shareBusy = ref(false)
    const shareCopied = ref(false)
    const shareLinkUrl = computed(() => shareUrl(shareToken.value))
    const toggleShare = async () => {
      shareBusy.value = true
      try {
        if (shareEnabled.value) { await disableShare(); shareEnabled.value = false }
        else { shareToken.value = await enableShare(); shareEnabled.value = true }
      } finally { shareBusy.value = false }
    }
    const regenerateLink = async () => {
      shareBusy.value = true
      try { shareToken.value = await regenerateShare(); shareEnabled.value = true }
      finally { shareBusy.value = false }
    }
    const copyShareLink = async () => {
      try { await navigator.clipboard.writeText(shareLinkUrl.value); shareCopied.value = true; setTimeout(() => { shareCopied.value = false }, 1500) }
      catch { /* clipboard unavailable */ }
    }
    const syncProState = () => {
      accent.value = accentColor.value || ''
      earlyAccessOn.value = earlyAccess.value
    }

    // Data export / import.
    const exporting = ref(false)
    const importing = ref(false)
    const importStep = ref('')
    const importPreview = ref(null)
    const dataBusy = computed(() => exporting.value || importing.value)

    const doExport = async () => {
      exporting.value = true
      try {
        const payload = await exportUserData()
        const stamp = new Date().toISOString().slice(0, 10)
        downloadJson(payload, `mysoccerlab-${stamp}.json`)
        toast.success('Your data file is downloading.')
      } catch (e) {
        toast.error(e.message || 'Export failed.')
      } finally {
        exporting.value = false
      }
    }

    const onImportFile = async (event) => {
      const file = event.target.files?.[0]
      event.target.value = '' // allow re-picking the same file
      if (!file) return
      try {
        const payload = await readJsonFile(file)
        if (!isValidExport(payload)) { toast.error('That isn’t a My Soccer Lab export file.'); return }
        importPreview.value = { payload, summary: summarize(payload) }
      } catch (e) {
        toast.error(e.message || 'Couldn’t read that file.')
      }
    }

    const cancelImport = () => { if (!importing.value) importPreview.value = null }

    const confirmImport = async () => {
      if (!importPreview.value) return
      importing.value = true
      try {
        const res = await importUserData(importPreview.value.payload, (s) => { importStep.value = s + '…' })
        importPreview.value = null
        toast.success(`Imported ${res.matches} matches and ${res.sessions} practice sessions.`)
      } catch (e) {
        toast.error(e.message || 'Import failed.')
      } finally {
        importing.value = false
        importStep.value = ''
      }
    }
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
      if (props.previewMode) {
        user.value = { email: 'player@demo.com', created_at: '2025-01-01T00:00:00Z' }
        editableProfile.value = { ...editableProfile.value, playerName: 'Demo Player', position: 'Striker' }
        syncProState()
        shareEnabled.value = true
        shareToken.value = 'demo-share-token-abc123'
        loading.value = false
        return
      }
      // ResolveSession retries the cold-start race so we don't render an empty
      // profile / bounce to /login when the session just hasn't rehydrated yet.
      const session = await ResolveSession()
      if (session) {
        user.value = session.user
        // Independent fetches run together instead of one-after-another.
        const [, , share] = await Promise.all([
          loadProfile(session.user.id),
          loadEntitlements(session.user.id),
          getShareState()
        ])
        syncProState()
        shareToken.value = share?.token ?? null
        shareEnabled.value = !!share?.enabled
        loading.value = false
        // Let the load assignment settle before arming the auto-save watcher.
        await nextTick()
        ready = true
        watch(editableProfile, scheduleSave, { deep: true })
      } else {
        loading.value = false
        router.push('/login')
      }
    })

    onBeforeUnmount(() => {
      if (saveTimer) clearTimeout(saveTimer)
      if (statusTimer) clearTimeout(statusTimer)
    })

    const loadProfile = async (userId) => {
      try {
        const uid = userId || user.value?.id
        if (!uid) return

        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', uid)
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
        toast.error('Couldn’t upload that image. Please try again.')
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

        toast.success('Account deleted.')
        router.push('/')
      } catch (error) {
        console.error('Error deleting account:', error)
        toast.error('Couldn’t delete the account. Please contact support.')
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
      loading,
      isPro,
      showPro,
      accent,
      accentPresets,
      proPerks,
      selectAccent,
      saveAccent,
      resetAccent,
      goPremium,
      earlyAccessOn,
      toggleEarlyAccess,
      shareEnabled,
      shareBusy,
      shareCopied,
      shareLinkUrl,
      toggleShare,
      regenerateLink,
      copyShareLink,
      exporting,
      importing,
      importStep,
      importPreview,
      dataBusy,
      doExport,
      onImportFile,
      cancelImport,
      confirmImport,
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
  --md-sys-color-primary: var(--color-accent);
  --md-sys-color-on-primary: var(--color-on-accent);
  --md-sys-color-primary-container: var(--color-brand);
  --md-sys-color-on-primary-container: var(--color-brand-fg);
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

.profile-hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-hero-chip {
  padding: 7px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
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

.profile-skel {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}
.profile-skel__fields {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 768px) {
  .profile-skel { flex-direction: column; align-items: center; }
  .profile-skel__fields { grid-template-columns: 1fr; width: 100%; }
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
  border: 3px solid var(--color-accent);
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 20%, transparent);
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
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
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
  border-color: var(--color-accent);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
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
  /* Match the app-wide PitchSurface look for continuity. */
  background:
    radial-gradient(circle at 50% 30%, rgba(34, 80, 50, 0.35), rgba(20, 24, 22, 0.95)),
    var(--color-bg-field);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.field-line {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  background: color-mix(in srgb, var(--color-accent) 60%, transparent);
  border-color: #fff;
  transform: translate(-50%, -50%) scale(1.1);
}

.position-dot.active {
  background: var(--color-accent);
  border-color: #fff;
  box-shadow: 0 0 10px var(--color-accent);
  z-index: 3;
}

.pos-abbr {
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
}

.position-dot.active .pos-abbr {
  color: var(--color-on-accent);
}

.selected-position-label {
  color: var(--color-accent);
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
  background-color: var(--color-accent);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--color-accent);
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

/* --- Share link --- */
.share-link { display: flex; flex-direction: column; gap: 12px; }
.share-link__row { display: flex; gap: 10px; flex-wrap: wrap; }
.share-link__input {
  flex: 1 1 240px;
  min-width: 0;
  padding: 11px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}
.share-link__input:focus { outline: none; border-color: var(--color-accent); }
.share-link__off { margin: 0; color: #89938d; font-size: 0.9rem; }

/* --- Lab Pro showcase --- */
.pro-section {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(130% 90% at 100% 0%, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 55%),
    rgba(15, 18, 20, 0.82);
  border: 1px solid color-mix(in srgb, var(--color-accent) 22%, transparent);
  box-shadow:
    0 10px 44px -10px color-mix(in srgb, var(--color-accent) 24%, transparent),
    0 4px 24px -1px rgba(0, 0, 0, 0.4);
}

.pro-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.pro-hero__brand { display: flex; align-items: center; gap: 14px; }
.pro-hero__spark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 32%, transparent);
  color: var(--color-accent);
  box-shadow: 0 0 26px color-mix(in srgb, var(--color-accent) 32%, transparent);
}
.pro-hero__spark svg { width: 24px; height: 24px; }
.pro-hero__title { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
.pro-hero__tag { margin: 2px 0 0; color: #89938d; font-size: 0.85rem; }

.pro-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 700;
}
.pro-status--active {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 38%, transparent);
  color: var(--color-accent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--color-accent) 25%, transparent);
}
.pro-status__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
.pro-upgrade { box-shadow: 0 0 22px color-mix(in srgb, var(--color-accent) 35%, transparent); }

.pro-perks {
  list-style: none;
  margin: 0 0 1.75rem;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 11px;
}
@media (min-width: 600px) { .pro-perks { grid-template-columns: 1fr 1fr; } }
.pro-perks li { display: flex; align-items: center; gap: 10px; color: #e1e2e6; font-size: 0.92rem; }
.pro-perks__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 800;
}

/* Embedded Pro analytics tiles */
.pro-tiles {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 1.75rem;
}
@media (min-width: 720px) {
  .pro-tiles { grid-template-columns: 1fr 1fr; }
}

/* Pro control blocks */
.pro-block {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.pro-block--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.pro-block--row > div { min-width: 0; }
/* Keep the toggle at its natural size so the knob can't overflow the track. */
.pro-block--row .switch { flex: 0 0 auto; }
.pro-block__head { display: flex; align-items: center; gap: 10px; }
.pro-tag {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: rgba(255, 183, 77, 0.14);
  color: #ffb74d;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.pro-hint { margin: 6px 0 0; color: #89938d; font-size: 0.9rem; line-height: 1.5; }

/* Accent swatches */
.accent-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 14px; margin-bottom: 14px; }
.accent-swatch {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.accent-swatch:hover { transform: scale(1.1); }
.accent-swatch.is-active { border-color: #fff; box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15); }

.accent-custom {
  position: relative;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.accent-custom.is-disabled { opacity: 0.4; cursor: not-allowed; }
.accent-custom__plus { color: #89938d; font-size: 1.1rem; line-height: 1; pointer-events: none; }
.accent-custom input[type="color"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.accent-custom.is-disabled input { cursor: not-allowed; }

.accent-reset {
  margin-left: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-pill);
  color: #c9cdd2;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 14px;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.accent-reset:hover { background: rgba(255, 255, 255, 0.09); border-color: rgba(255, 255, 255, 0.28); color: #fff; }

.ea-chip {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  vertical-align: middle;
}

.switch.is-disabled { opacity: 0.4; }
.switch.is-disabled input { cursor: not-allowed; }

/* --- Data export / import --- */
.data-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 1.5rem; }
.data-import { position: relative; overflow: hidden; cursor: pointer; }
.data-import input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.data-import.is-disabled { opacity: 0.5; pointer-events: none; }

.data-modal {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.data-modal__box {
  width: 100%; max-width: 420px;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
.data-modal__title { margin: 0 0 var(--space-3); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); color: #fff; }
.data-modal__msg { margin: 0 0 var(--space-2); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.data-modal__list { margin: 0 0 var(--space-4); padding-left: 18px; color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.7; }
.data-modal__list strong { color: var(--color-accent); }
.data-modal__note { margin: 0 0 var(--space-5); color: var(--color-text-faint); font-size: var(--font-size-xs); line-height: 1.5; }
.data-modal__actions { display: flex; justify-content: flex-end; gap: var(--space-3); }

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
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
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
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
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