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
import { ref } from 'vue'
import StaticPage from './StaticPage.vue'

const open = ref(0)
const toggle = (i) => { open.value = open.value === i ? -1 : i }

const items = [
  { q: 'What is My Soccer Lab?', a: 'A personal analytics app for individual players. You log your matches and shots, and it turns them into a position-aware rating, heatmaps, xG, and AI coaching — plus a social feed called The Pitch.' },
  { q: 'How is my match rating calculated?', a: 'Every match gets a 1.0–10.0 rating from a position-aware engine that weighs goals, assists, passing, defending, and mistakes differently by your position. It is deliberately hard to max out — a 10 needs sustained quality, not one hot stat.' },
  { q: 'What is xG?', a: 'Expected goals — an estimate of how likely each shot was to score based on where it was taken. It helps you see whether you are finishing clinically or wasting good chances.' },
  { q: 'How do I log where things happened on the pitch?', a: 'In a match, use the map logger: tap the pitch to drop an event. Goals and shots also record where in the goal they went, and passes can record their direction. Switch to the Heatmap or Timeline tabs to review.' },
  { q: 'Who can see my matches?', a: 'Only you, unless you make your profile public or someone follows you — then your matches appear in their feed. You can go private again anytime from your Profile.' },
  { q: 'Do I need to log every single action?', a: 'No. Log as much or as little as you like. The more you log, the richer your heatmaps and stats — but even a quick scoreline and a couple of shots give you a rating.' },
  { q: 'Is my data safe and can I delete it?', a: 'Your data is private by default and protected by row-level security. You can edit or delete matches anytime, and delete your whole account from the Profile page. See our Privacy Policy for details.' },
  { q: 'Does the AI Coach really use my stats?', a: 'Yes — it reads your actual match history and position, so its advice and training plans are about your game, not generic tips.' }
]
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

@media (prefers-reduced-motion: reduce) {
  .faq__a-wrap, .faq__chevron { transition: none; }
}
</style>
