<template>
  <BentoItem :delay="200" extra-class="profile-analytics-tile">
    <div class="pa">
      <header class="pa__head">
        <h3 class="pa__title">Profile Analytics</h3>
        <span v-if="!showPro" class="pa__lock">PRO</span>
      </header>

      <!-- Free teaser -->
      <div v-if="!showPro" class="pa__teaser">
        <p>See how many players view your profile and open your match cards on The Pitch.</p>
        <router-link to="/premium" class="btn btn-primary btn-sm">Unlock with Lab Pro</router-link>
      </div>

      <!-- Pro -->
      <template v-else>
        <div class="pa__stats">
          <div class="pa__stat">
            <span class="pa__num">{{ stats.views }}</span>
            <span class="pa__label">Profile views</span>
            <span class="pa__sub">{{ stats.views30 }} in 30d</span>
          </div>
          <div class="pa__stat">
            <span class="pa__num">{{ stats.expands }}</span>
            <span class="pa__label">Card opens</span>
            <span class="pa__sub">{{ stats.expands30 }} in 30d</span>
          </div>
        </div>
        <p class="pa__foot">Anonymous — we never reveal who viewed you.</p>
      </template>
    </div>
  </BentoItem>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { isPro } from '../../../lib/premium'
import { getMyAnalytics } from '../../../lib/profileEvents'
import BentoItem from './BentoItem.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })

const showPro = computed(() => props.previewMode || isPro.value)
const stats = ref({ views: 0, expands: 0, views30: 0, expands30: 0 })

onMounted(async () => {
  if (props.previewMode) {
    stats.value = { views: 128, expands: 54, views30: 31, expands30: 12 }
    return
  }
  if (!showPro.value) return
  const a = await getMyAnalytics()
  if (a) stats.value = a
})
</script>

<style scoped>
.pa { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
.pa__head { display: flex; align-items: center; justify-content: space-between; }
.pa__title { margin: 0; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.pa__lock { padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-warning-bg); color: var(--color-warning); font-size: 0.6rem; font-weight: var(--font-weight-heavy); letter-spacing: 0.06em; }

.pa__teaser { display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
.pa__teaser p { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.55; }

.pa__stats { display: flex; gap: var(--space-4); }
.pa__stat { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.pa__num { font-size: var(--font-size-2xl); font-weight: var(--font-weight-heavy); color: var(--color-accent); line-height: 1; }
.pa__label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.pa__sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.pa__foot { margin: 0; font-size: var(--font-size-xs); color: var(--color-text-faint); }
</style>
