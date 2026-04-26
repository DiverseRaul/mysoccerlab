<template>
  <span class="result-badge" :class="result">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: String,
    required: true,
    validator: (v) => ['win', 'loss', 'draw'].includes(v)
  }
})

const label = computed(() => {
  if (props.result === 'win') return 'Win'
  if (props.result === 'loss') return 'Loss'
  return 'Draw'
})
</script>

<style scoped>
.result-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.win  { color: var(--color-success); background: var(--color-success-bg); }
.loss { color: var(--color-danger);  background: var(--color-danger-bg); }
.draw { color: var(--color-neutral); background: var(--color-neutral-bg); }
</style>
