<template>
  <section class="asec">
    <router-link to="/admin/users" class="asec__back">← All users</router-link>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to manage this user.
    </div>

    <template v-else-if="profile">
      <header class="ud__head">
        <div>
          <h2 class="asec__title">{{ profile.player_name || 'Unnamed player' }}</h2>
          <p class="ud__sub">{{ auth.email || '—' }} · joined {{ fmtDate(auth.created_at) }}<span v-if="auth.last_sign_in_at"> · last seen {{ fmtDate(auth.last_sign_in_at) }}</span></p>
        </div>
        <UserStatusBadges
          :is-admin="profile.is_admin"
          :is-pro="profile.subscription_tier === 'pro'"
          :banned="isBanned"
          :is-public="profile.is_public"
          :early-access="profile.early_access"
        />
      </header>

      <div class="ud__counts">
        <span><strong>{{ counts.matches }}</strong> matches</span>
        <span><strong>{{ counts.practice }}</strong> sessions</span>
        <span><strong>{{ counts.convos }}</strong> coach chats</span>
      </div>

      <div class="ud__tabs" role="tablist">
        <button v-for="t in tabs" :key="t" type="button" class="ud__tab" :class="{ 'is-active': tab === t }" @click="setTab(t)">{{ t }}</button>
      </div>

      <p v-if="toast" class="ud__toast" :class="`is-${toast.kind}`">{{ toast.msg }}</p>

      <!-- Profile -->
      <div v-show="tab === 'Profile'" class="ud__panel">
        <div class="ud__grid">
          <AdminField v-model="form.player_name" label="Player name" />
          <AdminField v-model="form.club_team" label="Club team" />
          <AdminField v-model="form.position" label="Position" type="select" :options="positionOptions" />
          <AdminField v-model="form.preferred_foot" label="Preferred foot" type="select" :options="footOptions" />
          <AdminField v-model="form.jersey_number" label="Jersey number" type="number" :min="1" :max="99" />
          <AdminField v-model="form.nationality" label="Nationality" />
          <AdminField v-model="form.height_cm" label="Height (cm)" type="number" :min="100" :max="250" />
          <AdminField v-model="form.weight_kg" label="Weight (kg)" type="number" :min="30" :max="200" />
          <AdminField v-model="form.date_of_birth" label="Birthday" type="date" />
        </div>
        <AdminField v-model="form.bio" label="Bio" multiline :rows="3" />
        <div class="ud__toggles">
          <AdminField v-model="form.is_public" label="Public profile" type="checkbox" />
          <AdminField v-model="form.early_access" label="Early access" type="checkbox" />
          <AdminField v-model="form.enable_heatmap_tracking" label="Heatmap tracking" type="checkbox" />
          <AdminField v-model="form.is_test_account" label="Test account (hidden from feed & lists)" type="checkbox" />
        </div>
        <div class="ud__actions">
          <button type="button" class="btn btn-primary" :disabled="busy" @click="saveProfile">Save profile</button>
        </div>
      </div>

      <!-- Pro & Ban -->
      <div v-show="tab === 'Pro & Ban'" class="ud__panel">
        <div class="ud__card">
          <h3 class="ud__card-title">Subscription</h3>
          <ProGrantForm
            :tier="profile.subscription_tier"
            :ends-at="profile.subscription_ends_at"
            :busy="busy"
            @grant="onGrant"
            @revoke="onRevoke"
          />
        </div>

        <div class="ud__card">
          <h3 class="ud__card-title">Moderation</h3>
          <div v-if="isBanned" class="ud__banned">
            <span>Banned{{ profile.banned_until ? ` until ${fmtDate(profile.banned_until)}` : '' }}.</span>
            <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="onUnban">Lift ban</button>
          </div>
          <div v-else class="ud__ban-row">
            <label class="ud__field">
              <span>Ban for</span>
              <select v-model="banDuration">
                <option v-for="d in banDurations" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </label>
            <button type="button" class="btn btn-danger" :disabled="busy" @click="askBan">Ban user</button>
          </div>
        </div>

        <div class="ud__card">
          <h3 class="ud__card-title">Admin access</h3>
          <div class="ud__ban-row">
            <span class="ud__muted">{{ profile.is_admin ? 'This user is an admin.' : 'Standard user.' }}</span>
            <button type="button" class="btn btn-secondary btn-sm" :disabled="busy" @click="askToggleAdmin">
              {{ profile.is_admin ? 'Remove admin' : 'Make admin' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Matches -->
      <div v-show="tab === 'Matches'" class="ud__panel">
        <AdminTable
          :columns="matchCols" :rows="matches" :loading="loadingMatches" clickable
          empty-text="No matches logged." :page="matchPage" :page-size="25" :total="matchTotal"
          @row-click="(m) => $router.push(`/admin/matches/${m.id}`)" @page="loadMatches"
        >
          <template #cell-match_date="{ value }">{{ fmtDate(value) }}</template>
          <template #cell-score="{ row }">{{ row.score_for }}–{{ row.score_against }}</template>
        </AdminTable>
      </div>

      <!-- Practice — grouped by drill so each drill's sessions read as a unit -->
      <div v-show="tab === 'Practice'" class="ud__panel">
        <div v-if="loadingPractice" class="asec__loading">Loading…</div>
        <p v-else-if="!practiceGroups.length" class="ud__muted">No practice sessions logged.</p>
        <div v-else class="ud__drills">
          <div v-for="g in practiceGroups" :key="g.drill.id" class="ud__drill">
            <div class="ud__drill-head">
              <div class="ud__drill-id">
                <strong class="ud__drill-name">{{ g.drill.name }}</strong>
                <span class="ud__drill-type">{{ metricTypeLabel(g.drill.metric_type) }}<template v-if="g.drill.unit"> · {{ g.drill.unit }}</template></span>
              </div>
              <div class="ud__drill-meta">
                <span>{{ g.sessions.length }} session{{ g.sessions.length === 1 ? '' : 's' }}</span>
                <span v-if="g.best">· best <strong>{{ formatValue(g.best, g.drill) }}</strong></span>
              </div>
            </div>
            <table class="ud__stable">
              <thead>
                <tr>
                  <th>Date</th>
                  <template v-if="g.isShots">
                    <th>Goals</th><th>Shots</th><th>Accuracy</th>
                  </template>
                  <th v-else>{{ g.unitLabel }}</th>
                  <th class="ud__notes-col">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in g.sessions" :key="s.id" :class="{ 'is-best': g.best && s.id === g.best.id }">
                  <td>{{ fmtDate(s.session_date) }}</td>
                  <template v-if="g.isShots">
                    <td>{{ s.primary_value ?? '—' }}</td>
                    <td>{{ s.secondary_value ?? '—' }}</td>
                    <td>{{ accuracyPct(s) !== null ? accuracyPct(s) + '%' : '—' }}</td>
                  </template>
                  <td v-else>{{ formatValue(s, g.drill) }}</td>
                  <td class="ud__notes">{{ s.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Coach usage -->
      <div v-show="tab === 'Coach'" class="ud__panel">
        <p class="ud__muted">{{ counts.convos }} coach conversation{{ counts.convos === 1 ? '' : 's' }}. Message content is private to the user and not shown here.</p>
      </div>
    </template>

    <div v-else class="asec__loading">Loading…</div>

    <AdminConfirm
      :open="confirm.open" :title="confirm.title" :message="confirm.message" :confirm-label="confirm.label"
      @confirm="confirm.onYes" @cancel="confirm.open = false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as api from '../../../lib/adminApi'
import { BAN_DURATIONS } from '../../../lib/proDuration'
import { formatValue, accuracyPct, metricTypeLabel, personalBest } from '../../../lib/practiceFormat'
import AdminField from '../AdminField.vue'
import AdminTable from '../AdminTable.vue'
import AdminConfirm from '../AdminConfirm.vue'
import ProGrantForm from '../ProGrantForm.vue'
import UserStatusBadges from '../UserStatusBadges.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const route = useRoute()
const userId = computed(() => route.params.id)

const tabs = ['Profile', 'Pro & Ban', 'Matches', 'Practice', 'Coach']
const tab = ref('Profile')
const positionOptions = [
  { value: '', label: '—' },
  ...['Goalkeeper', 'Center-Back', 'Full-Back', 'Wing-Back', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Winger', 'Striker', 'Center-Forward'].map((p) => ({ value: p, label: p }))
]
const footOptions = [{ value: '', label: '—' }, { value: 'Right', label: 'Right' }, { value: 'Left', label: 'Left' }, { value: 'Both', label: 'Both' }]
const banDurations = BAN_DURATIONS
const matchCols = [
  { key: 'match_date', label: 'Date' },
  { key: 'opponent', label: 'Opponent' },
  { key: 'score', label: 'Score' },
  { key: 'position_played', label: 'Position' }
]

const profile = ref(null)
const auth = ref({})
const counts = ref({ matches: 0, practice: 0, convos: 0 })
const form = ref({})
const busy = ref(false)
const notDeployed = ref(false)
const toast = ref(null)
const banDuration = ref('1w')

const matches = ref([]); const matchTotal = ref(0); const matchPage = ref(0); const loadingMatches = ref(false); let matchesLoaded = false
const sessions = ref([]); const drills = ref([]); const loadingPractice = ref(false); let practiceLoaded = false

const confirm = ref({ open: false, title: '', message: '', label: 'Confirm', onYes: () => {} })

const isBanned = computed(() => !!(profile.value?.banned_until) && new Date(profile.value.banned_until) > new Date())
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// Group practice sessions under their drill so each drill reads as a block, with
// the drill's metric type driving how values render (shot drills get a
// goals/shots/accuracy breakdown; everything else uses the shared formatValue).
const practiceGroups = computed(() => {
  const byDrill = {}
  for (const s of sessions.value) {
    if (!byDrill[s.drill_id]) byDrill[s.drill_id] = []
    byDrill[s.drill_id].push(s)
  }
  const groups = []
  for (const [drillId, list] of Object.entries(byDrill)) {
    const drill = drills.value.find((d) => String(d.id) === String(drillId)) || { id: drillId, name: 'Unknown drill', metric_type: 'count' }
    const sorted = [...list].sort((a, b) => new Date(b.session_date) - new Date(a.session_date) || (b.id || 0) - (a.id || 0))
    groups.push({
      drill,
      sessions: sorted,
      best: personalBest(list, drill),
      isShots: drill.metric_type === 'shot_map',
      unitLabel: metricTypeLabel(drill.metric_type)
    })
  }
  groups.sort((a, b) => new Date(b.sessions[0].session_date) - new Date(a.sessions[0].session_date))
  return groups
})

const flash = (msg, kind = 'ok') => { toast.value = { msg, kind }; setTimeout(() => { toast.value = null }, 2600) }

const buildForm = () => {
  const p = profile.value || {}
  form.value = {
    player_name: p.player_name || '', club_team: p.club_team || '', position: p.position || '',
    preferred_foot: p.preferred_foot || '', jersey_number: p.jersey_number || null,
    nationality: p.nationality || '', height_cm: p.height_cm || null, weight_kg: p.weight_kg || null,
    date_of_birth: p.date_of_birth || '', bio: p.bio || '',
    is_public: !!p.is_public, early_access: !!p.early_access, enable_heatmap_tracking: p.enable_heatmap_tracking !== false,
    is_test_account: !!p.is_test_account
  }
}

const load = async () => {
  if (props.previewMode) {
    profile.value = { user_id: 'u1', player_name: 'Alex Striker', club_team: 'FC Demo', position: 'Striker', preferred_foot: 'Right', jersey_number: 9, nationality: 'Brazil', height_cm: 180, weight_kg: 75, date_of_birth: '2002-04-12', bio: 'Clinical finisher.', is_public: true, early_access: true, enable_heatmap_tracking: true, is_admin: true, subscription_tier: 'pro', subscription_ends_at: '2026-09-01', banned_until: null }
    auth.value = { email: 'alex@demo.com', created_at: '2025-02-10', last_sign_in_at: '2026-06-10' }
    counts.value = { matches: 24, practice: 11, convos: 5 }
    buildForm()
    return
  }
  try {
    const data = await api.getUser(userId.value)
    profile.value = data.profile
    auth.value = data.auth || {}
    counts.value = data.counts || { matches: 0, practice: 0, convos: 0 }
    buildForm()
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
    else flash(e.message, 'err')
  }
}

const setTab = (t) => {
  tab.value = t
  if (t === 'Matches' && !matchesLoaded) loadMatches(0)
  if (t === 'Practice' && !practiceLoaded) loadPractice()
}

const loadMatches = async (p = 0) => {
  matchPage.value = p
  if (props.previewMode) { matches.value = [{ id: 'm1', match_date: '2026-06-01', opponent: 'Rivals FC', score_for: 3, score_against: 1, position_played: 'Striker' }]; matchTotal.value = 1; matchesLoaded = true; return }
  loadingMatches.value = true
  try {
    const data = await api.listMatches({ page: p, pageSize: 25, userId: userId.value })
    matches.value = data.rows; matchTotal.value = data.total; matchesLoaded = true
  } catch (e) { flash(e.message, 'err') } finally { loadingMatches.value = false }
}

const loadPractice = async () => {
  if (props.previewMode) { sessions.value = [{ id: 's1', session_date: '2026-05-20', drill_id: 'd1', primary_value: 18 }]; drills.value = [{ id: 'd1', name: 'Finishing reps' }]; practiceLoaded = true; return }
  loadingPractice.value = true
  try {
    const data = await api.listPractice({ userId: userId.value, pageSize: 500 })
    sessions.value = data.sessions; drills.value = data.drills; practiceLoaded = true
  } catch (e) { flash(e.message, 'err') } finally { loadingPractice.value = false }
}

// Match the user_profiles CHECK constraints so we surface a friendly message
// instead of letting the DB reject the save with a raw constraint error.
const validateProfile = () => {
  const f = form.value
  const ranges = [
    ['jersey_number', 1, 99, 'Jersey number must be between 1 and 99.'],
    ['height_cm', 100, 250, 'Height must be between 100 and 250 cm.'],
    ['weight_kg', 30, 200, 'Weight must be between 30 and 200 kg.']
  ]
  for (const [key, min, max, msg] of ranges) {
    const v = f[key]
    if (v !== null && v !== '' && v !== undefined && (Number(v) < min || Number(v) > max)) return msg
  }
  return null
}

const saveProfile = async () => {
  if (props.previewMode) { flash('Saved (preview)'); return }
  const err = validateProfile()
  if (err) { flash(err, 'err'); return }
  busy.value = true
  try { await api.updateProfile(userId.value, form.value); flash('Profile saved'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}

const onGrant = async ({ tier, duration, customEndsAt }) => {
  if (props.previewMode) { flash('Pro granted (preview)'); return }
  busy.value = true
  try { await api.setTier(userId.value, tier, duration, customEndsAt); flash('Subscription updated'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}
const onRevoke = async () => {
  if (props.previewMode) { flash('Pro revoked (preview)'); return }
  busy.value = true
  try { await api.setTier(userId.value, 'free'); flash('Pro revoked'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}

const askBan = () => {
  confirm.value = {
    open: true, title: 'Ban this user?', label: 'Ban user',
    message: `They will be blocked from logging in (${banDurations.find((d) => d.value === banDuration.value)?.label.toLowerCase()}). You can lift it anytime.`,
    onYes: doBan
  }
}
const doBan = async () => {
  confirm.value.open = false
  if (props.previewMode) { flash('Banned (preview)'); return }
  busy.value = true
  try { await api.banUser(userId.value, banDuration.value); flash('User banned'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}
const onUnban = async () => {
  if (props.previewMode) { flash('Ban lifted (preview)'); return }
  busy.value = true
  try { await api.unbanUser(userId.value); flash('Ban lifted'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}

const askToggleAdmin = () => {
  const makeAdmin = !profile.value.is_admin
  confirm.value = {
    open: true, title: makeAdmin ? 'Grant admin access?' : 'Remove admin access?', label: 'Confirm',
    message: makeAdmin ? 'This user will get full control-center access.' : 'This user will lose admin access.',
    onYes: doToggleAdmin
  }
}
const doToggleAdmin = async () => {
  confirm.value.open = false
  if (props.previewMode) { flash('Updated (preview)'); return }
  busy.value = true
  try { await api.toggleAdmin(userId.value, !profile.value.is_admin); flash('Admin access updated'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}

onMounted(load)
</script>

<style scoped>
.asec__title { margin: 0 0 4px; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__back { display: inline-block; margin-bottom: var(--space-4); color: var(--color-text-muted); text-decoration: none; font-size: var(--font-size-sm); }
.asec__back:hover { color: var(--color-accent); }
.asec__notice { padding: var(--space-4); background: var(--color-warning-bg); border: 1px solid rgba(255,183,77,0.35); border-radius: var(--radius-md); color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }
.asec__loading { color: var(--color-text-muted); padding: var(--space-5); }

.ud__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.ud__sub { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }
.ud__counts { display: flex; gap: var(--space-5); margin-bottom: var(--space-4); font-size: var(--font-size-sm); color: var(--color-text-muted); }
.ud__counts strong { color: var(--color-text-primary); font-size: var(--font-size-md); }

.ud__tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: var(--space-4); }
.ud__tab { padding: 9px 14px; border: none; background: transparent; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); font-family: inherit; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; }
.ud__tab.is-active { color: var(--color-accent); border-bottom-color: var(--color-accent); }

.ud__toast { margin: 0 0 var(--space-4); padding: 9px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.ud__toast.is-ok { background: var(--color-success-bg); color: var(--color-success); }
.ud__toast.is-err { background: rgba(239,83,80,0.12); color: var(--color-danger); }

.ud__grid { display: grid; grid-template-columns: 1fr; gap: 0 var(--space-4); }
.ud__toggles { display: flex; flex-wrap: wrap; gap: var(--space-5); margin: var(--space-3) 0 var(--space-4); }
.ud__actions { display: flex; justify-content: flex-end; }

.ud__card { padding: var(--space-5); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); margin-bottom: var(--space-4); }
.ud__card-title { margin: 0 0 var(--space-4); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.ud__ban-row, .ud__banned { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-3); }
.ud__banned { color: var(--color-danger); font-size: var(--font-size-sm); align-items: center; }
.ud__field { display: flex; flex-direction: column; gap: 5px; }
.ud__field span { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.ud__field select { padding: 10px 12px; background: var(--color-bg-field); border: 1px solid var(--color-border-soft); border-radius: var(--radius-md); color: var(--color-text-primary); font-family: inherit; font-size: var(--font-size-base); }
.ud__muted { color: var(--color-text-muted); font-size: var(--font-size-sm); }

/* Practice — one card per drill */
.ud__drills { display: flex; flex-direction: column; gap: var(--space-4); }
.ud__drill { border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-surface-2); overflow: hidden; }
.ud__drill-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-subtle); }
.ud__drill-id { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ud__drill-name { color: var(--color-text-primary); font-size: var(--font-size-md); }
.ud__drill-type { font-size: var(--font-size-xs); color: var(--color-text-faint); text-transform: uppercase; letter-spacing: 0.04em; }
.ud__drill-meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.ud__drill-meta strong { color: var(--color-accent); }

.ud__stable { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.ud__stable th { text-align: left; padding: 8px 14px; background: var(--color-bg-surface); color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.04em; font-weight: var(--font-weight-semibold); white-space: nowrap; }
.ud__stable td { padding: 9px 14px; color: var(--color-text-secondary); border-top: 1px solid var(--color-border-subtle); vertical-align: middle; }
.ud__stable tr.is-best td { background: var(--color-success-bg); color: var(--color-text-primary); }
.ud__notes-col { width: 40%; }
.ud__notes { color: var(--color-text-muted); }

@media (min-width: 620px) {
  .ud__grid { grid-template-columns: 1fr 1fr; }
}
</style>
