<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-state__icon" aria-hidden="true">{{ icon }}</div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="message" class="empty-state__message">{{ message }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:    { type: String, default: '' },
  title:   { type: String, required: true },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-5);
  max-width: 420px;
  margin: 0 auto;
}

.empty-state__icon {
  font-size: 2.75rem;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
}

.empty-state__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.empty-state__message {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-text-muted);
}

.empty-state__actions {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
}
</style>
