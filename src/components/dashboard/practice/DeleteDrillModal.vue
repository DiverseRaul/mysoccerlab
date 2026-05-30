<template>
  <div v-if="modelValue && drill" class="modal-overlay" @click.self="close">
    <div class="modal" @click.stop data-testid="practice-delete-drill-modal">
      <div class="modal-header">
        <h3>Delete drill?</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>
      <p class="warn-text">
        Deleting <strong>{{ drill.name }}</strong> will also remove every logged session for this drill. This can't be undone.
      </p>
      <div class="modal-buttons">
        <button type="button" @click="close" class="btn btn-secondary">Cancel</button>
        <button
          type="button"
          @click="$emit('confirm')"
          class="btn btn-danger"
          data-testid="confirm-delete-drill-btn"
        >Delete drill</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  drill: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'confirm'])
const close = () => emit('update:modelValue', false)
</script>

<style scoped>
@import './modal-shared.css';
</style>
