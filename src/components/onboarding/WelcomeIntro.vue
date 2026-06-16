<template>
  <div class="intro-overlay" data-testid="welcome-intro" @click.self="Skip" @keydown.esc="Skip">
    <div class="intro-card" role="dialog" aria-modal="true" :aria-label="`Intro step ${StepIndex + 1} of ${Steps.length}: ${CurrentStep.Title}`">
      <button type="button" class="intro-skip" data-testid="intro-skip" @click="Skip">Skip intro</button>

      <div class="intro-art" :key="StepIndex" v-html="CurrentStep.Icon"></div>

      <p class="intro-count">{{ StepIndex + 1 }} / {{ Steps.length }}</p>
      <h2 class="intro-title">{{ CurrentStep.Title }}</h2>
      <p class="intro-body">{{ CurrentStep.Body }}</p>

      <div class="intro-dots" aria-hidden="true">
        <span
          v-for="(Step, Index) in Steps"
          :key="Step.Title"
          class="intro-dot"
          :class="{ 'is-active': Index === StepIndex }"
        ></span>
      </div>

      <div class="intro-nav">
        <button
          v-if="StepIndex > 0"
          type="button"
          class="intro-btn intro-btn--ghost"
          data-testid="intro-back"
          @click="StepIndex--"
        >Back</button>
        <button
          type="button"
          class="intro-btn intro-btn--primary"
          data-testid="intro-next"
          @click="Next"
        >{{ IsLastStep ? "Let's go" : 'Next' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const Emit = defineEmits(['Done'])

const Steps = [
  {
    Title: 'Welcome to the Lab',
    Body: 'My Soccer Lab is your personal analytics HQ: log your matches, map every shot, and watch your game get measured like a pro’s. First stop — set your position in your Profile, because everything here is rated position-by-position.',
    Icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7l4.5 3.3-1.7 5.4h-5.6L7.5 10.3z"/></svg>'
  },
  {
    Title: 'Log your matches',
    Body: 'After every game, open Dashboard → Matches and add it: score, position, minutes, key stats. It takes about thirty seconds while the result is still fresh.',
    Icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><path d="M9 14.5l2 2 4-4"/></svg>'
  },
  {
    Title: 'Map every shot',
    Body: 'Drop your goals and shots on the pitch exactly where they happened — same as the demo on the home page. Over a season it builds your personal heatmap: where you score from, where you waste chances.',
    Icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="1.5"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="12" cy="12" r="2.4"/><circle cx="14.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>'
  },
  {
    Title: 'Your rating, computed',
    Body: 'Every match gets a 1.0–10.0 rating from a position-aware engine — goals, passing, defending, mistakes, all of it. No mercy, no favours. Track it match by match and season by season.',
    Icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>'
  },
  {
    Title: 'AI Coach & The Pitch',
    Body: 'The sparkle button opens your AI coach — it reads your actual numbers and builds training plans around your position. And on The Pitch, follow other players and see their matches in your feed.',
    Icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M18.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>'
  }
]

const StepIndex = ref(0)
const CurrentStep = computed(() => Steps[StepIndex.value])
const IsLastStep = computed(() => StepIndex.value === Steps.length - 1)

const Next = () => {
  if (IsLastStep.value) {
    Emit('Done')
  } else {
    StepIndex.value++
  }
}

const Skip = () => Emit('Done')
</script>

<style scoped>
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 4, 3, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: intro-fade 0.3s ease-out;
}

.intro-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 44px 28px 28px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  animation: intro-pop 0.35s ease-out;
}

.intro-skip {
  position: absolute;
  top: 10px;
  right: 10px;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--color-text-faint);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  border-radius: var(--radius-pill);
  transition: color 0.2s ease;
}

.intro-skip:hover {
  color: var(--color-text-primary);
}

.intro-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  animation: intro-pop 0.35s ease-out;
}

.intro-art :deep(svg) {
  width: 42px;
  height: 42px;
}

.intro-count {
  margin: 0 0 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  color: var(--color-text-faint);
}

.intro-title {
  margin: 0 0 10px;
  font-size: 1.45rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.intro-body {
  margin: 0 auto 22px;
  max-width: 360px;
  font-size: var(--font-size-sm);
  line-height: 1.65;
  color: var(--color-text-muted);
}

.intro-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-bottom: 20px;
}

.intro-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-border-soft);
  transition: background 0.25s ease, transform 0.25s ease;
}

.intro-dot.is-active {
  background: var(--color-accent);
  transform: scale(1.25);
}

.intro-nav {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.intro-btn {
  min-height: 48px;
  padding: 12px 28px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.intro-btn--ghost {
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
}

.intro-btn--ghost:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.intro-btn--primary {
  flex: 1;
  max-width: 220px;
  background: var(--color-accent);
  border: none;
  color: var(--color-on-accent);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent-deep) 40%, transparent);
}

.intro-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--color-accent-deep) 50%, transparent);
}

@keyframes intro-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes intro-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .intro-overlay,
  .intro-card,
  .intro-art {
    animation: none;
  }
}

@media (max-width: 480px) {
  .intro-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .intro-card {
    max-width: none;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    border-bottom: none;
    padding-bottom: max(28px, env(safe-area-inset-bottom));
  }
}
</style>
