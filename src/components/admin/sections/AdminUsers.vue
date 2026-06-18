<template>
  <section class="asec">
    <h2 class="asec__title">Users</h2>

    <div v-if="notDeployed" class="asec__notice">
      <strong>Admin function not deployed.</strong> Deploy the <code>admin</code> edge function
      (<code>supabase functions deploy admin</code>) to manage users — no secret needed.
    </div>

    <template v-else>
      <div class="asec__toolbar">
        <input v-model="search" class="asec__search" type="text" placeholder="Search name, club, or email…" @keyup.enter="reload(0)" />
        <div class="asec__filters">
          <button v-for="f in filters" :key="f.value" type="button" class="asec__chip" :class="{ 'is-active': filter === f.value }" @click="filter = f.value; reload(0)">{{ f.label }}</button>
          <span class="asec__spacer"></span>
          <button type="button" class="btn btn-secondary btn-sm" :disabled="!rows.length || exporting" @click="exportCsv">{{ exporting ? 'Exporting…' : 'Export CSV' }}</button>
        </div>
      </div>

      <p v-if="toast" class="asec__toast" :class="`is-${toast.kind}`">{{ toast.msg }}</p>

      <!-- Bulk-action bar (shows when rows are selected) -->
      <div v-if="selected.size" class="asec__bulk">
        <span class="asec__bulk-count">{{ selected.size }} selected</span>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="bulk('pro')">Grant Pro</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="bulk('free')">Remove Pro</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="bulk('ban')">Ban</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="bulk('unban')">Unban</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="clearSelection">Clear</button>
      </div>

      <AdminTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        clickable
        empty-text="No users match."
        :page="page"
        :page-size="pageSize"
        :total="total"
        @row-click="openUser"
        @page="reload"
      >
        <template #cell-select="{ row }">
          <input
            type="checkbox"
            class="asec__check"
            :checked="selected.has(row.user_id)"
            @click.stop
            @change="toggleSelect(row.user_id)"
          />
        </template>
        <template #cell-player_name="{ row }">
          <div class="u-name">
            <strong>{{ row.player_name || 'Unnamed' }}</strong>
            <span class="u-email">{{ row.email || '—' }}</span>
          </div>
        </template>
        <template #cell-status="{ row }">
          <UserStatusBadges
            :is-admin="row.is_admin"
            :is-pro="row.subscription_tier === 'pro'"
            :banned="row.banned"
            :is-public="row.is_public"
            :early-access="row.early_access"
          />
        </template>
        <template #cell-created_at="{ value }">{{ fmtDate(value) }}</template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listUsers, setTier, banUser, unbanUser } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'
import UserStatusBadges from '../UserStatusBadges.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const router = useRouter()

const columns = [
  { key: 'select', label: '', width: '36px' },
  { key: 'player_name', label: 'User' },
  { key: 'club_team', label: 'Club' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Joined' }
]
const filters = [
  { value: 'all', label: 'All' },
  { value: 'pro', label: 'Pro' },
  { value: 'admin', label: 'Admins' },
  { value: 'banned', label: 'Banned' }
]

const rows = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const search = ref('')
const filter = ref('all')
const page = ref(0)
const pageSize = ref(25)
const total = ref(0)
const busy = ref(false)
const exporting = ref(false)
const toast = ref(null)
const selected = reactive(new Set())

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const flash = (msg, kind = 'ok') => { toast.value = { msg, kind }; setTimeout(() => { toast.value = null }, 3000) }

const toggleSelect = (id) => { selected.has(id) ? selected.delete(id) : selected.add(id) }
const clearSelection = () => selected.clear()

const reload = async (p = 0) => {
  page.value = p
  if (props.previewMode) return
  loading.value = true
  try {
    const data = await listUsers({ page: p, pageSize: pageSize.value, search: search.value.trim(), filter: filter.value })
    rows.value = data.rows
    total.value = data.total
  } catch (e) {
    if (e.notDeployed) notDeployed.value = true
  } finally {
    loading.value = false
  }
}

// Apply an action to every selected user via the existing single-user endpoints.
// Failures (e.g. you can't ban yourself) are counted, not fatal, so one bad row
// doesn't abort the batch.
const bulk = async (action) => {
  const ids = [...selected]
  if (!ids.length) return
  if (props.previewMode) { flash(`${action} applied to ${ids.length} (preview)`); clearSelection(); return }
  busy.value = true
  let ok = 0, fail = 0
  for (const id of ids) {
    try {
      if (action === 'pro') await setTier(id, 'pro', 'permanent')
      else if (action === 'free') await setTier(id, 'free')
      else if (action === 'ban') await banUser(id, 'permanent')
      else if (action === 'unban') await unbanUser(id)
      ok++
    } catch { fail++ }
  }
  busy.value = false
  clearSelection()
  flash(`${ok} updated${fail ? `, ${fail} failed` : ''}`, fail ? 'err' : 'ok')
  reload(page.value)
}

const exportCsv = async () => {
  exporting.value = true
  try {
    // Pull the full filtered set (not just the current page) for the export.
    let all = rows.value
    if (!props.previewMode) {
      const data = await listUsers({ page: 0, pageSize: 10000, search: search.value.trim(), filter: filter.value })
      all = data.rows || []
    }
    const status = (r) => [r.is_admin && 'admin', r.subscription_tier === 'pro' && 'pro', r.banned && 'banned', r.is_public && 'public'].filter(Boolean).join('|') || 'free'
    const lines = [
      ['name', 'email', 'club', 'tier', 'status', 'joined'],
      ...all.map((r) => [r.player_name || '', r.email || '', r.club_team || '', r.subscription_tier || 'free', status(r), r.created_at || ''])
    ]
    const csv = lines.map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { flash(e.message || 'Export failed', 'err') } finally { exporting.value = false }
}

const openUser = (row) => router.push(`/admin/users/${row.user_id}`)

onMounted(() => {
  if (props.previewMode) {
    rows.value = [
      { user_id: 'u1', player_name: 'Alex Striker', email: 'alex@demo.com', club_team: 'FC Demo', subscription_tier: 'pro', is_admin: true, banned: false, is_public: true, early_access: true, created_at: '2025-02-10' },
      { user_id: 'u2', player_name: 'Jordan Keeper', email: 'jordan@demo.com', club_team: 'United', subscription_tier: 'free', is_admin: false, banned: true, is_public: false, early_access: false, created_at: '2025-05-21' },
      { user_id: 'u3', player_name: 'Sam Winger', email: 'sam@demo.com', club_team: 'Rovers', subscription_tier: 'free', is_admin: false, banned: false, is_public: true, early_access: false, created_at: '2026-01-03' }
    ]
    total.value = 3
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
.asec__filters { display: flex; flex-wrap: wrap; gap: 6px; }
.asec__chip {
  padding: 6px 14px; border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle); background: var(--color-bg-surface-2);
  color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); font-family: inherit; cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.asec__chip.is-active { background: var(--color-accent-soft); color: var(--color-accent); border-color: var(--color-accent-border); }
.asec__spacer { flex: 1 1 auto; }

.asec__toast { margin: 0 0 var(--space-4); padding: 9px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.asec__toast.is-ok { background: var(--color-success-bg); color: var(--color-success); }
.asec__toast.is-err { background: rgba(239,83,80,0.12); color: var(--color-danger); }

.asec__bulk { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-accent-soft); border: 1px solid var(--color-accent-border); border-radius: var(--radius-md); }
.asec__bulk-count { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-accent); margin-right: var(--space-2); }
.asec__check { width: 17px; height: 17px; accent-color: var(--color-accent); cursor: pointer; }

.u-name { display: flex; flex-direction: column; }
.u-name strong { color: var(--color-text-primary); }
.u-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }
</style>
