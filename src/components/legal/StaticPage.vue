<template>
  <div class="static-page">
    <div class="static-page__wrap">
      <PageHero :title="title" :subtitle="subtitle" :showDot="false" />
      <div class="static-page__card">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHero from '../ui/PageHero.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.static-page {
  min-height: 100vh;
  background: var(--app-page-bg);
  color: var(--color-text-secondary);
  padding: 120px 20px 64px;
}

.static-page__wrap {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.static-page__card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(15, 18, 20, 0.92));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

/* Shared prose styling for legal/FAQ content. */
.static-page__card :deep(h2) {
  margin: var(--space-6) 0 var(--space-3);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.static-page__card :deep(h2:first-child) { margin-top: 0; }

.static-page__card :deep(p),
.static-page__card :deep(li) {
  margin: 0 0 var(--space-3);
  line-height: 1.7;
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.static-page__card :deep(ul) {
  margin: 0 0 var(--space-3);
  padding-left: 1.2rem;
}

.static-page__card :deep(a) {
  color: var(--color-accent);
  text-decoration: none;
}

.static-page__card :deep(a:hover) { text-decoration: underline; }

@media (max-width: 480px) {
  .static-page { padding: 100px 16px 40px; }
  .static-page__card { padding: var(--space-5); }
}
</style>
