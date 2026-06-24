<template>
  <div class="dashboard-page">
    <!-- Faint, static brand wash echoing the home hero — no WebGL, readability first. -->
    <div class="dash-bg" aria-hidden="true">
      <span class="dash-bg__aurora"></span>
    </div>

    <div class="dashboard-hero-wrap">
      <header class="dash-hero" data-testid="page-hero">
        <div class="dash-hero__head" data-reveal="rv-rise" style="--rv-i: 0">
          <h1 class="dash-hero__title">
            <span class="dash-hero__line">Welcome back,</span>
            <span class="dash-hero__line dash-hero__line--accent">{{ userName || 'Player' }}.</span>
          </h1>
        </div>
      </header>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-container-inner">
        <!-- Unified control bar. Flat flex children reordered per breakpoint:
             desktop is one row (mode · tabs … season  Simple/Advanced); mobile
             stacks to row 1 = mode, row 2 = tabs + Simple/Advanced, row 3 =
             season. -->
        <div class="control-bar" data-reveal="rv-rise" style="--rv-i: 2">
          <ModeSwitcher class="cb-mode" :modelValue="dashboardMode" @update:modelValue="setMode" />
          <span class="control-bar__divider" aria-hidden="true"></span>
          <ScrollableTabs
            class="cb-tabs"
            :TabItems="dashboardTabItems"
            :ActiveKey="activeTab"
            @select="activeTab = $event"
          />
          <div
            v-if="dashboardMode === 'matches' && activeTab === 'overview'"
            class="overview-mode cb-view"
            role="tablist"
            aria-label="Dashboard detail level"
          >
            <button type="button" class="overview-mode__btn" :class="{ 'is-active': !advanced }" :aria-selected="!advanced" @click="advanced = false">Simple</button>
            <button type="button" class="overview-mode__btn" :class="{ 'is-active': advanced }" :aria-selected="advanced" @click="advanced = true">Advanced</button>
          </div>
          <SeasonSelector
            v-if="dashboardMode === 'matches'"
            class="cb-season"
            :seasons="seasons"
            :activeSeason="activeSeason"
            @update:activeSeason="setActiveSeason"
            @season-created="onSeasonCreated"
            @season-deleted="onSeasonDeleted"
            @season-updated="onSeasonUpdated"
          />
        </div>

        <!-- Matches mode -->
        <template v-if="dashboardMode === 'matches'">
          <DashboardOverview
            v-if="activeTab === 'overview'"
            v-model:advanced="advanced"
            :matches="filteredMatches"
            :userName="userName"
            :allShotsData="filteredShotsData"
            :allGoalsData="filteredGoalsData"
            :allHeatmapData="filteredHeatmapData"
            :season="activeSeason"
            :totalMatches="matches.length"
            :loading="dataLoading"
            @go-to-matches="activeTab = 'matches'"
            @clear-season="activeSeason = null"
            @go-to-drills="goToDrills"
            @open-match="openMatch"
          />

          <MatchManager
            v-if="activeTab === 'matches'"
            :matches="filteredMatches"
            :activeSeason="activeSeason"
            :seasons="seasons"
            :openMatchId="pendingMatchId"
            @match-updated="loadData"
            @match-opened="pendingMatchId = null"
          />
        </template>

        <!-- Training mode -->
        <template v-else>
          <TrainingOverview
            v-if="activeTab === 'overview'"
            :userName="userName"
            @go-to-drills="activeTab = 'drills'"
          />

          <PracticeTracker
            v-if="activeTab === 'drills'"
            :userName="userName"
          />

          <WeeklyTrainingPlan
            v-if="activeTab === 'weekly'"
            :userName="userName"
          />
        </template>

      </div>
    </div>

    <WelcomeIntro v-if="ShowIntro" @Done="DismissIntro" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { revealScan } from '../lib/scrollReveal'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { ResolveSession } from '../lib/authSession'
import { content, loadKey } from '../lib/siteContent'
import { isAdmin, loadEntitlements } from '../lib/premium'
import { selectByIds } from '../lib/queryBatch'
import WelcomeIntro from './onboarding/WelcomeIntro.vue'
import DashboardOverview from './DashboardOverview.vue'
import MatchManager from './MatchManager.vue'
import SeasonSelector from './SeasonSelector.vue'
import PracticeTracker from './dashboard/practice/PracticeTracker.vue'
import TrainingOverview from './dashboard/practice/TrainingOverview.vue'
import WeeklyTrainingPlan from './dashboard/practice/WeeklyTrainingPlan.vue'
import ScrollableTabs from './ui/ScrollableTabs.vue'
import ModeSwitcher from './ui/ModeSwitcher.vue'

// Tab sets are scoped to the active mode (Part A — two-pillar dashboard).
const TABS_BY_MODE = {
  matches: [
    { Key: 'overview', Label: 'Overview' },
    { Key: 'matches', Label: 'Matches' }
  ],
  training: [
    { Key: 'overview', Label: 'Overview' },
    { Key: 'drills', Label: 'Drills' },
    { Key: 'weekly', Label: 'Weekly Plan' }
  ]
}

const router = useRouter()
const route = useRoute()
const matches = ref([])
const dataLoading = ref(true) // true until the first matches query resolves
const allShotsData = ref([])
const allGoalsData = ref([])
const allHeatmapData = ref([])
const userName = ref('')
const userPosition = ref('')
const userPreferredFoot = ref('')
const userClubTeam = ref('')
const activeTab = ref('overview')
const seasons = ref([])
const activeSeason = ref(null)
// Simple ⇄ Advanced for the Overview, hoisted here so it lives in the unified
// control bar (DashboardOverview mirrors it via v-model:advanced).
const advanced = ref(false)

// ── Dashboard mode (Matches | Training) ─────────────────────────────────────
const dashboardMode = ref('matches')
const currentUserId = ref(null)
// How the current mode was decided, so weaker signals don't clobber stronger
// ones regardless of async resolution order: explicit (query/localStorage/
// onboarding choice) > heuristic (no matches → training) > none (default).
let modeSource = 'none'
// True once we've restored the last-used mode from localStorage, so the
// onboarding default (primary_focus) doesn't clobber the user's last choice on
// refresh — that was sending people back to Matches > Overview every reload.
let savedModeRestored = false

const dashboardTabItems = computed(() => TABS_BY_MODE[dashboardMode.value])

// Reveal the hero + control chrome on mount (the overview tiles decorate
// themselves inside DashboardOverview).
onMounted(() => nextTick(() => revealScan()))

// Persist the active tab per user so a refresh restores where you were instead
// of dumping you back on Overview.
watch(activeTab, (tab) => {
  // Leaving Overview drops back to Simple, so returning isn't unexpectedly Advanced.
  if (tab !== 'overview') advanced.value = false
  if (currentUserId.value) {
    try { localStorage.setItem(`msl-dash-tab:${currentUserId.value}`, tab) } catch { /* ignore */ }
  }
})

const seedMode = (mode, source) => {
  if (mode !== 'matches' && mode !== 'training') return
  if (source !== 'explicit' && modeSource === 'explicit') return
  dashboardMode.value = mode
  modeSource = source
}

// Jump straight to the Practice tracker from an Overview tile (different mode
// + tab). setMode resets the tab to 'overview', so set 'drills' afterwards.
const goToDrills = () => {
  setMode('training')
  activeTab.value = 'drills'
}

// Open a specific match from an Overview chart: switch to the Matches tab and
// hand the id to MatchManager, which opens it on mount.
const pendingMatchId = ref(null)
const openMatch = (matchId) => {
  pendingMatchId.value = matchId
  activeTab.value = 'matches'
}

// User-driven switch from the ModeSwitcher — always wins, persists, deep-links.
const setMode = (mode) => {
  if (mode !== 'matches' && mode !== 'training') return
  dashboardMode.value = mode
  modeSource = 'explicit'
  activeTab.value = 'overview'
  advanced.value = false
  if (currentUserId.value) {
    try { localStorage.setItem(`msl-dash-mode:${currentUserId.value}`, mode) } catch { /* ignore */ }
  }
  router.replace({ query: { ...route.query, mode } })
}

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

const filteredHeatmapData = computed(() => {
  if (!activeSeason.value) return allHeatmapData.value
  const ids = new Set(filteredMatches.value.map(m => m.id))
  return allHeatmapData.value.filter(h => ids.has(h.match_id))
})

// Intro shown to brand-new players (no matches yet, never dismissed).
const ShowIntro = ref(false)
const IntroStorageKey = ref('')

const MaybeShowIntro = (userId) => {
  IntroStorageKey.value = `msl-intro-seen:${userId}`
  // Master switch: admin can hide the intro for everyone.
  if (content.value?.intro?.enabled === false) return
  // Testing mode: admins re-see the intro on every load, ignoring the seen flag.
  if (isAdmin.value && content.value?.intro?.forceShowForAdmins) { ShowIntro.value = true; return }
  try {
    // Otherwise gate on the seen flag only — NOT on match count. A Training-only
    // user never logs a match, so the old `matches.length === 0` gate re-nagged
    // them forever; once dismissed, the flag keeps it from showing again.
    if (localStorage.getItem(IntroStorageKey.value)) return
  } catch { /* storage unavailable — show nothing rather than nag forever */ return }
  ShowIntro.value = true
}

const DismissIntro = (focus) => {
  ShowIntro.value = false
  try { localStorage.setItem(IntroStorageKey.value, '1') } catch { /* ignore */ }

  // Persist the chosen path: seed the mode now, remember it for this device,
  // and store it on the profile for cross-device (best-effort — the column may
  // not exist until migration 0024 is applied).
  if (focus === 'matches' || focus === 'training' || focus === 'both') {
    seedMode(focus === 'training' ? 'training' : 'matches', 'explicit')
    if (currentUserId.value) {
      try { localStorage.setItem(`msl-dash-mode:${currentUserId.value}`, dashboardMode.value) } catch { /* ignore */ }
      supabase.from('user_profiles')
        .update({ primary_focus: focus })
        .eq('user_id', currentUserId.value)
        .then(({ error }) => { if (error) console.warn('Could not save primary_focus:', error.message) })
    }
  }
}

onMounted(async () => {
  // ResolveSession waits out the Google OAuth redirect (tokens still in the
  // URL while this mounts) instead of bouncing fresh sign-ins to /login.
  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  currentUserId.value = session.user.id

  // Seed the mode: explicit deep-link (?mode=) first, then the last-used mode
  // saved for this user. Onboarding choice (primary_focus) and the no-matches
  // heuristic are applied later in loadData via seedMode().
  const queryMode = route.query.mode
  if (queryMode === 'matches' || queryMode === 'training') {
    seedMode(queryMode, 'explicit')
    savedModeRestored = true
  } else {
    try {
      const saved = localStorage.getItem(`msl-dash-mode:${session.user.id}`)
      if (saved === 'matches' || saved === 'training') { seedMode(saved, 'explicit'); savedModeRestored = true }
    } catch { /* storage unavailable */ }
  }

  // Restore the last tab for whatever mode we landed in (validated against that
  // mode's tab set, since the two modes have different tabs).
  try {
    const savedTab = localStorage.getItem(`msl-dash-tab:${session.user.id}`)
    const validKeys = (TABS_BY_MODE[dashboardMode.value] || []).map(t => t.Key)
    if (savedTab && validKeys.includes(savedTab)) activeTab.value = savedTab
  } catch { /* storage unavailable */ }

  // Seasons + dashboard data are independent — load them in parallel, and
  // reuse the resolved user so we don't fire extra getUser() round-trips.
  // Intro content + entitlements load alongside so MaybeShowIntro knows the
  // admin-force setting and whether this user is an admin.
  await Promise.all([
    loadSeasons(session.user),
    loadData(session.user),
    loadKey('intro').catch(() => {}),
    loadEntitlements(session.user.id)
  ])
  MaybeShowIntro(session.user.id)
})

// getUser() hits the auth server on every call; getSession() is local. We only
// need the id, and callers usually already hold the user.
const resolveUser = async (passed) => {
  // Only trust a real auth user object (has id + email); event payloads from
  // @match-updated have an id but no email, so they fall back to getSession.
  if (passed?.id && passed?.email) return passed
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

const loadSeasons = async (passedUser) => {
  const user = await resolveUser(passedUser)
  if (!user) return
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  seasons.value = data || []
  // Default to "All time" (activeSeason = null) so every match shows. Auto-
  // selecting a season used to hide any match not tagged to it, which looked
  // like "No matches yet" even when the player had matches.
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

const loadData = async (passedUser) => {
  const user = await resolveUser(passedUser)
  if (!user) return
  const nameFallback = (user.email || 'Player').split('@')[0] || 'Player'

  // ── Matches first — the dashboard's core. Show them the moment they arrive,
  //    independent of the profile/detail queries, so a failure or slow response
  //    in those can never blank the matches list ("No matches yet"). ──────────
  let matchesData = []
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { console.error('Error fetching matches:', error); toast.error('Couldn’t load your matches — check your connection.') }
    matchesData = data || []
  } catch (e) {
    console.error('Matches query failed:', e)
    toast.error('Couldn’t load your matches — check your connection.')
  }

  // Render matches immediately (stats fill in once the detail queries return).
  matches.value = matchesData.map(m => ({
    ...m, my_goals: 0, shots_on_target: 0, shots_off_target: 0, goalkeeper_stats: null
  }))
  dataLoading.value = false

  // Profile (independent — never blocks or wipes matches).
  supabase.from('user_profiles')
    .select('player_name, position, preferred_foot, club_team')
    .eq('user_id', user.id).single()
    .then(({ data }) => {
      userName.value = data?.player_name || nameFallback
      userPosition.value = data?.position || ''
      userPreferredFoot.value = data?.preferred_foot || ''
      userClubTeam.value = data?.club_team || ''
    })
    .catch(() => { userName.value = nameFallback })

  // Onboarding focus chooses the default mode ('both' opens on Matches).
  // Fetched separately + failure-tolerant so a pre-migration DB (no
  // primary_focus column yet) can't break the profile load above.
  supabase.from('user_profiles')
    .select('primary_focus')
    .eq('user_id', user.id).single()
    .then(({ data, error }) => {
      if (error || !data?.primary_focus) return
      // Don't override the user's last-used mode on refresh — onboarding default
      // is only for first arrival, before any saved choice exists.
      if (savedModeRestored) return
      seedMode(data.primary_focus === 'training' ? 'training' : 'matches', 'explicit')
    })
    .catch(() => { /* column not present yet — ignore */ })

  // Heuristic fallback: a player with no matches starts in Training (the
  // lower-effort pillar). Weaker than an explicit choice, so a saved/onboarding
  // preference still wins whenever it resolves.
  if (matchesData.length === 0) seedMode('training', 'heuristic')

  if (matchesData.length === 0) return
  const matchIds = matchesData.map(m => m.id)
  const goalkeeperMatchIds = matchesData
    .filter(m => m.position_played && m.position_played.toLowerCase().includes('goalkeeper'))
    .map(m => m.id)

  // ── Enrichment — failures here leave the matches list intact. ──────────────
  // Every query is batched by match_id (selectByIds) so a player with hundreds
  // of matches can't overflow the request URL and silently lose their stats.
  try {
    const [goalsRes, shotsRes, heatmapRes, gkRes] = await Promise.all([
      selectByIds('goals', 'match_id, quadrant, field_position', matchIds),
      selectByIds('shots', 'match_id, on_target, quadrant, field_position', matchIds),
      selectByIds('match_heatmap_points', 'match_id, x_pct, y_pct, event_type, x2_pct, y2_pct', matchIds),
      selectByIds('goalkeeper_match_stats', '*', goalkeeperMatchIds)
    ])

    const goalsData = goalsRes.data || []
    const shotsData = shotsRes.data || []

    // Heatmap: retry without x2_pct/y2_pct if the DB is behind on migration 0016.
    let heatmapData = heatmapRes.data
    if (heatmapRes.error) {
      const retry = await selectByIds('match_heatmap_points', 'match_id, x_pct, y_pct, event_type', matchIds)
      heatmapData = retry.data
    }

    allShotsData.value = shotsData
    allGoalsData.value = goalsData
    allHeatmapData.value = heatmapData || []

    const goalkeeperStatsByMatch = (gkRes.data || []).reduce((acc, s) => { acc[s.match_id] = s; return acc }, {})
    const statsByMatch = shotsData.reduce((acc, shot) => {
      if (!acc[shot.match_id]) acc[shot.match_id] = { shots_on_target: 0, shots_off_target: 0 }
      if (shot.on_target) acc[shot.match_id].shots_on_target++
      else acc[shot.match_id].shots_off_target++
      return acc
    }, {})
    const goalsByMatch = goalsData.reduce((acc, g) => { acc[g.match_id] = (acc[g.match_id] || 0) + 1; return acc }, {})

    matches.value = matchesData.map(match => ({
      ...match,
      my_goals: goalsByMatch[match.id] || 0,
      shots_on_target: statsByMatch[match.id]?.shots_on_target || 0,
      shots_off_target: statsByMatch[match.id]?.shots_off_target || 0,
      goalkeeper_stats: goalkeeperStatsByMatch[match.id] || null,
    }))
  } catch (error) {
    console.error('Error loading match detail (matches still shown):', error)
  }
}
</script>

<style scoped>
.dashboard-page {
  position: relative;
  min-height: 100vh;
  background: var(--app-page-bg);
  padding: 30px 40px;
  /* A touch more clearance below the floating navbar so the hero sits lower. */
  padding-top: 128px;
  /* Reveal animations (scale/blur) and wide tiles can briefly extend past the
     viewport edge — clip horizontally so the page never scrolls sideways (which
     also kept the fixed bottom nav drifting on mobile). `clip` (not hidden)
     doesn't create a scroll container, so sticky/fixed children are unaffected. */
  overflow-x: clip;
}

/* ── Faint brand backdrop ─────────────────────────────────────────────
   A soft, slowly drifting aurora wash (home palette at low opacity) sits
   behind the whole dashboard. Fixed + heavily blurred so it reads as
   atmosphere, never competing with the data. */
.dash-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.dash-bg__aurora {
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(36% 44% at 14% 16%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%),
    radial-gradient(40% 48% at 88% 12%, color-mix(in srgb, #7c5cff 15%, transparent), transparent 72%),
    radial-gradient(46% 52% at 70% 104%, color-mix(in srgb, #19c6c0 13%, transparent), transparent 70%);
  filter: blur(38px);
  opacity: 0.4;
  animation: dash-drift 30s ease-in-out infinite alternate;
}

@keyframes dash-drift {
  from { transform: translate3d(-1.5%, -1%, 0) scale(1.02); }
  to   { transform: translate3d(1.5%, 1.5%, 0) scale(1.06); }
}

/* Content sits above the backdrop. */
.dashboard-hero-wrap,
.dashboard-container { position: relative; z-index: 1; }

/* Fill most of the screen — the navbar is a centred floating pill, but the
   dashboard is data-dense, so the content stretches wide and only leaves the
   page's ~40px gutter (it was capped narrow before, leaving a big right gap). */
.dashboard-container-inner {
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-hero-wrap {
  max-width: 1600px;
  margin: 0 auto 28px;
}

/* ── Editorial hero (home-page language) ──────────────────────────── */
.dash-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.dash-hero__title {
  margin: 0;
  font-family: var(--font-family-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.94;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  color: var(--color-text-primary);
}

.dash-hero__line { display: block; }

/* Outlined accent line — the player's name, stroked in brand green like the
   home hero's second headline line. */
.dash-hero__line--accent {
  color: transparent;
  -webkit-text-stroke: 1.6px var(--color-accent);
  text-stroke: 1.6px var(--color-accent);
}

/* ── Unified control bar ──────────────────────────────────────────
   Flat flex row; children are reordered per breakpoint via `order`.
   Desktop (one row): mode · | · tabs ……… season  Simple/Advanced. */
.control-bar {
  display: flex;
  align-items: center;
  gap: 16px 14px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.cb-mode   { order: 1; }
.control-bar__divider {
  order: 2;
  width: 1px;
  height: 26px;
  background: var(--color-border-subtle);
  flex: 0 0 auto;
}
.cb-tabs   { order: 3; min-width: 0; }
/* margin-left:auto pushes the view controls (season + toggle) to the right. */
.cb-season { order: 4; margin-left: auto; }
.cb-view   { order: 5; }

/* Simple ⇄ Advanced segmented toggle (moved here from the overview).
   Two equal halves with a sliding pill: gap MUST be 0 so the 50%-wide pill lines
   up under each button and the centred label sits on top of it. */
.overview-mode {
  position: relative;
  display: inline-flex;
  gap: 0;
  padding: 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  flex: 0 0 auto;
}

/* Sliding accent pill that travels between Simple and Advanced. */
.overview-mode::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-accent-border);
  transition: transform 0.42s cubic-bezier(0.5, 1.5, 0.4, 1);
  z-index: 0;
}
.overview-mode:has(.overview-mode__btn:last-of-type.is-active)::before {
  transform: translateX(100%);
}

.overview-mode__btn {
  position: relative;
  z-index: 1;
  /* Equal halves with centred labels (each button owns exactly 50%). */
  flex: 1 1 0;
  min-width: 92px;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 15px 36px;
  min-height: 54px;
  border-radius: var(--radius-pill);
  font-size: 1.0625rem;
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.25s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overview-mode__btn:active { transform: scale(0.93); }

.overview-mode__btn.is-active {
  color: var(--color-accent);
}

@media (hover: hover) {
  .overview-mode__btn:not(.is-active):hover {
    color: var(--color-text-secondary);
  }
}

/* Tablet + phone: the one-row bar can't fit mode · tabs · season · toggle below
   ~1024px, so stack it — row 1 = mode (full), row 2 = tabs + Simple/Advanced,
   row 3 = season. Covers everything from large tablets down to small phones. */
@media (max-width: 1023px) {
  .control-bar {
    gap: 12px 8px;
  }

  .control-bar__divider { display: none; }

  .cb-mode   { order: 1; flex: 1 0 100%; }
  /* Content-sized + stable: the switchers DON'T grow to fill, so switching tabs
     (which hides the Simple/Advanced toggle) never makes the tabs balloon. */
  .cb-tabs   { order: 2; flex: 0 1 auto; }
  .cb-view   { order: 3; flex: 0 1 auto; }
  /* Season sits at the right edge — when it wraps to its own row on small phones
     it stays flush right, so its right-anchored dropdown can't run off-screen. */
  .cb-season { order: 4; flex: 0 0 auto; margin-left: auto; }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 10px;
    padding-top: 34px;
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }

  .dash-hero {
    align-items: flex-start;
  }

  /* Tighter horizontal gap so tabs + toggle + season icon share row 2. */
  .control-bar { gap: 12px 6px; }

  /* Compact the tabs + toggle (tight horizontal footprint + smaller label so
     Overview/Matches, Simple/Advanced AND the season icon share row 2 down to
     ~390px phones). Both MUST use the same min-height/padding/font so the two
     switchers are identical in size. */
  .cb-tabs :deep(.scrollable-tabs__pill),
  .overview-mode__btn {
    padding: 15px 8px;
    min-height: 54px;
    /* Equal fixed min-width per pill: keeps both halves the same size (so the
       sliding indicator stays aligned) AND wide enough that the longest label
       ("Advanced") never clips. */
    min-width: 76px;
    font-size: var(--font-size-sm);
  }
}

/* Very narrow phones (≤374, e.g. small Androids): smaller label + min-width so
   the two switchers still fit one row without clipping. */
@media (max-width: 374px) {
  .cb-tabs :deep(.scrollable-tabs__pill),
  .overview-mode__btn {
    padding: 14px 6px;
    min-width: 60px;
    font-size: 0.8125rem;
  }
}
</style>
