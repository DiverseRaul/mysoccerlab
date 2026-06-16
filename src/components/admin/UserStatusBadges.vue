<template>
  <span class="badges">
    <span v-if="isAdmin" class="badge badge--admin">Admin</span>
    <span v-if="isPro" class="badge badge--pro">Pro</span>
    <span v-if="banned" class="badge badge--banned">Banned</span>
    <span v-if="isPublic" class="badge badge--public">Public</span>
    <span v-if="earlyAccess" class="badge badge--beta">Beta</span>
  </span>
</template>

<script setup>
defineProps({
  isAdmin: { type: Boolean, default: false },
  isPro: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  earlyAccess: { type: Boolean, default: false }
})
</script>

<style scoped>
.badges { display: inline-flex; flex-wrap: wrap; gap: 5px; }
.badge {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.62rem;
  font-weight: var(--font-weight-heavy);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.5;
}
.badge--admin { background: var(--color-accent-soft); color: var(--color-accent); }
.badge--pro { background: var(--color-warning-bg); color: var(--color-warning); }
.badge--banned { background: rgba(239, 83, 80, 0.16); color: var(--color-danger); }
.badge--public { background: var(--color-info-bg); color: var(--color-info); }
.badge--beta { background: var(--color-bg-surface-3); color: var(--color-text-muted); }
</style>
