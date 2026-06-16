<template>
  <div class="drill-list" data-testid="practice-drill-list">
    <header class="list-header">
      <div class="header-titles">
        <h2>Practice Tracker</h2>
        <p class="subtitle">Log drills, watch yourself improve over time.</p>
      </div>
      <button
        type="button"
        class="add-btn"
        @click="$emit('add-drill')"
        data-testid="practice-add-drill-btn"
        aria-label="Add drill"
      >+ New drill</button>
    </header>

    <div v-if="loading" class="empty-state">Loading…</div>

    <div
      v-else-if="drills.length === 0"
      class="empty-state empty-state--cta"
      data-testid="practice-empty-state"
    >
      <div class="empty-state__icon">🎯</div>
      <h3 class="empty-state__title">How the Practice tracker works</h3>
      <ol class="how-it-works">
        <li><strong>Pick a drill</strong> — anything you do regularly (juggles, sprints, shots…).</li>
        <li><strong>Log a session</strong> when you practice, with a date and value.</li>
        <li><strong>Repeat over time</strong> — see a chart, personal best, and trend arrows.</li>
      </ol>
      <p class="empty-state__sub">Start with one of these, or create your own:</p>
      <div class="preset-grid">
        <button
          v-for="p in PRESETS"
          :key="p.name"
          type="button"
          class="preset-card"
          :data-testid="`practice-preset-${p.metric_type}`"
          @click="$emit('add-drill', p)"
        >
          <span class="preset-card__icon">{{ p.icon }}</span>
          <span class="preset-card__name">{{ p.name }}</span>
          <span class="preset-card__type">{{ metricTypeLabel(p.metric_type) }}</span>
        </button>
      </div>
      <button type="button" class="empty-state__btn" @click="$emit('add-drill')">
        Or build a custom drill
      </button>
    </div>

    <div v-else class="cards-grid">
      <button
        v-for="drill in drills"
        :key="drill.id"
        class="drill-card"
        type="button"
        :data-testid="`practice-drill-card-${drill.id}`"
        @click="$emit('select-drill', drill)"
      >
        <div class="drill-card__top">
          <div class="drill-card__name">{{ drill.name }}</div>
          <span class="drill-card__type">{{ metricTypeLabel(drill.metric_type) }}</span>
        </div>

        <div class="drill-card__latest" v-if="latestFor(drill)">
          <span class="latest-value">{{ formatValue(latestFor(drill), drill) }}</span>
          <span class="latest-date">{{ formatDate(latestFor(drill).session_date) }}</span>
        </div>
        <div class="drill-card__latest drill-card__latest--empty" v-else>
          No sessions yet
        </div>

        <div class="drill-card__bottom">
          <span
            class="trend"
            :class="`trend--${trendFor(drill).direction}`"
            :title="trendTitle(drill)"
          >
            {{ trendIcon(trendFor(drill).direction) }}
          </span>
          <span class="pb" v-if="pbFor(drill)">
            PB {{ formatValue(pbFor(drill), drill) }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  formatValue,
  computeTrend,
  personalBest,
  latestSession,
  metricTypeLabel
} from '../../../lib/practiceFormat'

// Starter drills shown on the empty state. Clicking one opens the Add
// Drill modal pre-filled with these values; the user can edit before saving.
const PRESETS = [
  { icon: '⚽', name: 'Juggling',           metric_type: 'count',    unit: 'juggles', target_value: 100 },
  { icon: '🎯', name: 'Shooting accuracy',  metric_type: 'shot_map', unit: 'shots',   target_value: 70 },
  { icon: '🏃', name: 'Sprint 20m',         metric_type: 'time',     unit: 's',       target_value: 3.5, lower_is_better: true },
  { icon: '🅿️', name: 'Long pass accuracy', metric_type: 'ratio',    unit: 'passes',  target_value: 80 }
]

const props = defineProps({
  drills: { type: Array, required: true },
  sessionsByDrill: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false }
})

defineEmits(['select-drill', 'add-drill'])

const sessionsFor = (drill) => props.sessionsByDrill[drill.id] || []
const latestFor   = (drill) => latestSession(sessionsFor(drill))
const pbFor       = (drill) => personalBest(sessionsFor(drill), drill)
const trendFor    = (drill) => computeTrend(sessionsFor(drill), drill)

const trendIcon = (dir) => dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'flat' ? '→' : ''
const trendTitle = (drill) => {
  const t = trendFor(drill)
  if (t.direction === 'none') return 'Not enough sessions to compute a trend'
  if (t.direction === 'flat') return 'Same as previous session'
  return t.direction === 'up' ? 'Improving vs previous session' : 'Down vs previous session'
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.drill-list { color: var(--color-text-primary); }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.header-titles h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.subtitle {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.add-btn {
  background: var(--color-accent);
  color: var(--color-bg-page);
  border: none;
  padding: 10px var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.add-btn:hover { background: var(--color-accent-strong); }

.empty-state {
  padding: var(--space-7) var(--space-5);
  text-align: center;
  color: var(--color-text-muted);
}

.empty-state__icon { font-size: 3rem; margin-bottom: var(--space-3); }
.empty-state__title { color: var(--color-text-primary); margin: 0 0 var(--space-3); }
.empty-state__sub { max-width: 460px; margin: var(--space-4) auto var(--space-3); line-height: 1.5; }

.how-it-works {
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  text-align: left;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.how-it-works li { margin: 4px 0; }
.how-it-works strong { color: var(--color-text-primary); }

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  max-width: 600px;
  margin: 0 auto var(--space-5);
}

.preset-card {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--color-text-primary);
  font-family: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.preset-card:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}

.preset-card__icon { font-size: 1.6rem; }
.preset-card__name { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); text-align: center; }
.preset-card__type { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.empty-state__btn {
  background: var(--color-accent);
  color: var(--color-bg-page);
  border: none;
  padding: 10px var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: inherit;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.drill-card {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.drill-card:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}

.drill-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.drill-card__name {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.drill-card__type {
  font-size: var(--font-size-xs);
  background: var(--color-bg-surface-3);
  color: var(--color-text-muted);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.drill-card__latest {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.latest-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
}

.latest-date { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.drill-card__latest--empty {
  color: var(--color-text-faint);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.drill-card__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.trend {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  min-width: 20px;
}

.trend--up { color: var(--color-success); }
.trend--down { color: var(--color-danger); }
.trend--flat { color: var(--color-warning); }
.trend--none { color: var(--color-text-faint); }

.pb {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-accent-border);
}
</style>
