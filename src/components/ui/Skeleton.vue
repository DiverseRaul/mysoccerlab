<template>
  <div class="skeleton" :style="style" aria-hidden="true"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  radius: { type: String, default: 'var(--radius-sm)' }
})

const style = computed(() => ({ width: props.width, height: props.height, borderRadius: props.radius }))
</script>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--color-bg-surface-2);
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-text-faint) 16%, transparent),
    transparent
  );
  animation: skeleton-shimmer 1.3s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}</style>
