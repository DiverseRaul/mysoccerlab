<template>
  <section class="asec">
    <header class="asec__header">
      <h2 class="asec__title">Dashboard Layout</h2>
      <p class="asec__subtitle">Manage the order and visibility of overview widgets for all players.</p>
    </header>

    <div class="acard">
      <div class="tile-list">
        <div v-for="(tile, index) in draft.tiles" :key="tile.id" class="tile-item">
          <div class="tile-item__details">
            <span class="tile-item__drag-handle">☰</span>
            <div class="tile-item__info">
              <span class="tile-item__label">{{ tile.label }}</span>
              <span class="tile-item__id">{{ tile.id }}</span>
            </div>
          </div>

          <div class="tile-item__actions">
            <!-- Section / divider the tile lives under (advanced view) -->
            <label class="group-selector" title="Section divider">
              <span class="group-selector__label">Section</span>
              <select v-model="tile.group" class="group-select">
                <option v-for="g in GROUPS" :key="g.value" :value="g.value">{{ g.label }}</option>
              </select>
            </label>

            <!-- Mode selection buttons -->
            <div class="mode-selector">
              <button
                v-for="m in ['simple', 'advanced', 'hidden']"
                :key="m"
                type="button"
                class="mode-btn"
                :class="[`mode-btn--${m}`, { 'is-active': tile.mode === m }]"
                @click="tile.mode = m"
              >
                {{ m }}
              </button>
            </div>

            <!-- Up/Down sorting buttons -->
            <div class="order-controls">
              <button
                type="button"
                class="btn-arrow"
                :disabled="index === 0"
                title="Move Up"
                @click="moveTile(index, -1)"
              >
                ▲
              </button>
              <button
                type="button"
                class="btn-arrow"
                :disabled="index === draft.tiles.length - 1"
                title="Move Down"
                @click="moveTile(index, 1)"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="asave">
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes' }}
      </button>
      <button type="button" class="btn btn-ghost" @click="reset">Reset</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { content, DEFAULTS, loadKey, saveContent } from '../../../lib/siteContent'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const clone = (o) => JSON.parse(JSON.stringify(o))

// Section dividers shown on the advanced dashboard (must match GROUP_ORDER in
// DashboardOverview.vue). '' = no header (the simple/top tiles).
const GROUPS = [
  { value: '', label: 'No divider' },
  { value: 'Form', label: 'Form' },
  { value: 'Attack', label: 'Attack' },
  { value: 'Defense', label: 'Defense' },
  { value: 'Season', label: 'Season' },
  { value: 'Training & load', label: 'Training & load' }
]
const DEFAULT_TILE_BY_ID = Object.fromEntries(DEFAULTS.dashboard.tiles.map(t => [t.id, t]))

const draft = ref({ tiles: [] })
const saving = ref(false)
const saved = ref(false)

const moveTile = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= draft.value.tiles.length) return
  const temp = draft.value.tiles[index]
  draft.value.tiles[index] = draft.value.tiles[newIndex]
  draft.value.tiles[newIndex] = temp
}

const reset = () => {
  const base = content.value.dashboard?.tiles ? content.value.dashboard : DEFAULTS.dashboard
  const next = clone(base)
  // Backfill group from defaults for tiles saved before sections existed.
  next.tiles = (next.tiles || []).map(t => ({
    ...t,
    group: t.group ?? DEFAULT_TILE_BY_ID[t.id]?.group ?? ''
  }))
  draft.value = next
}

const save = async () => {
  saving.value = true
  if (!props.previewMode) {
    await saveContent('dashboard', clone(draft.value))
  }
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) {
    await loadKey('dashboard')
  }
  reset()
})
</script>

<style scoped>
.asec__header {
  margin-bottom: var(--space-5);
}
.asec__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
}
.asec__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.acard {
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-5);
}

.tile-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  gap: var(--space-4);
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.tile-item:hover {
  background: var(--color-bg-surface-3);
  border-color: var(--color-border-strong);
}

.tile-item__details {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.tile-item__drag-handle {
  color: var(--color-text-faint);
  font-size: 1.1rem;
  cursor: grab;
  user-select: none;
}

.tile-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tile-item__label {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-item__id {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}

.tile-item__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.group-selector {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.group-selector__label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-faint);
  font-weight: var(--font-weight-semibold);
}
.group-select {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 6px 8px;
  cursor: pointer;
}
.group-select:focus { outline: none; border-color: var(--color-accent-border); }

.mode-selector {
  display: flex;
  background: var(--color-bg-surface);
  padding: 3px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
}

.mode-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: capitalize;
  color: var(--color-text-muted);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn:hover {
  color: var(--color-text-secondary);
}

.mode-btn.is-active.mode-btn--simple {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.mode-btn.is-active.mode-btn--advanced {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.mode-btn.is-active.mode-btn--hidden {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.order-controls {
  display: flex;
  gap: 4px;
}

.btn-arrow {
  background: var(--color-bg-surface-3);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-arrow:hover:not(:disabled) {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.btn-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.asave {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  background: linear-gradient(to top, var(--color-bg-page) 60%, transparent);
  z-index: 10;
}

@media (max-width: 768px) {
  .tile-item {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-3);
    gap: var(--space-3);
  }

  .tile-item__actions {
    justify-content: space-between;
  }
}
</style>
