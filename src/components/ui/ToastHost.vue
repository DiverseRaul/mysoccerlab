<template>
  <div class="toast-host" role="status" aria-live="polite" aria-atomic="false">
    <transition-group name="toast" tag="div" class="toast-stack">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
      >
        <span class="toast-icon" aria-hidden="true">
          <!-- success -->
          <svg v-if="t.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <!-- error -->
          <svg v-else-if="t.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/></svg>
          <!-- info -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="7.5" x2="12" y2="7.5"/></svg>
        </span>
        <span class="toast-message">{{ t.message }}</span>
        <button class="toast-dismiss" type="button" aria-label="Dismiss notification" @click="dismissToast(t.id)">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { toasts, dismissToast } from '../../lib/toast'
</script>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: max(var(--space-5), env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 2000;
  width: max-content;
  max-width: min(92vw, 440px);
  pointer-events: none;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-left: 3px solid var(--color-text-muted);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--color-text-primary);
}

.toast--success { border-left-color: var(--color-success); }
.toast--error   { border-left-color: var(--color-danger); }
.toast--info    { border-left-color: var(--color-info); }

.toast-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.toast-icon svg { width: 18px; height: 18px; }
.toast--success .toast-icon { color: var(--color-success); }
.toast--error   .toast-icon { color: var(--color-danger); }
.toast--info    .toast-icon { color: var(--color-info); }

.toast-message {
  flex: 1 1 auto;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  color: var(--color-text-secondary);
}

.toast-dismiss {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.toast-dismiss:hover {
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
}

/* Enter / leave: slide up + fade */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
/* Smooth reflow of remaining toasts when one leaves */
.toast-move {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  position: absolute;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 0.15s ease;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
