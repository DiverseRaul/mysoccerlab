<template>
  <label class="afield" :class="{ 'afield--inline': type === 'checkbox' }">
    <span v-if="type !== 'checkbox'" class="afield__label">{{ label }}</span>

    <textarea
      v-if="multiline"
      class="afield__control"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>

    <select
      v-else-if="type === 'select'"
      class="afield__control"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <span v-else-if="type === 'checkbox'" class="afield__check">
      <input
        type="checkbox"
        :checked="!!modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span class="afield__check-label">{{ label }}</span>
    </span>

    <input
      v-else
      class="afield__control"
      :type="type"
      :step="type === 'number' ? 'any' : undefined"
      :min="type === 'number' && min !== null ? min : undefined"
      :max="type === 'number' && max !== null ? max : undefined"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput($event.target.value)"
    />
    <span v-if="helper" class="afield__helper">{{ helper }}</span>
  </label>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  modelValue: { type: [String, Number, Boolean], default: '' },
  type: { type: String, default: 'text' },
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 2 },
  placeholder: { type: String, default: '' },
  helper: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  min: { type: Number, default: null },
  max: { type: Number, default: null }
})
const emit = defineEmits(['update:modelValue'])

// For numbers, emit null on empty (so "cleared" isn't silently coerced to 0) and
// a real Number otherwise; text passes through unchanged.
const onInput = (raw) => {
  if (props.type !== 'number') return emit('update:modelValue', raw)
  emit('update:modelValue', raw === '' ? null : Number(raw))
}
</script>

<style scoped>
.afield { display: block; margin-bottom: var(--space-4); }

.afield__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.afield__control {
  width: 100%;
  padding: 11px 14px;
  background: var(--color-bg-field);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.afield__control:focus {
  outline: none;
  border-color: var(--color-accent-border);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.afield__control::placeholder { color: var(--color-text-faint); }

select.afield__control { cursor: pointer; appearance: none; }
select.afield__control option { background: var(--color-bg-field); color: var(--color-text-primary); }

.afield--inline { display: flex; align-items: center; }
.afield__check { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
.afield__check input { width: 18px; height: 18px; accent-color: var(--color-accent); cursor: pointer; }
.afield__check-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }

.afield__helper {
  display: block;
  margin-top: 5px;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}
</style>
