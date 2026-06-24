<template>
  <article class="pitch-card" :class="[ResultModifier, TierClass]" :style="EntranceStyle" data-testid="feed-card">
    <header class="pitch-card__head">
      <button type="button" class="pitch-card__author" data-testid="feed-card-author" @click="Emit('view-profile', Match.user_id)">
        <div class="pitch-card__avatar">{{ Initials }}</div>
        <div class="pitch-card__identity">
          <span class="pitch-card__namerow">
            <span class="pitch-card__name">{{ DisplayName }}</span>
            <ProBadge v-if="IsAuthorPro" small />
          </span>
          <span class="pitch-card__meta">{{ Position }} · {{ RelativeDate }}</span>
        </div>
      </button>
      <ResultBadge :result="ResultKey" />
    </header>

    <MatchHero
      class="pitch-card__hero"
      :Match="Match"
      :Rating="Rating"
      :RatingTier="TierClass"
      :MyTeamLabel="FirstName"
    />

    <button
      type="button"
      class="pitch-card__toggle"
      :class="{ 'is-open': Expanded }"
      :aria-expanded="Expanded"
      data-testid="feed-shotmap-toggle"
      @click="ToggleMap"
    >
      <i class="pitch-card__toggle-icon ph ph-caret-down" aria-hidden="true"></i>
      {{ Expanded ? 'Hide Heatmap & Shots' : 'View Heatmap & Shots' }}
    </button>

    <div class="pitch-card__accordion" :class="{ 'is-open': Expanded }">
      <div class="pitch-card__accordion-inner">
        <div v-if="Expanded" class="pitch-card__map" data-testid="feed-shotmap">
          <div v-if="ShotData === null" class="pitch-card__map-loading">
            <span class="pitch-card__map-spinner"></span>
            Loading shot map…
          </div>
          <MiniShotMap v-else :goals="ShotData.goals || []" :shots="ShotData.shots || []" :heatmap="ShotData.heatmap || []" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResultBadge from './ResultBadge.vue'
import MatchHero from './MatchHero.vue'
import MiniShotMap from './MiniShotMap.vue'
import ProBadge from './ProBadge.vue'
import { calculateMatchRating, getRatingColor } from '../../lib/rating'

const Props = defineProps({
  Match: {
    type: Object,
    required: true
  },
  Index: {
    type: Number,
    default: 0
  },
  // { goals, shots } once loaded by the parent; null while not yet fetched.
  ShotData: {
    type: Object,
    default: null
  },
  // When true the shot map / heatmap starts expanded (the feed batch-loads
  // data up front, so every card shows its map without an extra tap).
  DefaultOpen: {
    type: Boolean,
    default: false
  }
})

const Emit = defineEmits(['load-shotmap', 'view-profile', 'expand'])

const Expanded = ref(Props.DefaultOpen)
const Requested = ref(false)
const ExpandLogged = ref(false)

const ToggleMap = () => {
  Expanded.value = !Expanded.value
  if (Expanded.value) {
    if (!ExpandLogged.value) { ExpandLogged.value = true; Emit('expand') }
    if (!Requested.value && Props.ShotData === null) {
      Requested.value = true
      Emit('load-shotmap', Props.Match.id)
    }
  }
}

const EntranceStyle = computed(() => ({
  animationDelay: `${Math.min(Props.Index, 8) * 0.06}s`
}))

const DisplayName = computed(() => {
  const Profile = Props.Match.profile || {}
  if (Profile.player_name) return Profile.player_name
  if (Profile.email) return Profile.email.split('@')[0]
  return 'Player'
})

const Position = computed(() => Props.Match.profile?.position || 'Player')
const IsAuthorPro = computed(() => Props.Match.profile?.subscription_tier === 'pro')

// The scoreline's "home" label. On the feed this card is someone else's match,
// so use their first name (not "You").
const FirstName = computed(() => {
  const Name = DisplayName.value || ''
  return Name.trim().split(/\s+/)[0] || 'Them'
})

const Initials = computed(() => {
  const Source = Props.Match.profile?.player_name || Props.Match.profile?.email
  if (!Source) return '?'
  return Source.substring(0, 2).toUpperCase()
})

const ResultKey = computed(() => {
  const For = Props.Match.score_for ?? 0
  const Against = Props.Match.score_against ?? 0
  if (For > Against) return 'win'
  if (For < Against) return 'loss'
  return 'draw'
})

const ResultModifier = computed(() => `pitch-card--${ResultKey.value}`)

// Canonical, position-aware rating (same engine as the dashboard) so the
// feed's number and tier tint match the rest of the app.
const Rating = computed(() => calculateMatchRating(Props.Match))
const TierClass = computed(() => getRatingColor(Rating.value))

const RelativeDate = computed(() => {
  const Raw = Props.Match.match_date
  if (!Raw) return ''
  const Then = new Date(Raw)
  const Now = new Date()
  const Days = Math.ceil(Math.abs(Now - Then) / (1000 * 60 * 60 * 24))
  if (Days <= 1) return 'Today'
  if (Days <= 2) return 'Yesterday'
  if (Days <= 7) return `${Days}d ago`
  return Then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<style scoped>
.pitch-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(15, 18, 20, 0.92));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  overflow: hidden;
  opacity: 0;
  animation: pitch-card-in 0.45s ease forwards;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

@keyframes pitch-card-in {
  from { opacity: 0; translate: 0 14px; }
  to { opacity: 1; translate: 0 0; }
}

/* ── Layer 1: result accent (thin top strip) ───────────────────────────── */
.pitch-card::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--color-neutral);
  opacity: 0.8;
}

.pitch-card--win::after { background: linear-gradient(90deg, var(--color-success), transparent); }
.pitch-card--loss::after { background: linear-gradient(90deg, var(--color-danger), transparent); }
.pitch-card--draw::after { background: linear-gradient(90deg, var(--color-neutral), transparent); }

/* ── Layer 1: rating-tier tint (border + ambient glow) ─────────────────── */
.pitch-card.rating-world-class {
  border-color: rgba(212, 175, 55, 0.65);
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.35),
    0 10px 38px rgba(168, 85, 247, 0.22),
    0 4px 22px rgba(212, 175, 55, 0.28);
}
.pitch-card.rating-world-class::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, #f7d774, #a855f7 70%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.pitch-card.rating-elite {
  border-color: var(--color-accent-border);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent), 0 8px 30px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.pitch-card.rating-excellent {
  border-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
  box-shadow: 0 6px 24px color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* good / average use the default neutral surface (no extra treatment) */

.pitch-card.rating-poor,
.pitch-card.rating-bad {
  border-color: rgba(120, 130, 140, 0.22);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.02), rgba(20, 22, 24, 0.94));
  filter: saturate(0.8);
}

.pitch-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.pitch-card__author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 1;
  padding: 4px;
  margin: -4px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pitch-card__author:hover {
  background: var(--color-bg-surface-2);
}

.pitch-card__avatar {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  color: var(--color-on-accent);
  font-size: var(--font-size-sm);
}

.pitch-card__identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pitch-card__namerow {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.pitch-card__name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pitch-card__meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.pitch-card__hero {
  position: relative;
  z-index: 1;
}

/* ── Layer 3: shot-map toggle + accordion ──────────────────────────────── */
.pitch-card__toggle {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 10px 16px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.pitch-card__toggle:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.pitch-card__toggle-icon {
  font-size: 16px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.pitch-card__toggle.is-open .pitch-card__toggle-icon {
  transform: rotate(180deg);
}

.pitch-card__accordion {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s ease;
}

.pitch-card__accordion.is-open {
  grid-template-rows: 1fr;
}

.pitch-card__accordion-inner {
  overflow: hidden;
}

.pitch-card__map {
  padding-top: var(--space-4);
}

.pitch-card__map-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: var(--space-5) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.pitch-card__map-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-soft);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: pitch-card-spin 0.7s linear infinite;
}

@keyframes pitch-card-spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 768px) {
  .pitch-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }
}
</style>
