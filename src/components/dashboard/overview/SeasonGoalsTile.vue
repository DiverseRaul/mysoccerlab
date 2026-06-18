<template>
  <BentoItem :delay="120" extra-class="bento-item--wide season-goals-tile">
    <div class="sg">
      <header class="sg__head">
        <h3 class="sg__title">Season Goals</h3>
        <button v-if="!editing && hasSeason" type="button" class="sg__edit" @click="startEdit">{{ hasAnyTarget ? 'Edit goals' : 'Set goals' }}</button>
      </header>

      <!-- All-time: season goals are per-season, so there's nothing to set here. -->
      <p v-if="!hasSeason" class="sg__empty">Season goals are tracked per season. Pick a season at the top of the dashboard to set and track your targets.</p>

      <!-- Edit form -->
      <div v-else-if="editing" class="sg__form">
        <label class="sg__field"><span>Goals</span><input type="number" min="0" v-model.number="draft.goals_target" placeholder="e.g. 12" /></label>
        <label class="sg__field"><span>Assists</span><input type="number" min="0" v-model.number="draft.assists_target" placeholder="e.g. 8" /></label>
        <label class="sg__field"><span>Avg rating</span><input type="number" min="0" max="10" step="0.1" v-model.number="draft.rating_target" placeholder="e.g. 7.5" /></label>
        <div class="sg__form-actions">
          <button type="button" class="btn btn-primary btn-sm" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="editing = false">Cancel</button>
        </div>
      </div>

      <!-- Pacing rows -->
      <div v-else-if="hasAnyTarget" class="sg__rows">
        <div v-for="row in rows" :key="row.label" class="sg__row">
          <div class="sg__row-head">
            <span class="sg__row-label">{{ row.label }}</span>
            <span v-if="row.pace.state !== 'none' && row.pace.expected !== null" class="sg__pace" :class="`is-${row.pace.state}`">{{ paceLabel(row.pace.state) }}</span>
          </div>
          <div class="sg__row-body">
            <span class="sg__nums">
              <span class="sg__actual">{{ row.actualText }}</span>
              <span class="sg__target">/ {{ row.targetText }}</span>
            </span>
            <span class="sg__pct">{{ Math.round(Math.min(100, row.pace.pct)) }}%</span>
          </div>
          <div class="sg__bar">
            <span class="sg__bar-fill" :class="`is-${row.pace.state}`" :style="{ width: Math.min(100, row.pace.pct) + '%' }"></span>
            <span v-if="row.pace.expected !== null && row.targetNum > 0" class="sg__bar-pace" :style="{ left: Math.min(100, (row.pace.expected / row.targetNum) * 100) + '%' }" title="Where you should be by now"></span>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <p v-else class="sg__empty">Set a target for goals, assists or rating and a pacing bar will keep you honest all season.</p>
    </div>
  </BentoItem>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'
import { calculateMatchRating } from '../../../lib/rating'
import { loadGoals, saveGoals, computePacing } from '../../../lib/seasonGoals'
import BentoItem from './BentoItem.vue'

const props = defineProps({
  matches: { type: Array, default: () => [] },
  season: { type: Object, default: null },
  previewMode: { type: Boolean, default: false }
})

const targets = ref({ goals_target: null, assists_target: null, rating_target: null })
const draft = ref({ goals_target: null, assists_target: null, rating_target: null })
const editing = ref(false)
const saving = ref(false)
let userId = null

const actualGoals = computed(() => props.matches.reduce((s, m) => s + (m.my_goals || 0), 0))
const actualAssists = computed(() => props.matches.reduce((s, m) => s + (m.assists || 0), 0))
const actualRating = computed(() => {
  if (!props.matches.length) return 0
  const total = props.matches.reduce((s, m) => s + parseFloat(calculateMatchRating(m)), 0)
  return total / props.matches.length
})

// Season goals only make sense scoped to a real season — not the all-time view.
const hasSeason = computed(() => !!props.season?.id)

const hasAnyTarget = computed(() =>
  [targets.value.goals_target, targets.value.assists_target, targets.value.rating_target].some((t) => t > 0)
)

const rows = computed(() => {
  const out = []
  const t = targets.value
  if (t.goals_target > 0) out.push(buildRow('Goals', actualGoals.value, t.goals_target))
  if (t.assists_target > 0) out.push(buildRow('Assists', actualAssists.value, t.assists_target))
  if (t.rating_target > 0) out.push(buildRow('Avg rating', actualRating.value, t.rating_target, true))
  return out
})

function buildRow(label, actual, target, isRating = false) {
  const pace = computePacing(actual, target, props.season)
  return {
    label,
    actualNum: actual,
    targetNum: target,
    actualText: isRating ? actual.toFixed(1) : actual,
    targetText: isRating ? Number(target).toFixed(1) : target,
    pace
  }
}

const paceLabel = (state) => (state === 'ahead' ? 'On pace' : state === 'behind' ? 'Behind' : 'On track')

const startEdit = () => {
  if (!hasSeason.value) return
  draft.value = { ...targets.value }
  editing.value = true
}

const save = async () => {
  if (!hasSeason.value) return // per-season only; never persist against all-time
  saving.value = true
  targets.value = { ...draft.value }
  if (!props.previewMode && userId) {
    await saveGoals(userId, props.season.id, draft.value)
  }
  saving.value = false
  editing.value = false
}

// Load this season's saved targets. Re-runs whenever the selected season changes
// so switching seasons shows that season's goals (not stale ones from mount).
const reload = async () => {
  editing.value = false
  targets.value = { goals_target: null, assists_target: null, rating_target: null }
  if (props.previewMode) {
    targets.value = { goals_target: 12, assists_target: 8, rating_target: 7.5 }
    return
  }
  if (!userId || !hasSeason.value) return
  const g = await loadGoals(userId, props.season.id)
  if (g) targets.value = { goals_target: g.goals_target, assists_target: g.assists_target, rating_target: g.rating_target }
}

onMounted(async () => {
  if (!props.previewMode) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  }
  await reload()
})

watch(() => props.season?.id, () => { reload() })
</script>

<style scoped>
.sg { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
.sg__head { display: flex; align-items: center; justify-content: space-between; }
.sg__title { margin: 0; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.sg__edit { background: none; border: none; color: var(--color-accent); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); font-family: inherit; cursor: pointer; }

.sg__form { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: flex-end; }
.sg__field { display: flex; flex-direction: column; gap: 4px; flex: 1 1 90px; }
.sg__field span { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.sg__field input { width: 100%; }
.sg__form-actions { display: flex; gap: 8px; }

.sg__rows { display: flex; flex-direction: column; gap: var(--space-3); }
.sg__row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}
.sg__row-head { display: flex; align-items: center; justify-content: space-between; }
.sg__row-label { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); font-weight: var(--font-weight-bold); }
.sg__row-body { display: flex; align-items: baseline; justify-content: space-between; }
.sg__nums { display: inline-flex; align-items: baseline; gap: 5px; }
.sg__actual { font-size: 1.7rem; line-height: 1; font-weight: var(--font-weight-heavy); color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.sg__target { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.sg__pct { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-secondary); font-variant-numeric: tabular-nums; }

.sg__pace { padding: 3px 10px; border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); }
.sg__pace.is-ahead { background: var(--color-success-bg); color: var(--color-success); }
.sg__pace.is-onTrack { background: var(--color-info-bg); color: var(--color-info); }
.sg__pace.is-behind { background: var(--color-warning-bg); color: var(--color-warning); }

.sg__bar { position: relative; height: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: visible; }
.sg__bar-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: var(--radius-pill); background: var(--color-accent); transition: width 0.45s ease; }
.sg__bar-fill.is-ahead { background: var(--color-success); }
.sg__bar-fill.is-behind { background: var(--color-warning); }
.sg__bar-pace { position: absolute; top: -3px; width: 2px; height: 14px; background: var(--color-text-secondary); border-radius: 1px; transform: translateX(-1px); }

.sg__empty { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.5; }
</style>
