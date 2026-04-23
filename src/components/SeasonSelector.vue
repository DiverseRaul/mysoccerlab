<template>
  <div class="season-selector">
    <div class="season-pill" @click="toggleOpen" :class="{ open: isOpen }">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span>{{ activeSeason ? activeSeason.name : 'All Time' }}</span>
      <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

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
        <button class="delete-season-btn" @click.stop="deleteSeason(s)" title="Delete season">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>

      <div class="season-divider"></div>

      <div class="assign-hint" v-if="seasons.length > 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Go to Matches tab → tap the season pill on any match row to assign it
      </div>

      <button class="new-season-btn" @click="openCreate">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Season
      </button>
    </div>

    <CreateSeasonModal
      v-if="showCreate"
      @close="showCreate = false"
      @created="onCreated"
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

const emit = defineEmits(['update:activeSeason', 'season-created', 'season-deleted'])

const isOpen = ref(false)
const showCreate = ref(false)

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

.season-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ccc;
  transition: all 0.2s;
  user-select: none;
  white-space: nowrap;
}

.season-pill:hover, .season-pill.open {
  border-color: rgba(76, 218, 156, 0.4);
  color: #4cda9c;
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

.season-option:hover .delete-season-btn {
  opacity: 1;
}

.season-option.active {
  background: rgba(76, 218, 156, 0.1);
  color: #4cda9c;
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

.delete-season-btn {
  background: transparent;
  border: none;
  color: #ff5252;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

.assign-hint svg {
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
  color: #4cda9c;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.new-season-btn:hover {
  background: rgba(76, 218, 156, 0.1);
}
</style>
