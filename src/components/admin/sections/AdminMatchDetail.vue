<template>
  <section class="asec">
    <router-link to="/admin/matches" class="asec__back">← All matches</router-link>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to edit matches.
    </div>

    <template v-else-if="match">
      <header class="md__head">
        <h2 class="asec__title">vs {{ match.opponent || 'Unknown' }}</h2>
        <span class="md__meta">{{ fmtDate(match.match_date) }} · {{ goalCount }} goals / {{ shotCount }} shots logged</span>
      </header>

      <p v-if="toast" class="md__toast" :class="`is-${toast.kind}`">{{ toast.msg }}</p>

      <div class="md__grid">
        <AdminField v-model="form.opponent" label="Opponent" />
        <AdminField v-model="form.match_date" label="Date" type="date" />
        <AdminField v-model="form.position_played" label="Position played" />
        <AdminField v-model="form.score_for" label="Score for" type="number" />
        <AdminField v-model="form.score_against" label="Score against" type="number" />
        <AdminField v-model="form.assists" label="Assists" type="number" />
        <AdminField v-model="form.tackles" label="Tackles" type="number" />
        <AdminField v-model="form.interceptions" label="Interceptions" type="number" />
        <AdminField v-model="form.clearances" label="Clearances" type="number" />
        <AdminField v-model="form.dribbles" label="Dribbles" type="number" />
        <AdminField v-model="form.successful_passes" label="Successful passes" type="number" />
        <AdminField v-model="form.unsuccessful_passes" label="Unsuccessful passes" type="number" />
        <AdminField v-model="form.fouls" label="Fouls" type="number" />
        <AdminField v-model="form.own_goals" label="Own goals" type="number" />
        <AdminField v-model="form.penalties_conceded" label="Penalties conceded" type="number" />
      </div>

      <div class="md__actions">
        <button type="button" class="btn btn-danger" :disabled="busy" @click="confirmOpen = true">Delete match</button>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="save">Save stats</button>
      </div>

      <p class="md__hint">Editing aggregates changes the auto-computed rating; switching position can swap the goalkeeper/outfield formula.</p>
    </template>

    <div v-else class="asec__loading">Loading…</div>

    <AdminConfirm
      :open="confirmOpen" title="Delete this match?"
      message="This permanently removes the match and its goals, shots, and heatmap points. This cannot be undone."
      confirm-text="DELETE" confirm-label="Delete match"
      @confirm="doDelete" @cancel="confirmOpen = false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMatch, updateMatchStats, deleteMatch } from '../../../lib/adminApi'
import AdminField from '../AdminField.vue'
import AdminConfirm from '../AdminConfirm.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const route = useRoute()
const router = useRouter()
const matchId = computed(() => route.params.id)

const MATCH_COLS = ['opponent', 'match_date', 'score_for', 'score_against', 'position_played', 'assists', 'tackles', 'interceptions', 'clearances', 'dribbles', 'successful_passes', 'unsuccessful_passes', 'fouls', 'own_goals', 'penalties_conceded']

const match = ref(null)
const goalCount = ref(0)
const shotCount = ref(0)
const form = ref({})
const busy = ref(false)
const notDeployed = ref(false)
const toast = ref(null)
const confirmOpen = ref(false)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const flash = (msg, kind = 'ok') => { toast.value = { msg, kind }; setTimeout(() => { toast.value = null }, 2600) }

const buildForm = () => {
  const m = match.value || {}
  const f = {}
  MATCH_COLS.forEach((k) => { f[k] = m[k] ?? (k === 'opponent' || k === 'match_date' || k === 'position_played' ? '' : 0) })
  form.value = f
}

const load = async () => {
  if (props.previewMode) {
    match.value = { id: 'm1', opponent: 'Rivals FC', match_date: '2026-06-02', position_played: 'Striker', score_for: 3, score_against: 1, assists: 1, tackles: 2, interceptions: 1, clearances: 0, dribbles: 4, successful_passes: 31, unsuccessful_passes: 6, fouls: 1, own_goals: 0, penalties_conceded: 0 }
    goalCount.value = 2; shotCount.value = 5
    buildForm()
    return
  }
  try {
    const data = await getMatch(matchId.value)
    match.value = data.match
    goalCount.value = (data.goals || []).length
    shotCount.value = (data.shots || []).length
    buildForm()
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
    else flash(e.message, 'err')
  }
}

const save = async () => {
  if (props.previewMode) { flash('Saved (preview)'); return }
  busy.value = true
  try { await updateMatchStats(matchId.value, form.value); flash('Match stats saved'); await load() }
  catch (e) { flash(e.message, 'err') } finally { busy.value = false }
}

const doDelete = async () => {
  confirmOpen.value = false
  if (props.previewMode) { flash('Deleted (preview)'); return }
  busy.value = true
  try { await deleteMatch(matchId.value); router.push('/admin/matches') }
  catch (e) { flash(e.message, 'err'); busy.value = false }
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

.md__head { margin-bottom: var(--space-4); }
.md__meta { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.md__toast { margin: 0 0 var(--space-4); padding: 9px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.md__toast.is-ok { background: var(--color-success-bg); color: var(--color-success); }
.md__toast.is-err { background: rgba(239,83,80,0.12); color: var(--color-danger); }

.md__grid { display: grid; grid-template-columns: 1fr; gap: 0 var(--space-4); }
.md__actions { display: flex; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-3); }
.md__hint { margin: var(--space-3) 0 0; color: var(--color-text-faint); font-size: var(--font-size-xs); line-height: 1.5; }

@media (min-width: 620px) {
  .md__grid { grid-template-columns: 1fr 1fr 1fr; }
}
</style>
