<template>
  <section class="asec">
    <h2 class="asec__title">Training &amp; practice</h2>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to browse practice data.
    </div>

    <!-- ── Drill list ─────────────────────────────────────────────────── -->
    <template v-else-if="!selectedDrill">
      <div class="asec__toolbar">
        <input v-model="search" class="asec__search" type="text" placeholder="Search drill or player…" @keyup.enter="reload(0)" />
        <div class="asec__filters">
          <label class="asec__toggle">
            <input v-model="includeTest" type="checkbox" @change="reload(0)" />
            <span>Show test accounts</span>
          </label>
        </div>
      </div>

      <AdminTable
        :columns="drillColumns" :rows="drills" :loading="loading" clickable
        empty-text="No drills created yet." :page="page" :page-size="pageSize" :total="total"
        @row-click="openDrill" @page="reload"
      >
        <template #cell-name="{ row }">
          <div class="d-name">
            <strong>{{ row.name }}</strong>
            <span class="d-type">{{ metricTypeLabel(row.metric_type) }}</span>
          </div>
        </template>
        <template #cell-player_name="{ row }">
          {{ row.player_name || 'Unnamed' }}
          <span v-if="row.owner_public" class="asec__pubdot" title="Public">●</span>
        </template>
        <template #cell-session_count="{ row }">{{ row.session_count }}</template>
        <template #cell-last_session_date="{ value }">{{ fmtDate(value) }}</template>
      </AdminTable>
    </template>

    <!-- ── Drill detail (sessions) ────────────────────────────────────── -->
    <template v-else>
      <button type="button" class="asec__back" @click="closeDrill">← All drills</button>

      <header class="dd__head">
        <div>
          <h3 class="dd__title">{{ selectedDrill.name }}</h3>
          <span class="dd__meta">
            {{ metricTypeLabel(selectedDrill.metric_type) }}
            · {{ selectedDrill.player_name || 'Unnamed' }}
            · {{ sessions.length }} session{{ sessions.length === 1 ? '' : 's' }}
          </span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" @click="confirmDrill = true">Delete drill</button>
      </header>

      <p v-if="toast" class="dd__toast" :class="`is-${toast.kind}`">{{ toast.msg }}</p>

      <AdminTable
        :columns="sessionColumns" :rows="sessions" :loading="sessionsLoading"
        empty-text="No sessions logged for this drill."
      >
        <template #cell-session_date="{ value }">{{ fmtDate(value) }}</template>
        <template #cell-value="{ row }">
          <span :class="{ 'dd-best': bestId === row.id }">{{ formatValue(row, selectedDrill) }}</span>
          <span v-if="bestId === row.id" class="dd-badge">PB</span>
        </template>
        <template #cell-notes="{ value }">{{ value || '—' }}</template>
        <template #cell-actions="{ row }">
          <button type="button" class="btn btn-ghost btn-sm" @click="removeSession(row)">Delete</button>
        </template>
      </AdminTable>

      <AdminConfirm
        :open="confirmDrill" title="Delete this drill?"
        :message="`This permanently removes “${selectedDrill.name}” and all ${sessions.length} of its sessions. This cannot be undone.`"
        confirm-text="DELETE" confirm-label="Delete drill"
        @confirm="removeDrill" @cancel="confirmDrill = false"
      />
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listDrills, listPractice, deleteSession, deleteDrill } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'
import AdminConfirm from '../AdminConfirm.vue'
import { formatValue, metricTypeLabel, personalBest } from '../../../lib/practiceFormat'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const drillColumns = [
  { key: 'name', label: 'Drill' },
  { key: 'player_name', label: 'Player' },
  { key: 'session_count', label: 'Sessions' },
  { key: 'last_session_date', label: 'Last logged' }
]
const sessionColumns = [
  { key: 'session_date', label: 'Date' },
  { key: 'value', label: 'Result' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: '' }
]

const drills = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const search = ref('')
const includeTest = ref(false)
const page = ref(0)
const pageSize = ref(25)
const total = ref(0)

const selectedDrill = ref(null)
const sessions = ref([])
const sessionsLoading = ref(false)
const bestId = ref(null)
const confirmDrill = ref(false)
const toast = ref(null)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const flash = (msg, kind = 'ok') => { toast.value = { msg, kind }; setTimeout(() => { toast.value = null }, 2600) }

const reload = async (p = 0) => {
  page.value = p
  if (props.previewMode) return
  loading.value = true
  try {
    const data = await listDrills({
      page: p,
      pageSize: pageSize.value,
      search: search.value.trim(),
      includeTest: includeTest.value
    })
    drills.value = data.rows; total.value = data.total
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally { loading.value = false }
}

const openDrill = async (drill) => {
  selectedDrill.value = drill
  sessions.value = []
  bestId.value = null
  if (props.previewMode) {
    sessions.value = [
      { id: 1, session_date: '2026-06-09', primary_value: 18, secondary_value: 24, notes: 'Sharp today' },
      { id: 2, session_date: '2026-06-02', primary_value: 12, secondary_value: 24, notes: '' }
    ]
    bestId.value = personalBest(sessions.value, drill)?.id ?? null
    return
  }
  sessionsLoading.value = true
  try {
    // includeTest:true — the drill was explicitly chosen, so never re-hide it.
    const data = await listPractice({ drillId: drill.id, pageSize: 500, includeTest: true })
    sessions.value = data.sessions || []
    bestId.value = personalBest(sessions.value, drill)?.id ?? null
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally { sessionsLoading.value = false }
}

const closeDrill = () => { selectedDrill.value = null }

const removeSession = async (row) => {
  if (props.previewMode) { sessions.value = sessions.value.filter((s) => s.id !== row.id); return }
  try {
    await deleteSession(row.id)
    sessions.value = sessions.value.filter((s) => s.id !== row.id)
    bestId.value = personalBest(sessions.value, selectedDrill.value)?.id ?? null
    flash('Session deleted')
  } catch (e) { flash(e.message, 'err') }
}

const removeDrill = async () => {
  confirmDrill.value = false
  if (props.previewMode) { closeDrill(); reload(page.value); return }
  try {
    await deleteDrill(selectedDrill.value.id)
    closeDrill()
    reload(page.value)
  } catch (e) { flash(e.message, 'err') }
}

onMounted(() => {
  if (props.previewMode) {
    drills.value = [
      { id: 'd1', name: 'Finishing reps', metric_type: 'shot_map', player_name: 'Alex Striker', owner_public: true, session_count: 6, last_session_date: '2026-06-09' },
      { id: 'd2', name: 'Sprint 40m', metric_type: 'time', player_name: 'Sam Winger', owner_public: false, session_count: 3, last_session_date: '2026-06-06' }
    ]
    total.value = 2
    return
  }
  reload(0)
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__notice { padding: var(--space-4); background: var(--color-warning-bg); border: 1px solid rgba(255,183,77,0.35); border-radius: var(--radius-md); color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }

.asec__toolbar { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
.asec__search {
  width: 100%; box-sizing: border-box; padding: 11px 14px;
  background: var(--color-bg-field); border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md); color: var(--color-text-primary); font-family: inherit; font-size: var(--font-size-base);
}
.asec__search:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.asec__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.asec__toggle { display: inline-flex; align-items: center; gap: 8px; color: var(--color-text-secondary); font-size: var(--font-size-sm); cursor: pointer; }
.asec__toggle input { width: 16px; height: 16px; accent-color: var(--color-accent); }
.asec__pubdot { color: var(--color-accent); font-size: 0.6rem; vertical-align: middle; }

.d-name { display: flex; flex-direction: column; }
.d-name strong { color: var(--color-text-primary); }
.d-type { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.asec__back { display: inline-block; margin-bottom: var(--space-4); background: none; border: none; padding: 0; cursor: pointer; color: var(--color-text-muted); font-size: var(--font-size-sm); font-family: inherit; }
.asec__back:hover { color: var(--color-accent); }
.dd__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.dd__title { margin: 0 0 4px; font-size: var(--font-size-md); font-weight: var(--font-weight-heavy); }
.dd__meta { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.dd__toast { margin: 0 0 var(--space-4); padding: 9px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.dd__toast.is-ok { background: var(--color-success-bg); color: var(--color-success); }
.dd__toast.is-err { background: rgba(239,83,80,0.12); color: var(--color-danger); }
.dd-best { color: var(--color-accent); font-weight: var(--font-weight-semibold); }
.dd-badge { margin-left: 6px; font-size: 0.6rem; font-weight: var(--font-weight-bold); color: var(--color-accent); border: 1px solid var(--color-accent-border); border-radius: var(--radius-pill); padding: 1px 6px; vertical-align: middle; }
</style>
