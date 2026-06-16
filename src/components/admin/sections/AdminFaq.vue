<template>
  <section class="asec">
    <h2 class="asec__title">FAQ</h2>

    <div v-for="(item, i) in draft.items" :key="i" class="acard">
      <div class="acard__head">
        <span class="acard__num">Q{{ i + 1 }}</span>
        <button type="button" class="acard__del" aria-label="Remove question" @click="draft.items.splice(i, 1)">✕</button>
      </div>
      <AdminField label="Question" v-model="item.q" />
      <AdminField label="Answer" v-model="item.a" multiline :rows="3" />
    </div>

    <button type="button" class="btn btn-ghost" @click="draft.items.push({ q: '', a: '' })">+ Add question</button>

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
const draft = ref(clone(content.value.faq))
const saving = ref(false)
const saved = ref(false)

const reset = () => { draft.value = clone(content.value.faq) }
const save = async () => {
  saving.value = true
  const cleaned = { items: draft.value.items.filter((it) => (it.q || '').trim() || (it.a || '').trim()) }
  if (!props.previewMode) await saveContent('faq', clone(cleaned))
  else draft.value = cleaned
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) { await loadKey('faq'); draft.value = clone(content.value.faq) }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.acard { padding: var(--space-5); margin-bottom: var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.acard__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.acard__num { padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-accent-soft); color: var(--color-accent); font-size: 0.6rem; font-weight: var(--font-weight-bold); letter-spacing: 0.06em; }
.acard__del { width: 30px; height: 30px; border: 1px solid var(--color-border-soft); background: transparent; color: var(--color-text-muted); border-radius: var(--radius-sm); cursor: pointer; }
.acard__del:hover { color: var(--color-danger); border-color: rgba(239,83,80,0.4); }
.asave { position: sticky; bottom: 0; display: flex; gap: var(--space-3); margin-top: var(--space-4); padding: var(--space-4) 0; background: linear-gradient(to top, var(--color-bg-page) 60%, transparent); }
</style>
