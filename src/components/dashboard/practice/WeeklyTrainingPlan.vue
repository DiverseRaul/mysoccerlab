<template>
  <div class="weekly-plan" data-testid="weekly-plan">
    <div v-if="loading" class="wp-skel">
      <Skeleton height="40px" radius="var(--radius-md)" />
      <Skeleton height="220px" radius="var(--radius-md)" />
    </div>

    <template v-else>
      <header class="wp-head">
        <div>
          <h2 class="wp-title">Weekly Plan</h2>
          <p class="wp-sub">One focus for the week — a drill a day, built by AI around your game.</p>
        </div>
        <button
          v-if="plan.length"
          type="button"
          class="wp-regen"
          :disabled="generating"
          data-testid="weekly-plan-regenerate"
          @click="openWizard"
        >Change focus</button>
      </header>

      <!-- Step-by-step setup wizard (no plan yet, or changing focus) -->
      <div v-if="!plan.length || showPicker" class="wp-picker" data-testid="weekly-plan-picker">
        <div class="wp-steps" aria-hidden="true">
          <span
            v-for="(s, i) in STEPS"
            :key="s.key"
            class="wp-step-dot"
            :class="{ 'is-active': i === step, 'is-done': i < step }"
          ></span>
        </div>
        <p class="wp-step-count">Step {{ step + 1 }} of {{ STEPS.length }}</p>
        <h3 class="wp-step-title">{{ STEPS[step].title }}</h3>

        <!-- 1. Focus -->
        <div v-if="STEPS[step].key === 'focus'">
          <div v-for="section in FOCUS_SECTIONS" :key="section.title" class="wp-section">
            <h4 class="wp-section__title">{{ section.title }}</h4>
            <div class="wp-chips">
              <button
                v-for="a in section.aspects"
                :key="a"
                type="button"
                class="wp-chip"
                :class="{ 'is-active': focus === a }"
                :data-testid="`weekly-focus-${a.toLowerCase().replace(/[^a-z]+/g, '-')}`"
                @click="selectFocus(a)"
              >{{ a }}</button>
            </div>
          </div>
          <div class="wp-section">
            <h4 class="wp-section__title">Something else</h4>
            <input
              v-model="customFocus"
              type="text"
              class="wp-custom"
              placeholder="Type your own focus, e.g. long-range shooting"
              data-testid="weekly-focus-custom"
              @input="onCustomInput"
            />
          </div>
        </div>

        <!-- 2. Sessions per week -->
        <div v-else-if="STEPS[step].key === 'sessions'" class="wp-chips wp-chips--lg">
          <button
            v-for="n in [2, 3, 4, 5, 6, 7]"
            :key="n"
            type="button"
            class="wp-chip"
            :class="{ 'is-active': daysPerWeek === n }"
            @click="daysPerWeek = n"
          >{{ n }} days</button>
        </div>

        <!-- 3. Minutes per session -->
        <div v-else-if="STEPS[step].key === 'minutes'" class="wp-chips wp-chips--lg">
          <button
            v-for="n in [20, 30, 45, 60, 90]"
            :key="n"
            type="button"
            class="wp-chip"
            :class="{ 'is-active': minutesPerSession === n }"
            @click="minutesPerSession = n"
          >{{ n }} min</button>
        </div>

        <!-- 4. Intensity -->
        <div v-else-if="STEPS[step].key === 'intensity'" class="wp-chips wp-chips--lg">
          <button
            v-for="lvl in ['Easy', 'Moderate', 'Hard']"
            :key="lvl"
            type="button"
            class="wp-chip"
            :class="{ 'is-active': intensity === lvl }"
            @click="intensity = lvl"
          >{{ lvl }}</button>
        </div>

        <!-- 5. Equipment / where (choose any that apply) -->
        <div v-else-if="STEPS[step].key === 'equipment'">
          <p class="wp-multi-hint">Pick everything you have — choose as many as apply.</p>
          <div class="wp-chips wp-chips--lg">
            <button
              v-for="eq in EQUIPMENT"
              :key="eq"
              type="button"
              class="wp-chip"
              :class="{ 'is-active': equipment.includes(eq) }"
              @click="toggleEquipment(eq)"
            >{{ eq }}</button>
          </div>
        </div>

        <div class="wp-wizard-nav">
          <button
            v-if="step > 0"
            type="button"
            class="wp-regen"
            data-testid="weekly-plan-back"
            @click="step--"
          >Back</button>
          <button
            v-if="!isLastStep"
            type="button"
            class="wp-generate"
            :disabled="!canAdvance"
            data-testid="weekly-plan-next"
            @click="step++"
          >Next</button>
          <button
            v-else
            type="button"
            class="wp-generate"
            :disabled="!focus || generating"
            data-testid="weekly-plan-generate"
            @click="generate"
          >{{ generating ? 'Building your week…' : 'Generate plan' }}</button>
        </div>
        <p v-if="error" class="wp-error">{{ error }}</p>
      </div>

      <!-- Generated plan -->
      <div v-else class="wp-result">
        <div class="wp-focus-row">
          <span class="wp-focus-tag">Focus</span>
          <span class="wp-focus-name">{{ focus }}</span>
          <button
            type="button"
            class="wp-regen wp-regen--inline"
            :disabled="generating"
            data-testid="weekly-plan-regenerate-inline"
            @click="generate"
          >{{ generating ? 'Regenerating…' : 'Regenerate' }}</button>
        </div>
        <TrainingPlanCard :TrainingSessions="plan" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'
import { ResolveSession } from '../../../lib/authSession'
import { generateCoachResponse } from '../../../lib/gemini'
import { parseCalendar, buildWeeklyPlanPrompt } from '../../../lib/trainingPlan'
import { practiceCoachSummary } from '../../../lib/practiceFormat'
import TrainingPlanCard from '../../TrainingPlanCard.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { toast } from '../../../lib/toast'

defineProps({ userName: { type: String, default: '' } })

// Improvement areas grouped into sections; the player picks one (or types a
// custom focus). The whole week then builds toward that single focus.
const FOCUS_SECTIONS = [
  { title: 'Attacking', aspects: ['Finishing', 'Dribbling', 'Heading', 'Weak foot'] },
  { title: 'Creating', aspects: ['Passing', 'Crossing', 'First touch', 'Set pieces'] },
  { title: 'Physical', aspects: ['Pace & acceleration', 'Stamina', 'Strength', 'Agility'] },
  { title: 'Defending', aspects: ['Tackling', 'Positioning', 'Marking', 'Aerial duels'] },
  { title: 'Goalkeeping', aspects: ['Shot stopping', 'Handling', 'Distribution'] }
]

const EQUIPMENT = ['Just a ball', 'Ball + goal', 'Cones / markers', 'Gym / weights']

// Setup wizard: one question per step, advanced with Next.
const STEPS = [
  { key: 'focus', title: 'What do you want to improve?' },
  { key: 'sessions', title: 'How many sessions per week?' },
  { key: 'minutes', title: 'How long is each session?' },
  { key: 'intensity', title: 'How hard should it be?' },
  { key: 'equipment', title: 'What can you train with?' }
]

const loading = ref(true)
const generating = ref(false)
const error = ref('')
const showPicker = ref(false)
const step = ref(0)
const focus = ref('')
const customFocus = ref('')

// AI plan parameters chosen by the player.
const daysPerWeek = ref(4)
const minutesPerSession = ref(45)
const intensity = ref('Moderate')
const equipment = ref([])   // multi-select: a player can have ball + goals + cones + gym

const toggleEquipment = (eq) => {
  const i = equipment.value.indexOf(eq)
  if (i === -1) equipment.value.push(eq)
  else equipment.value.splice(i, 1)
}

const isLastStep = computed(() => step.value === STEPS.length - 1)
// Only the focus step requires a value before advancing; the rest have defaults.
const canAdvance = computed(() => STEPS[step.value].key !== 'focus' || !!focus.value)

const selectFocus = (aspect) => { focus.value = aspect; customFocus.value = '' }
const onCustomInput = () => { focus.value = customFocus.value.trim() }
const openWizard = () => { step.value = 0; showPicker.value = true }
const plan = ref([])

const userId = ref(null)
const profile = ref({ position: '', preferredFoot: '', clubTeam: '' })
const playerName = ref('Player')
const matches = ref([])
const practiceSummary = ref([])

// Monday of the current week (local), as a YYYY-MM-DD string.
const weekStart = () => {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const loadAll = async () => {
  loading.value = true
  try {
    const session = await ResolveSession()
    if (!session) return
    const user = session.user
    userId.value = user.id
    playerName.value = (user.email || 'Player').split('@')[0] || 'Player'

    const [{ data: prof }, { data: savedPlan }, { data: drills }, { data: matchRows }] = await Promise.all([
      supabase.from('user_profiles').select('player_name, position, preferred_foot, club_team').eq('user_id', user.id).single(),
      supabase.from('training_plans').select('focus, plan').eq('user_id', user.id).maybeSingle(),
      supabase.from('practice_drills').select('*').eq('user_id', user.id).eq('archived', false),
      supabase.from('matches').select('*').eq('user_id', user.id).order('match_date', { ascending: false }).limit(30)
    ])

    if (prof) {
      playerName.value = prof.player_name || playerName.value
      profile.value = { position: prof.position || '', preferredFoot: prof.preferred_foot || '', clubTeam: prof.club_team || '' }
    }
    matches.value = matchRows || []

    if (drills && drills.length) {
      const drillIds = drills.map(d => d.id)
      const { data: sessions } = await supabase
        .from('practice_sessions').select('*').in('drill_id', drillIds).order('session_date', { ascending: true })
      practiceSummary.value = practiceCoachSummary(drills, sessions || [])
    }

    if (savedPlan?.plan?.length) {
      plan.value = savedPlan.plan
      focus.value = savedPlan.focus || ''
    }
  } finally {
    loading.value = false
  }
}

const generate = async () => {
  if (!focus.value || generating.value) return
  generating.value = true
  error.value = ''
  try {
    const prompt = buildWeeklyPlanPrompt(focus.value, practiceSummary.value, {
      daysPerWeek: daysPerWeek.value,
      minutesPerSession: minutesPerSession.value,
      intensity: intensity.value,
      equipment: equipment.value.join(', ')
    })
    const text = await generateCoachResponse(
      [{ text: prompt }], matches.value, playerName.value, profile.value, [], undefined, practiceSummary.value
    )
    const days = parseCalendar(text)
    if (!days.length) { error.value = 'The coach didn’t return a usable plan — try again.'; return }
    plan.value = days
    showPicker.value = false
    step.value = 0

    if (userId.value) {
      const { error: saveErr } = await supabase.from('training_plans').upsert(
        { user_id: userId.value, focus: focus.value, plan: days, week_start: weekStart() },
        { onConflict: 'user_id' }
      )
      if (saveErr) console.error('Could not save training plan:', saveErr.message)
    }
  } catch (e) {
    console.error('Weekly plan generation failed:', e)
    error.value = 'Couldn’t reach the coach right now. Try again in a moment.'
    toast.error('Couldn’t generate your plan.')
  } finally {
    generating.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.weekly-plan { color: var(--color-text-primary); }

.wp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); }
.wp-title { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); }
.wp-sub { margin: 4px 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }

.wp-picker {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.wp-picker__label { margin: 0 0 var(--space-4); font-weight: var(--font-weight-semibold); }

.wp-section { margin-bottom: var(--space-4); }
.wp-section__title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
}

.wp-custom {
  width: 100%;
  box-sizing: border-box;
  background: var(--color-bg-field, var(--color-bg-surface-2));
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-sm);
}
.wp-custom:focus { outline: none; border-color: var(--color-accent-border); box-shadow: 0 0 0 3px var(--color-accent-soft); }

.wp-actions { display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-4); flex-wrap: wrap; }
.wp-chosen { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.wp-chosen strong { color: var(--color-accent); }

.wp-chips { display: flex; flex-wrap: wrap; gap: var(--space-3); }

/* Wizard */
.wp-steps { display: flex; gap: 6px; margin-bottom: var(--space-3); }
.wp-step-dot { width: 28px; height: 4px; border-radius: 999px; background: var(--color-bg-surface-3); transition: background 0.2s ease; }
.wp-step-dot.is-active { background: var(--color-accent); }
.wp-step-dot.is-done { background: var(--color-accent-border); }
.wp-step-count { margin: 0 0 4px; font-size: var(--font-size-xs); letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-faint); font-weight: var(--font-weight-bold); }
.wp-step-title { margin: 0 0 var(--space-4); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }

.wp-multi-hint { margin: 0 0 var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); }
.wp-chips--lg { gap: var(--space-3); }
.wp-chips--lg .wp-chip { padding: 12px 22px; font-size: var(--font-size-base); }

.wp-wizard-nav { display: flex; gap: var(--space-3); margin-top: var(--space-5); align-items: center; }
.wp-wizard-nav .wp-regen { margin-left: 0; }
.wp-wizard-nav .wp-generate { margin-left: auto; }
.wp-chip {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.wp-chip:hover { border-color: var(--color-accent-border); color: var(--color-text-primary); }
.wp-chip.is-active { background: var(--color-accent); color: var(--color-on-accent); border-color: var(--color-accent); }

.wp-generate {
  background: var(--color-accent);
  color: var(--color-on-accent);
  border: none;
  padding: 12px var(--space-6);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  font-family: inherit;
  cursor: pointer;
}
.wp-generate:disabled { opacity: 0.6; cursor: default; }
.wp-generate:hover:not(:disabled) { background: var(--color-accent-strong); }

.wp-error { margin: var(--space-3) 0 0; color: var(--color-danger); font-size: var(--font-size-sm); }

.wp-focus-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.wp-focus-tag { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); }
.wp-focus-name { font-weight: var(--font-weight-bold); color: var(--color-accent); }

.wp-regen {
  margin-left: auto;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.wp-regen--inline { margin-left: auto; }
.wp-regen:hover:not(:disabled) { border-color: var(--color-accent-border); color: var(--color-text-primary); }
.wp-regen:disabled { opacity: 0.6; cursor: default; }

.wp-skel { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
