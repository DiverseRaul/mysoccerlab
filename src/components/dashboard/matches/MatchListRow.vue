<template>
  <div class="match-list-row" @click="$emit('select')">
    <MatchCard
      :match="match"
      variant="row"
      :is-best="isBest"
      :highlight="highlight"
      :rating-history="ratingHistory"
    >
      <template #trailing>
        <div class="season-tag-wrapper" @click.stop>
          <button
            type="button"
            class="season-tag"
            @click="togglePicker"
            aria-haspopup="listbox"
            :aria-expanded="pickerOpen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="season-tag__label">{{ activeSeasonName }}</span>
          </button>
          <div v-if="pickerOpen" class="season-dropdown" role="listbox">
            <button
              type="button"
              class="dropdown-option"
              :class="{ active: !match.season_id }"
              @click="assign(null)"
            >No Season</button>
            <button
              v-for="s in seasons"
              :key="s.id"
              type="button"
              class="dropdown-option"
              :class="{ active: match.season_id === s.id }"
              @click="assign(s.id)"
            >{{ s.name }}</button>
          </div>
        </div>
      </template>
    </MatchCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MatchCard from '../../ui/MatchCard.vue'

const props = defineProps({
  match: { type: Object, required: true },
  seasons: { type: Array, default: () => [] },
  isBest: { type: Boolean, default: false },
  highlight: { type: Object, default: null },
  ratingHistory: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'assign-season'])

const pickerOpen = ref(false)

const activeSeasonName = computed(() => {
  if (!props.match.season_id) return 'No Season'
  return props.seasons.find(s => s.id === props.match.season_id)?.name || 'No Season'
})

const togglePicker = () => { pickerOpen.value = !pickerOpen.value }

const assign = (seasonId) => {
  pickerOpen.value = false
  emit('assign-season', seasonId)
}

// Close dropdown when clicking outside the row
const onDocumentClick = (e) => {
  if (!pickerOpen.value) return
  if (!e.target.closest?.('.season-tag-wrapper')) {
    pickerOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<style scoped>
.match-list-row {
  cursor: pointer;
}

.season-tag-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.season-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
  font-family: inherit;
}

.season-tag:hover {
  background: rgba(76, 218, 156, 0.18);
}

.season-tag__label {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.season-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  min-width: 160px;
  padding: 6px;
  z-index: 200;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-option {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  background: transparent;
  border: none;
  text-align: left;
  font-family: inherit;
}

.dropdown-option:hover {
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
}

.dropdown-option.active {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
</style>
