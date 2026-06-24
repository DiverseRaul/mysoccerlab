<template>
  <div class="intro-overlay" data-testid="welcome-intro" @click.self="Skip" @keydown.esc="Skip">
    <div class="intro-card" role="dialog" aria-modal="true" :aria-label="ariaLabel">
      <button type="button" class="intro-skip" data-testid="intro-skip" @click="Skip">Skip intro</button>

      <!-- Phase 1: choose a path -->
      <div v-if="phase === 'choose'" data-testid="intro-choose">
        <div class="intro-art" v-html="ICON_BALL"></div>
        <h2 class="intro-title">What brings you here?</h2>
        <p class="intro-body">Pick what you want to start with — you can switch anytime.</p>

        <div class="intro-choices">
          <button
            v-for="c in Choices"
            :key="c.key"
            type="button"
            class="intro-choice"
            :data-testid="`intro-choice-${c.key}`"
            @click="choose(c.key)"
          >
            <span class="intro-choice__icon" aria-hidden="true">{{ c.icon }}</span>
            <span class="intro-choice__text">
              <span class="intro-choice__title">{{ c.title }}</span>
              <span class="intro-choice__desc">{{ c.desc }}</span>
            </span>
            <span class="intro-choice__chev" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <!-- Phase 2: guided tour for the chosen path -->
      <template v-else>
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
            type="button"
            class="intro-btn intro-btn--ghost"
            data-testid="intro-back"
            @click="Back"
          >Back</button>
          <button
            type="button"
            class="intro-btn intro-btn--primary"
            data-testid="intro-next"
            @click="Next"
          >{{ IsLastStep ? "Let's go" : 'Next' }}</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { content } from '../../lib/siteContent'

// Emits 'Done' with the chosen focus ('matches' | 'training' | 'both') so the
// dashboard can persist it and open in the matching mode. Skipping emits null.
const Emit = defineEmits(['Done'])

// ── Icons ───────────────────────────────────────────────────────────────────
const ICON_BALL    = '<i class="ph ph-soccer-ball"></i>'
const ICON_LOG     = '<i class="ph ph-calendar-check"></i>'
const ICON_SHOT    = '<i class="ph ph-crosshair"></i>'
const ICON_TREND   = '<i class="ph ph-trend-up"></i>'
const ICON_TARGET  = '<i class="ph ph-target"></i>'
const ICON_REPEAT  = '<i class="ph ph-repeat"></i>'
const ICON_SPARKLE = '<i class="ph ph-sparkle"></i>'

const COACH_STEP = {
  Title: 'AI Coach & The Pitch',
  Body: 'The AI Coach reads your actual numbers — matches, training, or both — and builds plans around your game. And on The Pitch you can follow other players and see their progress in your feed.',
  Icon: ICON_SPARKLE
}

// ── Step sets, branched by the path the player picks ──────────────────────────
const STEP_SETS = {
  matches: [
    { Title: 'Welcome to the Lab', Body: 'My Soccer Lab measures your game like a pro’s. First stop — set your position in your Profile, because everything here is rated position-by-position.', Icon: ICON_BALL },
    { Title: 'Log your matches', Body: 'After every game, open Dashboard → Matches and add it: score, position, minutes, key stats. It takes about thirty seconds while the result is still fresh.', Icon: ICON_LOG },
    { Title: 'Map every shot', Body: 'Drop your goals and shots on the pitch exactly where they happened. Over a season it builds your personal heatmap: where you score from, where you waste chances.', Icon: ICON_SHOT },
    { Title: 'Your rating, computed', Body: 'Every match gets a 1.0–10.0 rating from a position-aware engine — goals, passing, defending, mistakes, all of it. No mercy, no favours.', Icon: ICON_TREND },
    COACH_STEP
  ],
  training: [
    { Title: 'Welcome to the Lab', Body: 'You don’t need a single match to start. The Training pillar lets you track any drill and watch yourself get better, session by session.', Icon: ICON_BALL },
    { Title: 'Pick a drill', Body: 'Open Dashboard → Training → Drills and choose what you work on — juggles, sprint times, shooting accuracy, passing. Start from a preset or build your own.', Icon: ICON_TARGET },
    { Title: 'Log a session', Body: 'Each time you practice, log the result — a count, a time, or shots placed on the goal. Thirty seconds and you’re done.', Icon: ICON_LOG },
    { Title: 'Watch yourself improve', Body: 'Your Training overview tracks streaks, personal bests, and trend lines for every drill — proof you’re getting better, not just busy.', Icon: ICON_REPEAT },
    COACH_STEP
  ],
  both: [
    { Title: 'Welcome to the Lab', Body: 'Two ways to grow, in one place. Set your position in your Profile first — everything here is rated position-by-position.', Icon: ICON_BALL },
    { Title: 'Track your matches', Body: 'Log games, map every shot, and get an honest 1.0–10.0 rating from a position-aware engine. Dashboard → Matches.', Icon: ICON_LOG },
    { Title: 'Train between games', Body: 'Track drills — juggles, sprints, shooting — and watch streaks, personal bests and trends climb. Dashboard → Training.', Icon: ICON_TARGET },
    COACH_STEP
  ]
}

const CHOICES = [
  { key: 'matches',  icon: '⚽', title: 'Track my matches',       desc: 'Log games, map shots, get rated.' },
  { key: 'training', icon: '🎯', title: 'Improve through training', desc: 'Track drills and level up over time.' },
  { key: 'both',     icon: '✨', title: 'Both',                    desc: 'Matches and training together.' }
]

// Icons stay in-component (admins edit copy, not raw SVG): resolved by path +
// step index, with a fixed emoji per choice key.
const ICON_BY_PATH = {
  matches:  [ICON_BALL, ICON_LOG, ICON_SHOT, ICON_TREND, ICON_SPARKLE],
  training: [ICON_BALL, ICON_TARGET, ICON_LOG, ICON_REPEAT, ICON_SPARKLE],
  both:     [ICON_BALL, ICON_LOG, ICON_TARGET, ICON_SPARKLE]
}
const CHOICE_ICON = { matches: '⚽', training: '🎯', both: '✨' }

const phase = ref('choose')        // 'choose' → 'tour'
const focus = ref('both')
const StepIndex = ref(0)

// Choices + steps come from admin-editable site content, falling back to the
// hardcoded constants so a missing/blank `intro` row never breaks onboarding.
const Choices = computed(() => {
  const fromContent = content.value?.intro?.choices
  if (Array.isArray(fromContent) && fromContent.length) {
    return fromContent.map(c => ({ ...c, icon: CHOICE_ICON[c.key] || '✦' }))
  }
  return CHOICES
})

const Steps = computed(() => {
  const fromContent = content.value?.intro?.steps?.[focus.value]
  const icons = ICON_BY_PATH[focus.value] || ICON_BY_PATH.both
  if (Array.isArray(fromContent) && fromContent.length) {
    return fromContent.map((s, i) => ({ Title: s.title, Body: s.body, Icon: icons[i] || ICON_BALL }))
  }
  return STEP_SETS[focus.value] || STEP_SETS.both
})
const CurrentStep = computed(() => Steps.value[StepIndex.value])
const IsLastStep = computed(() => StepIndex.value === Steps.value.length - 1)
const ariaLabel = computed(() =>
  phase.value === 'choose'
    ? 'Choose what to start with'
    : `Intro step ${StepIndex.value + 1} of ${Steps.value.length}: ${CurrentStep.value.Title}`
)

const choose = (key) => {
  focus.value = key
  StepIndex.value = 0
  phase.value = 'tour'
}

const Next = () => {
  if (IsLastStep.value) Emit('Done', focus.value)
  else StepIndex.value++
}

const Back = () => {
  if (StepIndex.value > 0) StepIndex.value--
  else phase.value = 'choose'   // back from the first tour step returns to the chooser
}

const Skip = () => Emit('Done', null)
</script>

<style scoped>
.intro-overlay {
  position: fixed;
  inset: 0;
  /* Above the floating nav (2100) and route splash (2000) — the onboarding
     modal must cover the whole app, or the fixed bottom nav intercepts taps on
     the intro's buttons (its z-index was 1000, below the nav). */
  z-index: 2600;
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

.intro-art :deep(i) {
  font-size: 42px;
  line-height: 1;
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

.intro-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 4px 0 8px;
  text-align: left;
}

.intro-choice {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  color: var(--color-text-primary);
  transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.intro-choice:hover {
  border-color: var(--color-accent-border);
  background: var(--color-accent-soft);
  transform: translateY(-1px);
}

.intro-choice__icon {
  font-size: 1.6rem;
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-3);
  border-radius: var(--radius-md);
}

.intro-choice__text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.intro-choice__title { font-weight: var(--font-weight-bold); font-size: var(--font-size-base); }
.intro-choice__desc { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.intro-choice__chev { color: var(--color-accent); font-weight: var(--font-weight-bold); }

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
