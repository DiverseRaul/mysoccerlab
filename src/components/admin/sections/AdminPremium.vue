<template>
  <section class="asec">
    <h2 class="asec__title">Premium screen</h2>

    <div class="acard">
      <h3 class="acard__title">Hero</h3>
      <AdminField label="Badge" v-model="draft.hero.badge" />
      <AdminField label="Title" v-model="draft.hero.title" />
      <AdminField label="Title accent" v-model="draft.hero.titleAccent" />
      <AdminField label="Subtitle" v-model="draft.hero.sub" multiline :rows="3" />
    </div>

    <div class="acard">
      <h3 class="acard__title">Features</h3>
      <div v-for="f in draft.features" :key="f.id" class="aitem">
        <span class="aitem__tag">{{ f.id }}</span>
        <AdminField label="Title" v-model="f.title" />
        <AdminField label="Text" v-model="f.text" multiline :rows="2" />
      </div>
    </div>

    <div class="acard">
      <h3 class="acard__title">Coach example (Free vs Pro)</h3>
      <AdminField label="Free reply" v-model="draft.examples.free" multiline :rows="2" />
      <AdminField v-for="(_, i) in draft.examples.pro" :key="i" :label="`Pro line ${i + 1}`" v-model="draft.examples.pro[i]" multiline :rows="2" />
    </div>

    <div class="acard">
      <h3 class="acard__title">Pricing</h3>
      <AdminField label="Currency symbol" v-model="draft.pricing.currency" />
      <AdminField label="Base $/month (1 month)" type="number" v-model="draft.pricing.base" />
      <AdminField label="Year total (12 months)" type="number" v-model="draft.pricing.year" />
      <AdminField label="Floor $/month (24 months)" type="number" v-model="draft.pricing.floor" />
      <AdminField label="Note" v-model="draft.pricing.note" />
      <div class="apreview">
        <span class="apreview__title">Per-month preview</span>
        <div class="apreview__row"><span>1 month</span><strong>{{ draft.pricing.currency }}{{ num(draft.pricing.base) }}/mo</strong></div>
        <div class="apreview__row"><span>12 months</span><strong>{{ draft.pricing.currency }}{{ num(draft.pricing.year / 12) }}/mo · {{ draft.pricing.currency }}{{ num(draft.pricing.year) }}</strong></div>
        <div class="apreview__row"><span>24 months</span><strong>{{ draft.pricing.currency }}{{ num(draft.pricing.floor) }}/mo</strong></div>
      </div>
    </div>

    <div class="acard">
      <h3 class="acard__title">Call to action</h3>
      <AdminField label="Button label" v-model="draft.cta.label" />
      <AdminField label="Fine print" v-model="draft.cta.fineprint" multiline :rows="2" />
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
const num = (v) => Number(v || 0).toFixed(2)
const draft = ref(clone(content.value.premium))
const saving = ref(false)
const saved = ref(false)

const reset = () => { draft.value = clone(content.value.premium) }
const save = async () => {
  saving.value = true
  if (!props.previewMode) await saveContent('premium', clone(draft.value))
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 1800)
}

onMounted(async () => {
  if (!props.previewMode) { await loadKey('premium'); draft.value = clone(content.value.premium) }
})
</script>

<style scoped>
.asec__title { margin: 0 0 var(--space-5); font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.acard { padding: var(--space-5); margin-bottom: var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.acard__title { margin: 0 0 var(--space-4); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }
.aitem { padding: var(--space-4); margin-bottom: var(--space-3); background: var(--color-bg-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.aitem__tag { display: inline-block; margin-bottom: var(--space-3); padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-accent-soft); color: var(--color-accent); font-size: 0.6rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.06em; }
.apreview { margin-top: var(--space-3); padding: var(--space-4); background: var(--color-bg-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.apreview__title { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.apreview__row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border-subtle); }
.apreview__row:last-child { border-bottom: none; }
.apreview__row span { color: var(--color-text-muted); }
.asave { position: sticky; bottom: 0; display: flex; gap: var(--space-3); padding: var(--space-4) 0; background: linear-gradient(to top, var(--color-bg-page) 60%, transparent); }
</style>
