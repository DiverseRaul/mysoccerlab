<template>
  <div class="pgf">
    <div class="pgf__status">
      <span class="pgf__status-label">Current tier</span>
      <span class="pgf__status-val" :class="{ 'is-pro': tier === 'pro' }">{{ tier === 'pro' ? 'Pro' : 'Free' }}</span>
      <span v-if="tier === 'pro' && endsAt" class="pgf__ends">until {{ prettyEnds }}</span>
      <span v-else-if="tier === 'pro'" class="pgf__ends">permanent</span>
    </div>

    <div class="pgf__row">
      <label class="pgf__field">
        <span>Grant Pro for</span>
        <select v-model="duration">
          <option v-for="d in durations" :key="d.value" :value="d.value">{{ d.label }}</option>
        </select>
      </label>
      <label v-if="duration === 'custom'" class="pgf__field">
        <span>Until date</span>
        <input v-model="customEndsAt" type="date" />
      </label>
      <button type="button" class="btn btn-primary" :disabled="busy || (duration === 'custom' && !customEndsAt)" @click="$emit('grant', { tier: 'pro', duration, customEndsAt })">
        {{ tier === 'pro' ? 'Update grant' : 'Grant Pro' }}
      </button>
    </div>

    <button v-if="tier === 'pro'" type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="$emit('revoke')">Revoke Pro now</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PRO_DURATIONS } from '../../lib/proDuration'

const props = defineProps({
  tier: { type: String, default: 'free' },
  endsAt: { type: String, default: null },
  busy: { type: Boolean, default: false }
})
defineEmits(['grant', 'revoke'])

const durations = PRO_DURATIONS
const duration = ref('1m')
const customEndsAt = ref('')

const prettyEnds = computed(() => {
  if (!props.endsAt) return ''
  try { return new Date(props.endsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return props.endsAt }
})
</script>

<style scoped>
.pgf { display: flex; flex-direction: column; gap: var(--space-4); }
.pgf__status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pgf__status-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.pgf__status-val { font-weight: var(--font-weight-heavy); color: var(--color-text-secondary); }
.pgf__status-val.is-pro { color: var(--color-warning); }
.pgf__ends { font-size: var(--font-size-sm); color: var(--color-text-muted); }

.pgf__row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-3); }
.pgf__field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 140px; }
.pgf__field span { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.pgf__field select, .pgf__field input {
  padding: 10px 12px;
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
}
.pgf__field select:focus, .pgf__field input:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }
</style>
