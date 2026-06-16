<template>
  <BentoItem :delay="160" extra-class="bento-item--wide trend-alerts-tile">
    <div class="ta">
      <header class="ta__head">
        <h3 class="ta__title">Form &amp; Slump Alerts</h3>
        <span v-if="!showPro" class="ta__lock">PRO</span>
      </header>

      <!-- Free teaser -->
      <div v-if="!showPro" class="ta__teaser">
        <p>Lab Pro quietly watches your rolling averages and flags hidden shifts — like passing dropping while you shoot more.</p>
        <router-link to="/premium" class="btn btn-primary btn-sm">Unlock with Lab Pro</router-link>
      </div>

      <!-- Pro: alerts -->
      <template v-else>
        <ul v-if="alerts.length" class="ta__list">
          <li v-for="a in alerts" :key="a.key" class="ta__alert" :class="`is-${a.severity}`">
            <span class="ta__dot"></span>
            <span class="ta__text">{{ a.text }}</span>
          </li>
        </ul>
        <p v-else class="ta__empty">No notable shifts right now — keep logging matches and I’ll flag any trends.</p>
      </template>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import { isPro } from '../../../lib/premium'
import { detectTrends } from '../../../lib/trends'
import BentoItem from './BentoItem.vue'

const props = defineProps({
  matches: { type: Array, default: () => [] },
  previewMode: { type: Boolean, default: false }
})

const showPro = computed(() => props.previewMode || isPro.value)
const alerts = computed(() => (showPro.value ? detectTrends(props.matches) : []))
</script>

<style scoped>
.ta { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
.ta__head { display: flex; align-items: center; justify-content: space-between; }
.ta__title { margin: 0; font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.ta__lock { padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-warning-bg); color: var(--color-warning); font-size: 0.6rem; font-weight: var(--font-weight-heavy); letter-spacing: 0.06em; }

.ta__teaser { display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
.ta__teaser p { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.55; }

.ta__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.ta__alert { display: flex; gap: 10px; padding: 12px 14px; background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.5; color: var(--color-text-secondary); }
.ta__alert.is-bad { border-color: rgba(239, 83, 80, 0.3); }
.ta__alert.is-good { border-color: var(--color-accent-border); }
.ta__dot { flex: 0 0 auto; width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: var(--color-text-faint); }
.ta__alert.is-bad .ta__dot { background: var(--color-danger); }
.ta__alert.is-good .ta__dot { background: var(--color-accent); }
.ta__alert.is-info .ta__dot { background: var(--color-info); }
.ta__empty { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }
</style>
