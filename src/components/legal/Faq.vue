<template>
  <StaticPage title="FAQ" subtitle="Answers to the common questions">
    <ul class="faq">
      <li v-for="(item, i) in items" :key="i" class="faq__item" :class="{ 'is-open': open === i }">
        <button type="button" class="faq__q" :aria-expanded="open === i" @click="toggle(i)">
          <span>{{ item.q }}</span>
          <svg class="faq__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        <div class="faq__a-wrap" :class="{ 'is-open': open === i }">
          <div class="faq__a-inner">
            <p class="faq__a">{{ item.a }}</p>
          </div>
        </div>
      </li>
    </ul>
  </StaticPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StaticPage from './StaticPage.vue'
import { content, loadKey } from '../../lib/siteContent'

const open = ref(0)
const toggle = (i) => { open.value = open.value === i ? -1 : i }

// Editable copy (admin → site_content 'faq'); falls back to baked-in defaults.
const items = computed(() => content.value.faq.items)

onMounted(() => loadKey('faq'))
</script>

<style scoped>
.faq {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.faq__item {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-2);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.faq__item.is-open { border-color: var(--color-accent-border); }

.faq__q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.faq__chevron {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  transition: transform 0.25s ease;
}

.faq__item.is-open .faq__chevron {
  transform: rotate(180deg);
  color: var(--color-accent);
}

.faq__a-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease;
}

.faq__a-wrap.is-open { grid-template-rows: 1fr; }

.faq__a-inner { overflow: hidden; }

.faq__a {
  margin: 0;
  padding: 0 var(--space-4) var(--space-4);
  line-height: 1.7;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
