<template>
  <section class="asec">
    <h2 class="asec__title">Matches</h2>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to browse matches.
    </div>

    <template v-else>
      <div class="asec__toolbar">
        <input v-model="search" class="asec__search" type="text" placeholder="Search opponent or player…" @keyup.enter="reload(0)" />
        <div class="asec__filters">
          <select v-model="positionFilter" class="asec__filter" @change="reload(0)">
            <option value="all">All positions</option>
            <option v-for="pos in POSITIONS" :key="pos" :value="pos">{{ pos }}</option>
          </select>
          <label class="asec__toggle">
            <input v-model="onlyPosts" type="checkbox" @change="reload(0)" />
            <span>Public posts only</span>
          </label>
          <label class="asec__toggle">
            <input v-model="includeTest" type="checkbox" @change="reload(0)" />
            <span>Show test accounts</span>
          </label>
        </div>
      </div>

      <AdminTable
        :columns="columns" :rows="rows" :loading="loading" clickable
        empty-text="No matches." :page="page" :page-size="pageSize" :total="total"
        @row-click="(m) => $router.push(`/admin/matches/${m.id}`)" @page="reload"
      >
        <template #cell-match_date="{ value }">{{ fmtDate(value) }}</template>
        <template #cell-player_name="{ row }">
          {{ row.player_name || 'Unnamed' }}
          <span v-if="row.owner_public" class="asec__pubdot" title="Public">●</span>
        </template>
        <template #cell-score="{ row }">{{ row.score_for }}–{{ row.score_against }}</template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listMatches } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const POSITIONS = [
  "Goalkeeper", "Center-Back", "Full-Back", "Wing-Back", "Defensive Midfielder",
  "Central Midfielder", "Attacking Midfielder", "Winger", "Striker", "Center-Forward",
]

const columns = [
  { key: 'match_date', label: 'Date' },
  { key: 'player_name', label: 'Player' },
  { key: 'opponent', label: 'Opponent' },
  { key: 'score', label: 'Score' },
  { key: 'position_played', label: 'Position' }
]

const rows = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const search = ref('')
const positionFilter = ref('all')
const onlyPosts = ref(false)
const includeTest = ref(false)
const page = ref(0)
const pageSize = ref(25)
const total = ref(0)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const reload = async (p = 0) => {
  page.value = p
  if (props.previewMode) return
  loading.value = true
  try {
    const data = await listMatches({
      page: p,
      pageSize: pageSize.value,
      search: search.value.trim(),
      position: positionFilter.value,
      onlyPosts: onlyPosts.value,
      includeTest: includeTest.value
    })
    rows.value = data.rows; total.value = data.total
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally { loading.value = false }
}

onMounted(() => {
  if (props.previewMode) {
    rows.value = [
      { id: 'm1', match_date: '2026-06-02', player_name: 'Alex Striker', opponent: 'Rivals FC', score_for: 3, score_against: 1, position_played: 'Striker', owner_public: true },
      { id: 'm2', match_date: '2026-05-28', player_name: 'Sam Winger', opponent: 'City B', score_for: 0, score_against: 2, position_played: 'Winger', owner_public: false }
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
.asec__search, .asec__filter {
  box-sizing: border-box; padding: 11px 14px;
  background: var(--color-bg-field); border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md); color: var(--color-text-primary); font-family: inherit; font-size: var(--font-size-base);
}
.asec__search { width: 100%; }
.asec__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.asec__filter { flex: 0 1 180px; cursor: pointer; }
.asec__search:focus, .asec__filter:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.asec__toggle { display: inline-flex; align-items: center; gap: 8px; color: var(--color-text-secondary); font-size: var(--font-size-sm); cursor: pointer; }
.asec__toggle input { width: 16px; height: 16px; accent-color: var(--color-accent); }
.asec__pubdot { color: var(--color-accent); font-size: 0.6rem; vertical-align: middle; }
</style>
