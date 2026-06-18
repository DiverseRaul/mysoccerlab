<template>
  <div class="sa" data-testid="shot-analytics">
    <!-- Headline accuracy + outcome breakdown -->
    <div class="sa__top">
      <div class="sa__acc">
        <span class="sa__acc-val">{{ overall.accuracy }}%</span>
        <span class="sa__acc-lbl">Accuracy</span>
        <span class="sa__acc-sub">{{ overall.goals }} / {{ overall.attempts }} attempts</span>
      </div>
      <div class="sa__chips">
        <span class="sa__chip sa__chip--goal">Goals {{ counts.goal }}</span>
        <span class="sa__chip sa__chip--post">Posts {{ counts.post }}</span>
        <span class="sa__chip sa__chip--miss">Misses {{ counts.miss }}</span>
        <span v-if="counts.save > 0" class="sa__chip sa__chip--save">Saves {{ counts.save }}</span>
      </div>
    </div>

    <!-- By foot -->
    <div v-if="hasFootData" class="sa__block">
      <h4 class="sa__h">By foot</h4>
      <div class="sa__feet">
        <div v-for="f in feet" :key="f.key" class="sa__foot">
          <div class="sa__foot-head">
            <span>{{ f.label }}</span>
            <span class="sa__foot-acc">{{ f.acc }}%</span>
          </div>
          <div class="sa__bar"><span class="sa__bar-fill" :style="{ width: f.acc + '%' }"></span></div>
          <span class="sa__foot-sub">{{ f.goals }} / {{ f.attempts }}</span>
        </div>
      </div>
    </div>

    <!-- Where you score (zones) -->
    <div v-if="overall.goals > 0" class="sa__block">
      <h4 class="sa__h">Where you score</h4>
      <div class="sa__zones" role="img" aria-label="Goal split into six zones showing where goals were scored">
        <div
          v-for="z in zones"
          :key="z.key"
          class="sa__zone"
          :style="{ background: zoneShade(z.goals) }"
        >
          <span class="sa__zone-n">{{ z.goals }}</span>
        </div>
      </div>
      <p class="sa__hint">Goals by area of the goal mouth · brighter = more goals</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ x_pct, y_pct, outcome: 'goal'|'save'|'post'|'miss', foot: 'left'|'right'|null }]
  placements: { type: Array, default: () => [] }
})

// Net bounds inside the goal frame (kept in sync with PracticeGoalMap NET).
const NET = { x1: 18, x2: 82, y1: 31, y2: 98 }

const counts = computed(() => {
  const c = { goal: 0, save: 0, post: 0, miss: 0 }
  for (const p of props.placements) if (c[p.outcome] !== undefined) c[p.outcome]++
  return c
})

// Shooter attempts exclude GK saves.
const overall = computed(() => {
  const goals = counts.value.goal
  const attempts = counts.value.goal + counts.value.post + counts.value.miss
  return { goals, attempts, accuracy: attempts ? Math.round((goals / attempts) * 100) : 0 }
})

const footAcc = (foot) => {
  const att = props.placements.filter(p => p.foot === foot && ['goal', 'post', 'miss'].includes(p.outcome))
  const goals = att.filter(p => p.outcome === 'goal').length
  return { attempts: att.length, goals, acc: att.length ? Math.round((goals / att.length) * 100) : 0 }
}
const hasFootData = computed(() => props.placements.some(p => p.foot === 'left' || p.foot === 'right'))
const feet = computed(() => [
  { key: 'left', label: 'Left', ...footAcc('left') },
  { key: 'right', label: 'Right', ...footAcc('right') }
])

// 6 zones: 3 columns (L/C/R) × 2 rows (high/low) over the goal mouth.
const zones = computed(() => {
  const cells = Array.from({ length: 6 }, (_, i) => ({ key: i, goals: 0 }))
  const colW = (NET.x2 - NET.x1) / 3
  const midY = (NET.y1 + NET.y2) / 2
  for (const p of props.placements) {
    if (p.outcome !== 'goal') continue
    const x = Number(p.x_pct), y = Number(p.y_pct)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    let col = Math.floor((x - NET.x1) / colW)
    col = Math.min(2, Math.max(0, col))
    const row = y < midY ? 0 : 1
    cells[row * 3 + col].goals++
  }
  return cells
})

const maxZone = computed(() => Math.max(1, ...zones.value.map(z => z.goals)))
const zoneShade = (g) => {
  if (!g) return 'var(--color-bg-surface-3)'
  const t = 0.25 + 0.6 * (g / maxZone.value)
  return `color-mix(in srgb, var(--color-accent) ${Math.round(t * 100)}%, transparent)`
}
</script>

<style scoped>
.sa { display: flex; flex-direction: column; gap: var(--space-4); }

.sa__top { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
.sa__acc { display: flex; flex-direction: column; }
.sa__acc-val { font-size: 2rem; font-weight: var(--font-weight-heavy); color: var(--color-accent); line-height: 1; }
.sa__acc-lbl { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-top: 2px; }
.sa__acc-sub { font-size: var(--font-size-xs); color: var(--color-text-faint); margin-top: 2px; }

.sa__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.sa__chip { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); padding: 4px 10px; border-radius: var(--radius-pill); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-soft); }
.sa__chip--goal { color: var(--color-success); }
.sa__chip--post { color: var(--color-warning); }
.sa__chip--miss { color: var(--color-danger); }
.sa__chip--save { color: var(--color-info); }

.sa__h { margin: 0 0 var(--space-2); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); font-weight: var(--font-weight-bold); }

.sa__feet { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.sa__foot { display: flex; flex-direction: column; gap: 5px; }
.sa__foot-head { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--font-size-sm); }
.sa__foot-acc { font-weight: var(--font-weight-bold); color: var(--color-accent); }
.sa__bar { height: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.sa__bar-fill { display: block; height: 100%; background: var(--color-accent); border-radius: var(--radius-pill); transition: width 0.4s ease; }
.sa__foot-sub { font-size: var(--font-size-xs); color: var(--color-text-faint); }

.sa__zones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  aspect-ratio: 3 / 1.4;
  max-width: 320px;
  padding: 5px;
  border: 2px solid var(--color-border-soft);
  border-bottom-width: 3px;
  border-radius: 6px 6px 0 0;
  background: var(--color-bg-surface);
}
.sa__zone { display: grid; place-items: center; border-radius: 3px; }
.sa__zone-n { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.sa__hint { margin: var(--space-2) 0 0; font-size: var(--font-size-xs); color: var(--color-text-faint); }
</style>
