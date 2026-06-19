<template>
  <div ref="el" class="reveal" :class="{ 'is-visible': visible }" :style="{ transitionDelay: `${delay}ms` }">
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({ delay: { type: Number, default: 0 } })

const el = ref(null)
const visible = ref(false)
let observer = null

onMounted(() => {
  // Always reveal-on-scroll (fade + slide-up plays for everyone).
  if (typeof IntersectionObserver === 'undefined') { visible.value = true; return }
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { visible.value = true; observer.disconnect(); break }
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -12% 0px' })
  observer.observe(el.value)
})

onBeforeUnmount(() => observer && observer.disconnect())
</script>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(34px) scale(0.985);
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.reveal.is-visible {
  opacity: 1;
  transform: none;
}

</style>
