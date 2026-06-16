<template>
  <BentoItem :delay="180" extra-class="bento-item--wide peer-pct-tile">
    <div class="pp">
      <header class="pp__head">
        <h3 class="pp__title">Peer Percentiles</h3>
        <span v-if="!showPro" class="pp__lock">PRO</span>
        <span v-else-if="position" class="pp__pos">vs {{ position }}s</span>
      </header>

      <!-- Free teaser -->
      <div v-if="!showPro" class="pp__teaser">
        <p>See how you stack up against every other player in your position — pass accuracy, goals, assists and more, as live percentiles.</p>
        <router-link to="/premium" class="btn btn-primary btn-sm">Unlock with Lab Pro</router-link>
      </div>

      <!-- Pro -->
      <template v-else>
        <p v-if="loading" class="pp__msg">Crunching the numbers…</p>
        <p v-else-if="errorMsg" class="pp__msg">{{ errorMsg }}</p>
        <p v-else-if="cohortSize < 3" class="pp__msg">Not enough players in your position yet — check back as the community grows.</p>
        <p v-else-if="!hasData" class="pp__msg">Log a few matches to see your percentiles.</p>
        <ul v-else class="pp__list">
          <li v-for="m in metrics" :key="m.key" class="pp__row">
            <div class="pp__row-top">
              <span class="pp__label">{{ m.label }}</span>
              <span class="pp__val">{{ fmt(m) }}<span v-if="m.percentile !== null" class="pp__pct">· top {{ 100 - m.percentile }}%</span></span>
            </div>
            <div class="pp__bar"><span class="pp__bar-fill" :style="{ width: (m.percentile ?? 0) + '%' }"></span></div>
          </li>
        </ul>
        <p v-if="showPro && cohortSize >= 3" class="pp__foot">Based on {{ cohortSize }} players in your position.</p>
      </template>
    </div>
  </BentoItem>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { isPro } from '../../../lib/premium'
import { supabase } from '../../../lib/supabase'
import BentoItem from './BentoItem.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const showPro = computed(() => props.previewMode || isPro.value)
const loading = ref(false)
const errorMsg = ref('')
const position = ref('')
const cohortSize = ref(0)
const hasData = ref(false)
const metrics = ref([])

const fmt = (m) => {
  if (m.value === null || m.value === undefined) return '—'
  return `${Number(m.value).toFixed(m.digits)}${m.unit}`
}

onMounted(async () => {
  if (props.previewMode) {
    position.value = 'Striker'
    cohortSize.value = 42
    hasData.value = true
    metrics.value = [
      { key: 'passAccuracy', label: 'Pass accuracy', unit: '%', digits: 1, value: 86.4, percentile: 78 },
      { key: 'goalsPerMatch', label: 'Goals / match', unit: '', digits: 2, value: 1.35, percentile: 91 },
      { key: 'assistsPerMatch', label: 'Assists / match', unit: '', digits: 2, value: 0.45, percentile: 63 },
      { key: 'defActionsPerMatch', label: 'Defensive actions / match', unit: '', digits: 1, value: 2.1, percentile: 34 }
    ]
    return
  }
  if (!showPro.value) return
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/peer-percentiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${session?.access_token}` }
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) { errorMsg.value = 'Percentiles are unavailable right now.'; return }
    position.value = body.data.position || ''
    cohortSize.value = body.data.cohortSize || 0
    hasData.value = !!body.data.hasData
    metrics.value = body.data.metrics || []
  } catch {
    errorMsg.value = 'Percentiles are unavailable right now.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pp { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
.pp__head { display: flex; align-items: center; gap: 10px; }
.pp__title { margin: 0; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.pp__lock { padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-warning-bg); color: var(--color-warning); font-size: 0.6rem; font-weight: var(--font-weight-heavy); letter-spacing: 0.06em; }
.pp__pos { margin-left: auto; font-size: var(--font-size-xs); color: var(--color-text-muted); }

.pp__teaser { display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
.pp__teaser p { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.55; }
.pp__msg { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }

.pp__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
.pp__row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.pp__label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.pp__val { font-weight: var(--font-weight-heavy); font-variant-numeric: tabular-nums; font-size: var(--font-size-sm); }
.pp__pct { margin-left: 6px; color: var(--color-accent); font-weight: var(--font-weight-semibold); }
.pp__bar { height: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.pp__bar-fill { display: block; height: 100%; border-radius: var(--radius-pill); background: linear-gradient(90deg, var(--color-accent), var(--color-brand-fg)); }
.pp__foot { margin: 0; font-size: var(--font-size-xs); color: var(--color-text-faint); }
</style>
