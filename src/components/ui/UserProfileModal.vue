<template>
  <div class="profile-modal" @click.self="Emit('close')" data-testid="user-profile-modal">
    <div class="profile-modal__card" role="dialog" aria-modal="true" :aria-label="`${DisplayName} profile`">
      <button type="button" class="profile-modal__close" aria-label="Close" @click="Emit('close')">&times;</button>

      <div v-if="Loading" class="profile-modal__loading">
        <span class="profile-modal__spinner"></span>
      </div>

      <template v-else>
        <header class="profile-modal__head">
          <img v-if="Profile.avatar_url" :src="Profile.avatar_url" class="profile-modal__avatar" alt="" />
          <div v-else class="profile-modal__avatar profile-modal__avatar--initials">{{ Initials }}</div>
          <h2 class="profile-modal__name">{{ DisplayName }}</h2>
          <p class="profile-modal__sub">
            <span v-if="Profile.position">{{ Profile.position }}</span>
            <span v-if="Profile.club_team"> · {{ Profile.club_team }}</span>
          </p>
          <div class="profile-modal__chips">
            <span v-if="Profile.jersey_number" class="profile-modal__chip">#{{ Profile.jersey_number }}</span>
            <span v-if="Profile.preferred_foot" class="profile-modal__chip">{{ Profile.preferred_foot }} foot</span>
          </div>
        </header>

        <div class="profile-modal__stats">
          <div class="profile-modal__stat">
            <span class="profile-modal__stat-value">{{ Stats.matches }}</span>
            <span class="profile-modal__stat-label">Matches</span>
          </div>
          <div class="profile-modal__stat">
            <span class="profile-modal__stat-value" :class="Stats.ratingTier">{{ Stats.avgRating }}</span>
            <span class="profile-modal__stat-label">Avg Rating</span>
          </div>
          <div class="profile-modal__stat">
            <span class="profile-modal__stat-value">{{ Stats.record }}</span>
            <span class="profile-modal__stat-label">W-D-L</span>
          </div>
          <div class="profile-modal__stat">
            <span class="profile-modal__stat-value">{{ Stats.goals }}</span>
            <span class="profile-modal__stat-label">Goals</span>
          </div>
          <div class="profile-modal__stat">
            <span class="profile-modal__stat-value">{{ Stats.assists }}</span>
            <span class="profile-modal__stat-label">Assists</span>
          </div>
        </div>

        <button
          type="button"
          class="profile-modal__follow"
          :class="{ 'is-following': Following }"
          data-testid="profile-modal-follow"
          @click="ToggleFollow"
        >{{ Following ? 'Following' : 'Follow' }}</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { calculateMatchRating, getRatingColor } from '../../lib/rating'

const Props = defineProps({
  userId: { type: String, required: true },
  // Display fallbacks while the full profile loads (from the feed card).
  seedName: { type: String, default: '' },
  seedPosition: { type: String, default: '' },
  isFollowing: { type: Boolean, default: false }
})

const Emit = defineEmits(['close', 'toggle-follow'])

const Loading = ref(true)
const Profile = ref({})
const Stats = ref({ matches: 0, avgRating: '—', ratingTier: '', record: '0-0-0', goals: 0, assists: 0 })
const Following = ref(Props.isFollowing)

watch(() => Props.isFollowing, (v) => { Following.value = v })

const DisplayName = computed(() => Profile.value.player_name || Props.seedName || 'Player')
const Initials = computed(() => DisplayName.value.substring(0, 2).toUpperCase())

const ToggleFollow = () => {
  // Optimistic flip for instant feedback; parent owns the persistence.
  Following.value = !Following.value
  Emit('toggle-follow', Props.userId)
}

const Load = async () => {
  Loading.value = true
  try {
    const [profileRes, matchesRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('player_name, position, preferred_foot, jersey_number, club_team, avatar_url, is_public')
        .eq('user_id', Props.userId)
        .single(),
      supabase
        .from('matches')
        .select('*')
        .eq('user_id', Props.userId)
        .order('match_date', { ascending: false })
        .limit(100)
    ])

    Profile.value = profileRes.data || { player_name: Props.seedName, position: Props.seedPosition }

    const Matches = matchesRes.data || []
    let wins = 0, draws = 0, losses = 0, goals = 0, assists = 0, ratingSum = 0
    for (const M of Matches) {
      const F = M.score_for ?? 0
      const A = M.score_against ?? 0
      if (F > A) wins++
      else if (F < A) losses++
      else draws++
      goals += M.my_goals || 0
      assists += M.assists || 0
      ratingSum += parseFloat(calculateMatchRating(M))
    }
    const avg = Matches.length ? (ratingSum / Matches.length) : 0
    Stats.value = {
      matches: Matches.length,
      avgRating: Matches.length ? avg.toFixed(2) : '—',
      ratingTier: Matches.length ? getRatingColor(avg) : '',
      record: `${wins}-${draws}-${losses}`,
      goals,
      assists
    }
  } catch (e) {
    console.error('Error loading profile:', e)
  } finally {
    Loading.value = false
  }
}

watch(() => Props.userId, Load, { immediate: true })
</script>

<style scoped>
.profile-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 4, 3, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: profile-modal-fade 0.25s ease-out;
}

.profile-modal__card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 32px 24px 24px;
  text-align: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  animation: profile-modal-pop 0.3s ease-out;
}

.profile-modal__close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease;
}

.profile-modal__close:hover { color: var(--color-text-primary); }

.profile-modal__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.profile-modal__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-soft);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: profile-modal-spin 0.7s linear infinite;
}

.profile-modal__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.profile-modal__avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-accent-border);
  margin-bottom: 4px;
}

.profile-modal__avatar--initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent), var(--color-brand));
  color: #04130c;
  font-size: 1.6rem;
  font-weight: var(--font-weight-heavy);
}

.profile-modal__name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
}

.profile-modal__sub {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.profile-modal__chips {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.profile-modal__chip {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.profile-modal__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin: 22px 0;
  background: var(--color-border-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.profile-modal__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--color-bg-surface-2);
}

.profile-modal__stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.profile-modal__stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-modal__stat-value.rating-world-class { color: var(--color-rating-world-class); }
.profile-modal__stat-value.rating-elite       { color: var(--color-rating-elite); }
.profile-modal__stat-value.rating-excellent   { color: var(--color-rating-excellent); }
.profile-modal__stat-value.rating-good        { color: var(--color-rating-good); }
.profile-modal__stat-value.rating-average     { color: var(--color-rating-average); }
.profile-modal__stat-value.rating-poor        { color: var(--color-rating-poor); }
.profile-modal__stat-value.rating-bad         { color: var(--color-rating-bad); }

.profile-modal__follow {
  width: 100%;
  min-height: 48px;
  padding: 13px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: linear-gradient(135deg, var(--color-accent), var(--color-brand));
  color: #04130c;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.profile-modal__follow:hover { transform: translateY(-1px); }

.profile-modal__follow.is-following {
  background: transparent;
  border-color: var(--color-border-soft);
  color: var(--color-text-secondary);
}

@keyframes profile-modal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes profile-modal-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes profile-modal-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .profile-modal,
  .profile-modal__card { animation: none; }
  .profile-modal__spinner { animation: none; }
}
</style>
