<template>
  <section class="asec">
    <h2 class="asec__title">Audit log</h2>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function to see the audit trail.
    </div>

    <template v-else>
      <p class="asec__hint">Every privileged admin action is recorded here.</p>
      <AdminTable
        :columns="columns" :rows="rows" :loading="loading"
        empty-text="No admin actions recorded yet." :page="page" :page-size="pageSize" :total="total"
        @page="reload"
      >
        <template #cell-admin_name="{ row }"><span class="al-admin">{{ row.admin_name || '—' }}</span></template>
        <template #cell-action="{ value }"><span class="al-action">{{ pretty(value) }}</span></template>
        <template #cell-target_name="{ row }">{{ row.target_name || (row.target_user_id ? String(row.target_user_id).slice(0, 8) + '…' : '—') }}</template>
        <template #cell-detail="{ row }"><code class="al-detail">{{ summarize(row.detail) }}</code></template>
        <template #cell-created_at="{ value }">{{ fmtDate(value) }}</template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuditLog } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const columns = [
  { key: 'created_at', label: 'When' },
  { key: 'admin_name', label: 'Admin' },
  { key: 'action', label: 'Action' },
  { key: 'target_name', label: 'Target' },
  { key: 'detail', label: 'Detail' }
]

const rows = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const page = ref(0)
const pageSize = ref(50)
const total = ref(0)

const LABELS = {
  setTier: 'Set tier', banUser: 'Ban user', unbanUser: 'Unban user', toggleAdmin: 'Toggle admin',
  updateProfile: 'Edit profile', updateMatchStats: 'Edit match', deleteMatch: 'Delete match'
}
const pretty = (a) => LABELS[a] || a
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtVal = (v) => (v === null || v === undefined || v === '') ? '∅' : String(v)
const summarize = (detail) => {
  if (!detail || typeof detail !== 'object') return ''
  // New shape: { changes: { field: { from, to } } } → "field: a → b".
  if (detail.changes && typeof detail.changes === 'object') {
    const parts = Object.entries(detail.changes).map(([k, v]) =>
      v && typeof v === 'object' && 'to' in v ? `${k}: ${fmtVal(v.from)} → ${fmtVal(v.to)}` : `${k}: ${fmtVal(v)}`)
    return parts.length ? parts.join(' · ') : 'no change'
  }
  // Legacy shapes still in the log.
  if (Array.isArray(detail.keys)) return detail.keys.join(', ')
  return Object.entries(detail).map(([k, v]) => `${k}: ${fmtVal(v)}`).join(', ')
}

const reload = async (p = 0) => {
  page.value = p
  if (props.previewMode) return
  loading.value = true
  try {
    const data = await getAuditLog({ page: p, pageSize: pageSize.value })
    rows.value = data.rows; total.value = data.total
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally { loading.value = false }
}

onMounted(() => {
  if (props.previewMode) {
    rows.value = [
      { id: 3, created_at: '2026-06-12T10:02:00Z', admin_name: 'You', action: 'setTier', target_user_id: 'u2abc1234', target_name: 'Jordan Keeper', detail: { tier: 'pro', duration: '1w' } },
      { id: 2, created_at: '2026-06-11T16:40:00Z', admin_name: 'You', action: 'banUser', target_user_id: 'u3def5678', target_name: 'Sam Winger', detail: { duration: 'permanent' } },
      { id: 1, created_at: '2026-06-10T09:11:00Z', admin_name: 'You', action: 'updateProfile', target_user_id: 'u1aaa0001', target_name: 'Alex Striker', detail: { changes: { player_name: { from: 'Alex', to: 'Alex Striker' }, club_team: { from: null, to: 'FC Demo' } } } }
    ]
    total.value = 3
    return
  }
  reload(0)
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-3); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__hint { margin: 0 0 var(--space-4); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.asec__notice { padding: var(--space-4); background: var(--color-warning-bg); border: 1px solid rgba(255,183,77,0.35); border-radius: var(--radius-md); color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }
.al-admin { color: var(--color-text-secondary); font-weight: var(--font-weight-semibold); }
.al-action { font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.al-detail { font-size: var(--font-size-xs); color: var(--color-text-muted); }
</style>
