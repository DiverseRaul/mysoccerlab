<template>
  <section class="asec">
    <h2 class="asec__title">Welcome Intro</h2>

    <div class="acard">
      <span class="acard__num">Visibility</span>
      <AdminField
        type="checkbox"
        label="Show the intro to new players"
        v-model="draft.enabled"
        helper="Master switch. Off hides the intro for everyone, even players who haven't seen it."
      />
      <AdminField
        type="checkbox"
        label="Admins re-see it on every refresh (testing)"
        v-model="draft.forceShowForAdmins"
        helper="When on, admin accounts get the intro on every dashboard load. Normal players still see it only once."
      />
    </div>

    <div class="acard">
      <span class="acard__num">First screen — “What brings you here?”</span>
      <div v-for="(c, i) in draft.choices" :key="c.key || i" class="aitem">
        <span class="aitem__tag">{{ c.key }}</span>
        <AdminField label="Title" v-model="c.title" />
        <AdminField label="Description" v-model="c.desc" />
      </div>
    </div>

    <div v-for="path in PATHS" :key="path.key" class="acard">
      <span class="acard__num">{{ path.label }} path — steps</span>
      <div v-for="(step, i) in draft.steps[path.key]" :key="i" class="aitem">
        <div class="aitem__head">
          <span class="aitem__tag">Step {{ i + 1 }}</span>
        </div>
        <AdminField label="Title" v-model="step.title" />
        <AdminField label="Body" v-model="step.body" multiline :rows="3" />
      </div>
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
const PATHS = [
  { key: 'matches', label: 'Matches' },
  { key: 'training', label: 'Training' },
  { key: 'both', label: 'Both' }
]

const clone = (o) => JSON.parse(JSON.stringify(o))
const draft = ref(clone(content.value.intro))
const saving = ref(false)
const saved = ref(false)

const reset = () => { draft.value = clone(content.value.intro) }

const save = async () => {
  saving.value = true
  if (!props.previewMode) await saveContent('intro', clone(draft.value))
  else content.value = { ...content.value, intro: clone(draft.value) }
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) { await loadKey('intro'); draft.value = clone(content.value.intro) }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.acard { padding: var(--space-5); margin-bottom: var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.acard__num { display: inline-block; margin-bottom: var(--space-4); padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-accent-soft); color: var(--color-accent); font-size: 0.6rem; font-weight: var(--font-weight-bold); letter-spacing: 0.06em; text-transform: uppercase; }
.aitem { padding: var(--space-4); margin-bottom: var(--space-3); background: var(--color-bg-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.aitem__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
.aitem__tag { display: inline-block; margin-bottom: var(--space-2); padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); color: var(--color-text-muted); font-size: 0.6rem; font-weight: var(--font-weight-bold); letter-spacing: 0.06em; text-transform: uppercase; }
.asave { position: sticky; bottom: 0; display: flex; gap: var(--space-3); margin-top: var(--space-4); padding: var(--space-4) 0; background: linear-gradient(to top, var(--color-bg-page) 60%, transparent); }
</style>
