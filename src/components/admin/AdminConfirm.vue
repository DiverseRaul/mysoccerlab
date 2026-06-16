<template>
  <Teleport to="body">
    <div v-if="open" class="aconfirm" @click.self="$emit('cancel')">
      <div class="aconfirm__box" role="dialog" aria-modal="true">
        <h3 class="aconfirm__title">{{ title }}</h3>
        <p class="aconfirm__msg">{{ message }}</p>

        <label v-if="confirmText" class="aconfirm__field">
          <span>Type <strong>{{ confirmText }}</strong> to confirm</span>
          <input v-model="typed" type="text" autocomplete="off" @keyup.enter="tryConfirm" />
        </label>

        <div class="aconfirm__actions">
          <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Cancel</button>
          <button type="button" class="btn btn-danger" :disabled="!canConfirm" @click="tryConfirm">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '' },     // require typing this string
  confirmLabel: { type: String, default: 'Confirm' }
})
const emit = defineEmits(['confirm', 'cancel'])

const typed = ref('')
watch(() => props.open, (v) => { if (v) typed.value = '' })

const canConfirm = computed(() => !props.confirmText || typed.value.trim() === props.confirmText)
const tryConfirm = () => { if (canConfirm.value) emit('confirm') }
</script>

<style scoped>
.aconfirm {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.aconfirm__box {
  width: 100%; max-width: 420px;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
.aconfirm__title { margin: 0 0 var(--space-2); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.aconfirm__msg { margin: 0 0 var(--space-4); color: var(--color-text-muted); line-height: 1.6; font-size: var(--font-size-sm); }
.aconfirm__field { display: block; margin-bottom: var(--space-4); }
.aconfirm__field span { display: block; margin-bottom: 6px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.aconfirm__field strong { color: var(--color-danger); }
.aconfirm__field input {
  width: 100%; padding: 10px 14px; box-sizing: border-box;
  background: var(--color-bg-field); border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md); color: var(--color-text-primary); font-family: inherit; font-size: var(--font-size-base);
}
.aconfirm__field input:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.aconfirm__actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
