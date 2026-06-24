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
          <i v-if="t.type === 'success'" class="ph-fill ph-check-circle" aria-hidden="true"></i>
          <i v-else-if="t.type === 'error'" class="ph-fill ph-warning-circle" aria-hidden="true"></i>
          <i v-else class="ph-fill ph-info" aria-hidden="true"></i>
        </span>
        <span class="toast-message">{{ t.message }}</span>
        <button class="toast-dismiss" type="button" aria-label="Dismiss notification" @click="dismissToast(t.id)">
          <i class="ph ph-x" style="font-size:14px" aria-hidden="true"></i>
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
.toast-icon i { font-size: 18px; line-height: 1; }
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
</style>
