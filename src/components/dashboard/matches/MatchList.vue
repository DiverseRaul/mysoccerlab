<template>
  <div class="match-list">
    <header class="list-header">
      <h2>All Matches</h2>
      <div class="header-controls">
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            v-model="search"
            type="search"
            class="search-input"
            placeholder="Search opponent…"
            aria-label="Search matches by opponent"
          />
        </div>
        <select v-model="sortBy" class="sort-select" aria-label="Sort matches">
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
        <button
          type="button"
          class="add-btn"
          @click="$emit('add-match')"
          title="Add Match"
          aria-label="Add Match"
        >+</button>
      </div>
    </header>

    <div class="filter-pills" role="tablist" aria-label="Filter matches by result">
      <button
        v-for="f in filterOptions"
        :key="f.value"
        type="button"
        :class="['filter-pill', { active: resultFilter === f.value }]"
        :data-filter="f.value"
        :aria-pressed="resultFilter === f.value"
        @click="resultFilter = f.value"
      >{{ f.label }}<span v-if="f.count !== null" class="filter-pill__count">{{ f.count }}</span></button>
    </div>

    <!-- Empty: no matches in DB at all -->
    <div v-if="props.matches.length === 0" class="empty-state empty-state--cta">
      <div class="empty-state__icon">⚽</div>
      <h3 class="empty-state__title">No matches yet</h3>
      <p class="empty-state__sub">Log your first match to start tracking your performance.</p>
      <button type="button" class="empty-state__btn" @click="$emit('add-match')">Log your first match</button>
    </div>

    <!-- Empty: filters/search excluded everything -->
    <p
      v-else-if="displayedMatches.length === 0"
      class="empty-state empty-state--filtered"
    >
      No matches match your search/filter. <button type="button" class="link-btn" @click="resetFilters">Reset filters</button>
    </p>

    <div v-else class="list-grid">
      <MatchListRow
        v-for="match in displayedMatches"
        :key="match.id"
        :match="match"
        :seasons="seasons"
        :is-best="match.id === bestRatingMatchId"
        :highlight="highlightFor(match)"
        :rating-history="ratingHistoryFor(match)"
        @select="$emit('select-match', match)"
        @assign-season="(seasonId) => $emit('assign-season', { match, seasonId })"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MatchListRow from './MatchListRow.vue'
import { calculateMatchRating } from '../../../lib/rating'
import { getMatchHighlight } from '../../../lib/matchHighlights'

const props = defineProps({
  matches: { type: Array, required: true },
  seasons: { type: Array, default: () => [] }
})

defineEmits(['select-match', 'add-match', 'assign-season'])

const sortBy = ref('date')
const search = ref('')
const resultFilter = ref('all')

// Per-match cached values keyed by match id
const ratingByMatch = computed(() => {
  const map = {}
  for (const m of props.matches) {
    map[m.id] = parseFloat(calculateMatchRating(m))
  }
  return map
})

const resultOf = (m) => {
  if (m.score_for > m.score_against) return 'W'
  if (m.score_for < m.score_against) return 'L'
  return 'D'
}

const counts = computed(() => {
  const c = { all: props.matches.length, W: 0, D: 0, L: 0 }
  for (const m of props.matches) c[resultOf(m)]++
  return c
})

const filterOptions = computed(() => [
  { value: 'all', label: 'All',     count: counts.value.all },
  { value: 'W',   label: 'Wins',    count: counts.value.W },
  { value: 'D',   label: 'Draws',   count: counts.value.D },
  { value: 'L',   label: 'Losses',  count: counts.value.L }
])

// Search + filter, then sort
const filteredMatches = computed(() => {
  const term = search.value.trim().toLowerCase()
  return props.matches.filter(m => {
    if (resultFilter.value !== 'all' && resultOf(m) !== resultFilter.value) return false
    if (term && !(m.opponent || '').toLowerCase().includes(term)) return false
    return true
  })
})

const displayedMatches = computed(() => {
  const sorted = [...filteredMatches.value]
  if (sortBy.value === 'rating') {
    return sorted.sort((a, b) => (ratingByMatch.value[b.id] || 0) - (ratingByMatch.value[a.id] || 0))
  }
  // already date-desc from the DB query
  return sorted
})

const bestRatingMatchId = computed(() => {
  if (props.matches.length === 0) return null
  let best = null
  let bestVal = -1
  for (const m of props.matches) {
    const v = ratingByMatch.value[m.id] || 0
    if (v > bestVal) { bestVal = v; best = m.id }
  }
  return best
})

// Sparkline window: this match + the 5 prior matches (oldest → newest, ascending)
// `props.matches` arrives date-desc, so a higher index = older.
// Returns an array of { rating, opponent } objects so the line graph can
// label each point with the team we played.
const ratingHistoryFor = (match) => {
  const idx = props.matches.findIndex(m => m.id === match.id)
  if (idx === -1) return []
  const window = props.matches.slice(idx, idx + 6) // newest first → newest = match itself
  return window.slice().reverse().map(m => ({
    rating: ratingByMatch.value[m.id] || 0,
    opponent: m.opponent || ''
  }))
}

const highlightFor = (match) => getMatchHighlight(match)

const resetFilters = () => {
  search.value = ''
  resultFilter.value = 'all'
}
</script>

<style scoped>
.match-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Header ──────────────────────────────────────── */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-2);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.list-header h2 {
  font-size: 2rem;
  font-weight: var(--font-weight-heavy);
  margin: 0;
  color: var(--color-text-primary);
}

.header-controls {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-soft);
  padding: 8px 12px 8px 30px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--font-size-sm);
  width: 200px;
  max-width: 100%;
  transition: border-color 0.15s ease;
}

.search-input::placeholder { color: var(--color-text-faint); }

.search-input:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.sort-select {
  background: var(--color-bg-surface-3);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-soft);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-sm);
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.add-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--color-accent);
  color: var(--color-bg-page);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.add-btn:hover {
  background: #3cb885;
  transform: scale(1.05);
}

/* ── Filter pills (W/D/L) ────────────────────────── */
.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0 var(--space-2);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 32px;
}

.filter-pill:hover {
  border-color: var(--color-accent-border);
  color: var(--color-text-secondary);
}

.filter-pill.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.filter-pill__count {
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.65rem;
  font-weight: var(--font-weight-bold);
  color: inherit;
}

/* ── Grid ────────────────────────────────────────── */
.list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

/* ── Empty states ────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 60px var(--space-5);
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border-soft);
  margin: 0;
}

.empty-state--cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  font-style: normal;
}

.empty-state__icon {
  font-size: 2.6rem;
  opacity: 0.7;
}

.empty-state__title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.empty-state__sub {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 360px;
}

.empty-state__btn {
  margin-top: var(--space-2);
  padding: 10px var(--space-5);
  background: var(--color-accent);
  color: var(--color-bg-page);
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.empty-state__btn:hover {
  background: #3cb885;
  transform: translateY(-1px);
}

.empty-state--filtered {
  font-size: var(--font-size-sm);
  font-style: italic;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
  padding: 0;
}

@media (max-width: 768px) {
  .list-grid {
    grid-template-columns: 1fr;
  }

  .search-input { width: 100%; }
  .header-controls { width: 100%; }
}
</style>
