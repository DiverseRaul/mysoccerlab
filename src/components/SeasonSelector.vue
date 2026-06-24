<template>
  <div class="season-selector">
    <div class="season-pill" @click="toggleOpen" :class="{ open: isOpen }">
      <i class="ph ph-calendar" style="font-size:13px" aria-hidden="true"></i>
      <span>{{ activeSeason ? activeSeason.name : 'All Time' }}</span>
      <i class="chevron ph ph-caret-down" style="font-size:12px" aria-hidden="true"></i>
    </div>

    <Transition name="season-dd">
    <div v-if="isOpen" class="season-dropdown">
      <div
        class="season-option"
        :class="{ active: !activeSeason }"
        @click="select(null)"
      >
        <span class="option-dot"></span>
        <span class="option-name">All Time</span>
      </div>

      <div class="season-divider" v-if="seasons.length > 0"></div>

      <div
        v-for="s in seasons"
        :key="s.id"
        class="season-option"
        :class="{ active: activeSeason?.id === s.id }"
        @click="select(s)"
      >
        <span class="option-dot"></span>
        <span class="option-name">{{ s.name }}</span>
        <span class="season-dates" v-if="s.start_date">{{ formatDate(s.start_date) }}</span>
        <button
          class="edit-season-btn season-row-btn"
          @click.stop="openEdit(s)"
          title="Edit season"
        >
          <i class="ph ph-pencil-simple" style="font-size:12px" aria-hidden="true"></i>
        </button>
        <button
          class="delete-season-btn season-row-btn"
          @click.stop="deleteSeason(s)"
          title="Delete season"
        >
          <i class="ph ph-trash" style="font-size:12px" aria-hidden="true"></i>
        </button>
      </div>

      <div class="season-divider"></div>

      <div class="assign-hint" v-if="seasons.length > 0">
        <i class="ph ph-info" style="font-size:11px" aria-hidden="true"></i>
        Go to Matches tab → tap the season pill on any match row to assign it
      </div>

      <button class="new-season-btn" @click="openCreate">
        <i class="ph ph-plus" style="font-size:13px" aria-hidden="true"></i>
        New Season
      </button>
    </div>
    </Transition>

    <CreateSeasonModal
      v-if="showCreate"
      @close="showCreate = false"
      @created="onCreated"
    />
    <CreateSeasonModal
      v-if="editingSeason"
      :season="editingSeason"
      @close="editingSeason = null"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import CreateSeasonModal from './CreateSeasonModal.vue'

const props = defineProps({
  seasons: { type: Array, default: () => [] },
  activeSeason: { type: Object, default: null },
})

const emit = defineEmits(['update:activeSeason', 'season-created', 'season-deleted', 'season-updated'])

const isOpen = ref(false)
const showCreate = ref(false)
const editingSeason = ref(null)

const toggleOpen = () => { isOpen.value = !isOpen.value }

const select = (season) => {
  emit('update:activeSeason', season)
  isOpen.value = false
}

const openCreate = () => {
  isOpen.value = false
  showCreate.value = true
}

const onCreated = (season) => {
  showCreate.value = false
  emit('season-created', season)
}

const openEdit = (season) => {
  isOpen.value = false
  editingSeason.value = season
}

const onUpdated = (season) => {
  editingSeason.value = null
  emit('season-updated', season)
}

const deleteSeason = async (season) => {
  if (!confirm(`Delete "${season.name}"? Matches in this season will become unassigned.`)) return
  try {
    const { error } = await supabase.from('seasons').delete().eq('id', season.id)
    if (error) throw error
    emit('season-deleted', season.id)
  } catch (e) {
    console.error('Error deleting season:', e)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.season-selector {
  position: relative;
}

/* Trigger pill — visually matches the tab buttons (Dashboard.vue .tab-btn).
   Same padding, font-size, border-radius and active treatment so the pill
   reads as a sibling control rather than a stray dropdown. */
.season-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  padding: 14px 22px;
  min-height: 54px;
  cursor: pointer;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #89938d;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
  font-family: inherit;
}

.season-pill:hover {
  color: #e1e2e6;
  background: rgba(255, 255, 255, 0.05);
}

.season-pill:active { transform: scale(0.95); }

.season-pill.open {
  background: var(--color-brand);
  color: var(--color-brand-fg);
  box-shadow: 0 2px 12px color-mix(in srgb, var(--color-accent-deep) 30%, transparent);
}

.season-pill i {
  flex-shrink: 0;
}

.chevron {
  transition: transform 0.2s;
}

.season-pill.open .chevron {
  transform: rotate(180deg);
}

.season-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: #141618;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  min-width: 240px;
  padding: 8px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transform-origin: top left;
}

/* Dropdown springs out of the pill, and its rows stagger in. */
.season-dd-enter-active { transition: opacity 0.2s ease, transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1); }
.season-dd-leave-active { transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.5, 0, 0.75, 0); }
.season-dd-enter-from,
.season-dd-leave-to { opacity: 0; transform: scale(0.82) translateY(-10px); }

.season-dd-enter-active .season-option,
.season-dd-enter-active .new-season-btn {
  animation: season-row-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.season-dropdown > *:nth-child(1) { animation-delay: 0.04s; }
.season-dropdown > *:nth-child(2) { animation-delay: 0.07s; }
.season-dropdown > *:nth-child(3) { animation-delay: 0.10s; }
.season-dropdown > *:nth-child(4) { animation-delay: 0.13s; }
.season-dropdown > *:nth-child(5) { animation-delay: 0.16s; }
.season-dropdown > *:nth-child(6) { animation-delay: 0.19s; }
.season-dropdown > *:nth-child(7) { animation-delay: 0.22s; }

@keyframes season-row-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: none; }
}

.season-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #aaa;
  transition: all 0.15s;
}

.season-option:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.season-option:hover .season-row-btn {
  opacity: 1;
}

.season-option.active {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}

.option-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
  flex-shrink: 0;
}

.option-name {
  flex: 1;
}

.season-dates {
  font-size: 0.72rem;
  opacity: 0.4;
  flex-shrink: 0;
}

.season-row-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-family: inherit;
}

.edit-season-btn {
  color: #89938d;
}

.edit-season-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.delete-season-btn {
  color: #ff5252;
}

.delete-season-btn:hover {
  background: rgba(255, 82, 82, 0.15);
}

.season-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 0;
}

.assign-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  font-size: 0.72rem;
  color: #555;
  line-height: 1.4;
}

.assign-hint i {
  flex-shrink: 0;
  margin-top: 1px;
}

.new-season-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-accent);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.new-season-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* ── Compact (icon-only) trigger ──────────────────────────────────────
   In the stacked control bar (tablet + phone) the season switch collapses to
   just the calendar icon, sitting inline next to the Simple/Advanced toggle.
   The dropdown anchors to the right edge so it never runs off-screen. */
@media (max-width: 1023px) {
  .season-pill {
    width: 54px;
    height: 54px;
    min-height: 54px;
    padding: 0;
    gap: 0;
    justify-content: center;
    /* Same chrome as the tab/toggle switchers. */
    background: var(--color-bg-surface-2);
    border: 1px solid var(--color-border-subtle);
  }

  .season-pill:hover {
    background: var(--color-bg-surface-2);
  }

  .season-pill > span,
  .season-pill .chevron {
    display: none;
  }

  .season-pill .ph-calendar {
    font-size: 18px !important;
  }

  .season-dropdown {
    left: auto;
    right: 0;
    transform-origin: top right;
  }
}
</style>
