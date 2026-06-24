<template>
  <div class="bento-item" :class="extraClass" :style="{ '--delay': `${delay}ms` }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  delay: { type: Number, default: 0 },
  extraClass: { type: String, default: '' }
})
</script>

<style scoped>
.bento-item {
  background: rgba(15, 18, 20, 0.75);
  border: 1px solid var(--color-border-subtle);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  /* Entrance (opacity/transform/filter) is driven by the scroll-reveal engine
     via [data-reveal] in reveal.css; these props cover both that reveal and the
     hover lift, so the tile fades/slides in on scroll and lifts on hover. */
  transition:
    transform 0.66s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.66s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.6s ease,
    box-shadow 0.4s ease,
    background 0.4s ease,
    border-color 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4);
}

.bento-item:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5);
  background: rgba(25, 30, 35, 0.9);
  border-color: var(--color-accent-border);
}

.bento-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, var(--color-accent-soft), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.bento-item:hover::after {
  opacity: 1;
}
</style>
