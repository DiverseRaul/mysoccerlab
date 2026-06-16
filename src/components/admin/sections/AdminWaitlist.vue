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
      <p class="asec__count">{{ total }} sign-up{{ total === 1 ? '' : 's' }}</p>
      <AdminTable :columns="columns" :rows="rows" :loading="loading" empty-text="No sign-ups yet.">
        <template #cell-created_at="{ value }">{{ fmtDate(value) }}</template>
      </AdminTable>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWaitlist } from '../../../lib/adminApi'
import AdminTable from '../AdminTable.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const columns = [
  { key: 'email', label: 'Email' },
  { key: 'created_at', label: 'Joined' }
]

const rows = ref([])
const loading = ref(false)
const notDeployed = ref(false)
const total = computed(() => rows.value.length)

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const exportCsv = () => {
  const lines = [['email', 'created_at'], ...rows.value.map((r) => [r.email || '', r.created_at || ''])]
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
      { id: 1, email: 'coach@club.com', created_at: '2026-06-10T14:30:00Z' },
      { id: 2, email: 'scout@academy.org', created_at: '2026-06-08T09:15:00Z' }
    ]
    return
  }
  loading.value = true
  try { rows.value = await getWaitlist() }
  catch (e) { if (e.notDeployed) notDeployed.value = true }
  finally { loading.value = false }
})
</script>

<style scoped>
.asec__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.asec__title { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.asec__count { margin: 0 0 var(--space-4); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.asec__notice { padding: var(--space-4); background: var(--color-warning-bg); border: 1px solid rgba(255,183,77,0.35); border-radius: var(--radius-md); color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.asec__notice code { color: var(--color-warning); background: rgba(255,183,77,0.12); padding: 1px 5px; border-radius: 4px; }
</style>
