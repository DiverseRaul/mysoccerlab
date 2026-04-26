<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Season' : 'New Season' }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Season Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Spring 2026, Fall League..."
            required
            autofocus
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Start Date <span class="optional">(optional)</span></label>
            <input v-model="form.start_date" type="date" />
          </div>
          <div class="form-group">
            <label>End Date <span class="optional">(optional)</span></label>
            <input v-model="form.end_date" type="date" />
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-create" :disabled="loading">
            {{ loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Season') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  // When provided, the modal switches to edit mode and updates this season
  // instead of inserting a new one.
  season: { type: Object, default: null }
})

const emit = defineEmits(['close', 'created', 'updated'])

const isEdit = computed(() => !!props.season)

const form = reactive({
  name: props.season?.name || '',
  start_date: props.season?.start_date || '',
  end_date: props.season?.end_date || ''
})
const loading = ref(false)
const error = ref('')

const submit = async () => {
  if (!form.name.trim()) return
  loading.value = true
  error.value = ''

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    if (isEdit.value) {
      const { data, error: updateError } = await supabase
        .from('seasons')
        .update({
          name: form.name.trim(),
          start_date: form.start_date || null,
          end_date: form.end_date || null
        })
        .eq('id', props.season.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      emit('updated', data)
    } else {
      const { data, error: insertError } = await supabase
        .from('seasons')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) throw insertError
      emit('created', data)
    }
  } catch (e) {
    error.value = e.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  background: #141618;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.modal-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover { color: #fff; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optional {
  color: #555;
  text-transform: none;
  font-weight: 400;
}

input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #fff;
  font-size: 0.95rem;
  padding: 11px 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus {
  border-color: #4cda9c;
}

input::placeholder {
  color: #444;
}

.error-msg {
  color: #ff5252;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #888;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-create {
  background: #4cda9c;
  color: #003822;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create:hover:not(:disabled) { background: #3ab882; }

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
