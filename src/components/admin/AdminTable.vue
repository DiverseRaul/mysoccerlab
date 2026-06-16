<template>
  <div class="atable">
    <div class="atable__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" :style="c.width ? { width: c.width } : null">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="columns.length" class="atable__msg">Loading…</td></tr>
          <tr v-else-if="!rows.length"><td :colspan="columns.length" class="atable__msg">{{ emptyText }}</td></tr>
          <tr
            v-for="(row, i) in rows"
            v-else
            :key="row.id ?? row.user_id ?? i"
            :class="{ 'is-clickable': clickable }"
            @click="clickable && $emit('row-click', row)"
          >
            <td v-for="c in columns" :key="c.key" :data-label="c.label">
              <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">
                {{ c.format ? c.format(row[c.key], row) : (row[c.key] ?? '—') }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="atable__pager">
      <button type="button" class="btn btn-ghost btn-sm" :disabled="page === 0" @click="$emit('page', page - 1)">Prev</button>
      <span class="atable__range">{{ rangeText }}</span>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="(page + 1) * pageSize >= total" @click="$emit('page', page + 1)">Next</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, format?, width? }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nothing here yet.' },
  page: { type: Number, default: 0 },
  pageSize: { type: Number, default: 25 },
  total: { type: Number, default: 0 }
})
defineEmits(['row-click', 'page'])

const rangeText = computed(() => {
  const from = props.page * props.pageSize + 1
  const to = Math.min(props.total, (props.page + 1) * props.pageSize)
  return `${from}–${to} of ${props.total}`
})
</script>

<style scoped>
.atable__scroll { overflow-x: auto; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
thead th {
  text-align: left;
  padding: 10px 14px;
  background: var(--color-bg-surface-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border-subtle);
}
tbody td { padding: 11px 14px; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border-subtle); vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr.is-clickable { cursor: pointer; transition: background 0.15s ease; }
tbody tr.is-clickable:hover { background: var(--color-bg-surface-2); }
.atable__msg { text-align: center; color: var(--color-text-muted); padding: var(--space-6) !important; }

.atable__pager { display: flex; align-items: center; justify-content: center; gap: var(--space-4); margin-top: var(--space-4); }
.atable__range { font-size: var(--font-size-sm); color: var(--color-text-muted); font-variant-numeric: tabular-nums; }

@media (max-width: 600px) {
  thead { display: none; }
  table, tbody, tr, td { display: block; width: 100%; }
  tbody tr { border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); margin-bottom: 10px; }
  tbody td { border: none; display: flex; justify-content: space-between; gap: 12px; padding: 8px 14px; }
  tbody td::before { content: attr(data-label); color: var(--color-text-faint); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.04em; }
}
</style>
