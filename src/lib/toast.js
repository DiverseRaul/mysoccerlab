/*
 * Global toast notification store.
 *
 * Tiny reactive store (no Pinia). Import `toast` to fire notifications and
 * `toasts` (+ `dismissToast`) to render them — see src/components/ui/ToastHost.vue,
 * which is mounted once in App.vue.
 */
import { reactive } from 'vue'

// Reactive list of active toasts: { id, type, message }
export const toasts = reactive([])

// Module-scoped, monotonically increasing id (NOT Date.now/Math.random).
let nextId = 0

// Default lifetimes per type (ms).
const DEFAULT_DURATION = 3500
const ERROR_DURATION = 5000

const timers = new Map()

export function dismissToast(id) {
  const idx = toasts.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.splice(idx, 1)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

function push(type, message, opts = {}) {
  const id = ++nextId
  toasts.push({ id, type, message })

  const fallback = type === 'error' ? ERROR_DURATION : DEFAULT_DURATION
  const duration = typeof opts.duration === 'number' ? opts.duration : fallback

  // duration <= 0 means sticky (no auto-dismiss).
  if (duration > 0) {
    const timer = setTimeout(() => dismissToast(id), duration)
    timers.set(id, timer)
  }

  return id
}

export const toast = {
  success(message, opts) {
    return push('success', message, opts)
  },
  error(message, opts) {
    return push('error', message, opts)
  },
  info(message, opts) {
    return push('info', message, opts)
  },
}
