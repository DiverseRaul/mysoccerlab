<template>
  <section class="asec">
    <header class="asec__head">
      <h2 class="asec__title">Waitlist</h2>
      <button v-if="rows.length" type="button" class="btn btn-secondary btn-sm" @click="exportCsv">Export CSV</button>
    </header>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to see waitlist sign-ups.
    </div>

    <template v-else>
      <p class="asec__count">{{ total }} sign-up{{ total === 1 ? '' : 's' }} waiting on Premium</p>

      <p v-if="toast" class="asec__toast" :class="`is-${toast.kind}`">{{ toast.msg }}</p>

      <AdminTable :columns="columns" :rows="rows" :loading="loading" empty-text="No sign-ups yet.">
        <template #cell-player_name="{ row }">
          <div class="w-name">
            <strong>{{ row.player_name || 'Unnamed' }}</strong>
            <span class="w-email">{{ row.email || '—' }}</span>
          </div>
        </template>
        <template #cell-is_pro="{ row }">
          <span class="w-tag" :class="row.is_pro ? 'is-pro' : 'is-wait'">{{ row.is_pro ? 'Now Pro' : 'Waiting' }}</span>
        </template>
        <template #cell-created_at="{ value }">{{ fmtDate(value) }}</template>
        <template #cell-actions="{ row }">
          <button type="button" class="btn btn-ghost btn-sm" @click="remove(row)">Remove</button>
        </template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWaitlist, deleteWaitlist } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const columns = [
  { key: 'player_name', label: 'Player' },
  { key: 'is_pro', label: 'Status' },
  { key: 'created_at', label: 'Joined' },
  { key: 'actions', label: '' }
]

const rows = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const toast = ref(null)
const total = computed(() => rows.value.length)

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const flash = (msg, kind = 'ok') => { toast.value = { msg, kind }; setTimeout(() => { toast.value = null }, 2600) }

const load = async () => {
  loading.value = true
  try { rows.value = await getWaitlist() }
  catch (e) { if (e.notDeployed) notDeployed.value = true }
  finally { loading.value = false }
}

const remove = async (row) => {
  if (props.previewMode) { rows.value = rows.value.filter((r) => r.id !== row.id); return }
  try {
    await deleteWaitlist(row.id)
    rows.value = rows.value.filter((r) => r.id !== row.id)
    flash('Removed from waitlist')
  } catch (e) { flash(e.message, 'err') }
}

const exportCsv = () => {
  const lines = [['player', 'email', 'status', 'created_at'], ...rows.value.map((r) => [r.player_name || '', r.email || '', r.is_pro ? 'pro' : 'waiting', r.created_at || ''])]
  const csv = lines.map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'waitlist.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  if (props.previewMode) {
    rows.value = [
      { id: 1, player_name: 'Alex Striker', email: 'coach@club.com', is_pro: false, created_at: '2026-06-10T14:30:00Z' },
      { id: 2, player_name: 'Sam Winger', email: 'scout@academy.org', is_pro: true, created_at: '2026-06-08T09:15:00Z' }
    ]
    return
  }
  load()
})
</script>

<style scoped>
.asec__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.asec__title { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__count { margin: 0 0 var(--space-4); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.asec__notice { padding: var(--space-4); background: var(--color-warning-bg); border: 1px solid rgba(255,183,77,0.35); border-radius: var(--radius-md); color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }
.asec__toast { margin: 0 0 var(--space-4); padding: 9px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.asec__toast.is-ok { background: var(--color-success-bg); color: var(--color-success); }
.asec__toast.is-err { background: rgba(239,83,80,0.12); color: var(--color-danger); }

.w-name { display: flex; flex-direction: column; }
.w-name strong { color: var(--color-text-primary); }
.w-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.w-tag { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); padding: 2px 9px; border-radius: var(--radius-pill); }
.w-tag.is-pro { background: var(--color-success-bg); color: var(--color-success); }
.w-tag.is-wait { background: var(--color-bg-surface-2); color: var(--color-text-muted); }
</style>
