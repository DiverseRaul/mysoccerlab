<template>
  <section class="asec">
    <h2 class="asec__title">Training &amp; practice</h2>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to browse practice data.
    </div>

    <template v-else>
      <div class="asec__toolbar">
        <input v-model="search" class="asec__search" type="text" placeholder="Search player or notes…" @keyup.enter="reload(0)" />
        
        <select v-model="drillFilter" class="asec__filter" @change="reload(0)">
          <option value="all">All drills</option>
          <option v-for="drill in drills" :key="drill.id" :value="drill.id">{{ drill.name }}</option>
        </select>
      </div>

      <AdminTable
        :columns="columns" :rows="sessions" :loading="loading"
        empty-text="No practice sessions logged." :page="page" :page-size="pageSize" :total="total"
        @page="reload"
      >
        <template #cell-session_date="{ value }">{{ fmtDate(value) }}</template>
        <template #cell-player_name="{ row }">
          {{ row.player_name || 'Unnamed' }}
          <span v-if="row.owner_public" class="asec__pubdot" title="Public">●</span>
        </template>
        <template #cell-drill="{ row }">{{ drillName(row.drill_id) }}</template>
        <template #cell-value="{ row }">
          {{ row.primary_value }}<span v-if="row.secondary_value != null"> / {{ row.secondary_value }}</span>
        </template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listPractice } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const columns = [
  { key: 'session_date', label: 'Date' },
  { key: 'player_name', label: 'Player' },
  { key: 'drill', label: 'Drill' },
  { key: 'value', label: 'Result' },
  { key: 'notes', label: 'Notes' }
]

const sessions = ref([])
const drills = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const search = ref('')
const drillFilter = ref('all')
const page = ref(0)
const pageSize = ref(25)
const total = ref(0)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const drillName = (id) => drills.value.find((d) => d.id === id)?.name || '—'

const reload = async (p = 0) => {
  page.value = p
  if (props.previewMode) return
  loading.value = true
  try {
    const data = await listPractice({
      page: p,
      pageSize: pageSize.value,
      search: search.value.trim(),
      drillId: drillFilter.value
    })
    sessions.value = data.sessions; drills.value = data.drills; total.value = data.total
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally { loading.value = false }
}

onMounted(() => {
  if (props.previewMode) {
    drills.value = [{ id: 'd1', name: 'Finishing reps' }, { id: 'd2', name: 'Sprint 40m' }]
    sessions.value = [
      { id: 's1', session_date: '2026-06-09', drill_id: 'd1', primary_value: 18, secondary_value: 24, notes: 'Sharp today', player_name: 'Alex Striker', owner_public: true },
      { id: 's2', session_date: '2026-06-06', drill_id: 'd2', primary_value: 5.1, secondary_value: null, notes: '', player_name: 'Sam Winger', owner_public: false }
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

.asec__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.asec__search, .asec__filter {
  box-sizing: border-box; padding: 11px 14px;
  background: var(--color-bg-field); border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md); color: var(--color-text-primary); font-family: inherit; font-size: var(--font-size-base);
}
.asec__search { flex: 1 1 200px; }
.asec__filter { flex: 0 1 180px; cursor: pointer; }
.asec__search:focus, .asec__filter:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.asec__pubdot { color: var(--color-accent); font-size: 0.6rem; vertical-align: middle; }
</style>
