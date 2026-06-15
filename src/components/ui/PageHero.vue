<template>
  <section class="page-hero" data-testid="page-hero">
    <div class="page-hero__left">
      <h1 class="page-hero__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-hero__subtitle" :class="{ 'page-hero__subtitle--nodot': !showDot }">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.action" class="page-hero__action"><slot name="action" /></div>
    <span v-else-if="chip" class="page-hero__chip">{{ chip }}</span>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  chip: { type: String, default: '' },
  showDot: { type: Boolean, default: true }
})
</script>

<style scoped>
/* Mirrors the "The Pitch" feed header (src/components/Feed.vue .feed-header). */
.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.05), rgba(15, 18, 20, 0.85));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
}

.page-hero__left { min-width: 0; }

.page-hero__title {
  margin: 0;
  font-size: 2.1rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
}

.page-hero__subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* The little pulsing "live" dot from the feed header. */
.page-hero__subtitle::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
  flex: 0 0 auto;
}

.page-hero__subtitle--nodot::before { display: none; }

.page-hero__action {
  flex: 0 0 auto;
}

.page-hero__chip {
  flex: 0 0 auto;
  padding: 7px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

@media (max-width: 480px) {
  .page-hero__title { font-size: 1.7rem; }
}
</style>
