<template>
  <span class="pro-badge" :class="{ 'pro-badge--sm': small }" title="Lab Pro">PRO</span>
</template>

<script setup>
defineProps({
  small: { type: Boolean, default: false }
})
</script>

<style scoped>
.pro-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-heavy);
  letter-spacing: 0.08em;
  line-height: 1.4;
  flex: 0 0 auto;
}

.pro-badge--sm {
  padding: 1px 6px;
  font-size: 0.6rem;
}
</style>
