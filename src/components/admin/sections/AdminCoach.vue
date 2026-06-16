<template>
  <section class="asec">
    <h2 class="asec__title">AI Coach</h2>

    <div class="acard">
      <h3 class="acard__title">Greeting</h3>
      <AdminField label="Greeting (the player's name is added after it)" v-model="draft.greeting" helper="Shown as “{greeting}, Name?” on the empty chat." />
    </div>

    <div class="acard">
      <h3 class="acard__title">Starter suggestions</h3>
      <div v-for="(_, i) in draft.suggestions" :key="i" class="arow">
        <AdminField :label="`Suggestion ${i + 1}`" v-model="draft.suggestions[i]" />
        <button type="button" class="arow__del" aria-label="Remove" @click="draft.suggestions.splice(i, 1)">✕</button>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="draft.suggestions.push('')">+ Add suggestion</button>
    </div>

    <div class="asave">
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes' }}</button>
      <button type="button" class="btn btn-ghost" @click="reset">Reset</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminField from '../AdminField.vue'
import { content, loadKey, saveContent } from '../../../lib/siteContent'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const clone = (o) => JSON.parse(JSON.stringify(o))
const draft = ref(clone(content.value.coach))
const saving = ref(false)
const saved = ref(false)

const reset = () => { draft.value = clone(content.value.coach) }
const save = async () => {
  saving.value = true
  const cleaned = { ...draft.value, suggestions: draft.value.suggestions.map((s) => s.trim()).filter(Boolean) }
  if (!props.previewMode) await saveContent('coach', clone(cleaned))
  else draft.value = cleaned
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) { await loadKey('coach'); draft.value = clone(content.value.coach) }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.acard { padding: var(--space-5); margin-bottom: var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.acard__title { margin: 0 0 var(--space-4); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }
.arow { display: flex; align-items: flex-start; gap: var(--space-2); }
.arow > :first-child { flex: 1; }
.arow__del { flex: 0 0 auto; margin-top: 26px; width: 34px; height: 40px; border: 1px solid var(--color-border-soft); background: transparent; color: var(--color-text-muted); border-radius: var(--radius-md); cursor: pointer; }
.arow__del:hover { color: var(--color-danger); border-color: rgba(239,83,80,0.4); }
.asave { position: sticky; bottom: 0; display: flex; gap: var(--space-3); padding: var(--space-4) 0; background: linear-gradient(to top, var(--color-bg-page) 60%, transparent); }
</style>
