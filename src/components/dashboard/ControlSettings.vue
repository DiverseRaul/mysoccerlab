<template>
  <div class="control-settings" ref="rootRef">
    <button
      type="button"
      class="settings-trigger"
      :class="{ open: isOpen }"
      :aria-expanded="isOpen"
      aria-label="Dashboard view & season settings"
      @click="isOpen = !isOpen"
    >
      <i class="ph ph-faders-horizontal" aria-hidden="true"></i>
    </button>

    <Transition name="settings-pop">
      <div v-if="isOpen" class="settings-panel" role="menu">
        <!-- Detail level (Overview only) -->
        <div v-if="showViewToggle" class="settings-section">
          <span class="settings-label">Detail</span>
          <div class="overview-mode" role="tablist" aria-label="Dashboard detail level">
            <button type="button" class="overview-mode__btn" :class="{ 'is-active': !advanced }" :aria-selected="!advanced" @click="$emit('update:advanced', false)">Simple</button>
            <button type="button" class="overview-mode__btn" :class="{ 'is-active': advanced }" :aria-selected="advanced" @click="$emit('update:advanced', true)">Advanced</button>
          </div>
        </div>

        <!-- Season -->
        <div v-if="showSeason" class="settings-section">
          <span class="settings-label">Season</span>
          <SeasonSelector
            inline
            :seasons="seasons"
            :activeSeason="activeSeason"
            @update:activeSeason="$emit('update:activeSeason', $event)"
            @season-created="$emit('season-created', $event)"
            @season-deleted="$emit('season-deleted', $event)"
            @season-updated="$emit('season-updated', $event)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SeasonSelector from '../SeasonSelector.vue'

defineProps({
  advanced: { type: Boolean, default: false },
  // Detail toggle only applies to the Overview.
  showViewToggle: { type: Boolean, default: false },
  seasons: { type: Array, default: () => [] },
  activeSeason: { type: Object, default: null },
  showSeason: { type: Boolean, default: true },
})

defineEmits(['update:advanced', 'update:activeSeason', 'season-created', 'season-deleted', 'season-updated'])

const isOpen = ref(false)
const rootRef = ref(null)

const onDocClick = (e) => {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(e.target)) isOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.control-settings {
  position: relative;
  flex: 0 0 auto;
}

/* Gear trigger — same height/chrome as the switcher pills it replaces. */
.settings-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Same outer height as the mode + tab switchers so the bar is even. */
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: 24px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.settings-trigger:active { transform: scale(0.92); }

@media (hover: hover) {
  .settings-trigger:hover { color: var(--color-text-primary); border-color: var(--color-border-soft); }
}

.settings-trigger.open {
  color: var(--color-accent);
  border-color: var(--color-accent-border);
  background: var(--color-accent-soft);
}
.settings-trigger.open i { transform: rotate(90deg); }
.settings-trigger i { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

/* Popover */
.settings-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 120;
  width: 264px;
  max-width: calc(100vw - 32px);
  padding: 14px;
  background: #141618;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transform-origin: top right;
}

.settings-section + .settings-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border-subtle);
}

.settings-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
}

/* Springy open. */
.settings-pop-enter-active { transition: opacity 0.2s ease, transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
.settings-pop-leave-active { transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.5, 0, 0.75, 0); }
.settings-pop-enter-from,
.settings-pop-leave-to { opacity: 0; transform: scale(0.85) translateY(-8px); }

/* ── Simple/Advanced segmented toggle (accent-soft sliding pill) ──────── */
.overview-mode {
  position: relative;
  display: flex;
  gap: 0;
  padding: 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
}

.overview-mode::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-accent-border);
  transition: transform 0.42s cubic-bezier(0.5, 1.5, 0.4, 1);
  z-index: 0;
}
.overview-mode:has(.overview-mode__btn:last-of-type.is-active)::before {
  transform: translateX(100%);
}

.overview-mode__btn {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 10px 14px;
  min-height: 42px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.25s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overview-mode__btn:active { transform: scale(0.93); }
.overview-mode__btn.is-active { color: var(--color-accent); }
</style>
