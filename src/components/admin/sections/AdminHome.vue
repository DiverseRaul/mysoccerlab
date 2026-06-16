<template>
  <section class="asec">
    <h2 class="asec__title">Home page</h2>

    <div class="acard">
      <h3 class="acard__title">Hero</h3>
      <AdminField label="Eyebrow" v-model="draft.hero.eyebrow" />
      <AdminField label="Title" v-model="draft.hero.title" />
      <AdminField label="Title accent (coloured part)" v-model="draft.hero.titleAccent" />
      <AdminField label="Subtitle" v-model="draft.hero.sub" multiline :rows="3" />
      <AdminField label="Primary CTA label" v-model="draft.hero.ctaPrimary" />
      <AdminField label="Scroll hint" v-model="draft.hero.scrollHint" />
    </div>

    <div class="acard">
      <h3 class="acard__title">Showcase heading</h3>
      <AdminField label="Eyebrow" v-model="draft.showcase.eyebrow" />
      <AdminField label="Title" v-model="draft.showcase.title" />
    </div>

    <div class="acard">
      <h3 class="acard__title">Feature slides</h3>
      <div v-for="(f, i) in draft.features" :key="f.key" class="aitem">
        <span class="aitem__tag">{{ f.key }}</span>
        <AdminField label="Tag" v-model="f.tag" />
        <AdminField label="Title" v-model="f.title" />
        <AdminField label="Text" v-model="f.text" multiline :rows="2" />
      </div>
    </div>

    <div class="acard">
      <h3 class="acard__title">Closing banner</h3>
      <AdminField label="Title" v-model="draft.ctaBand.title" />
      <AdminField label="Subtitle" v-model="draft.ctaBand.sub" multiline :rows="2" />
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
const draft = ref(clone(content.value.home))
const saving = ref(false)
const saved = ref(false)

const reset = () => { draft.value = clone(content.value.home) }
const save = async () => {
  saving.value = true
  if (!props.previewMode) await saveContent('home', clone(draft.value))
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) { await loadKey('home'); draft.value = clone(content.value.home) }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.acard {
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}
.acard__title { margin: 0 0 var(--space-4); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }
.aitem {
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  position: relative;
}
.aitem__tag {
  display: inline-block; margin-bottom: var(--space-3);
  padding: 2px 8px; border-radius: var(--radius-pill);
  background: var(--color-accent-soft); color: var(--color-accent);
  font-size: 0.6rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.06em;
}
.asave {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  background: linear-gradient(to top, var(--color-bg-page) 60%, transparent);
}
</style>
