<template>
  <div class="shared">
    <div class="shared__wrap">
      <div v-if="loading" class="shared__state">
        <div class="shared__spinner"></div>
        <p>Loading dashboard…</p>
      </div>

      <div v-else-if="error" class="shared__state">
        <div class="shared__icon">🔒</div>
        <h2>Link unavailable</h2>
        <p>{{ error }}</p>
        <router-link to="/" class="btn btn-primary">Go to My Soccer Lab</router-link>
      </div>

      <template v-else>
        <header class="shared__header">
          <div class="shared__id">
            <img v-if="profile.avatar_url" :src="profile.avatar_url" alt="" class="shared__avatar" />
            <div v-else class="shared__avatar shared__avatar--ph">{{ initials }}</div>
            <div>
              <h1 class="shared__name">{{ profile.player_name || 'Player' }}</h1>
              <p class="shared__meta">{{ [profile.position, profile.club_team].filter(Boolean).join(' · ') || 'Shared dashboard' }}</p>
            </div>
          </div>
          <span class="shared__badge">Read-only · shared via My Soccer Lab</span>
        </header>

        <div v-if="matches.length === 0" class="shared__state">
          <p>No matches have been logged yet.</p>
        </div>

        <div v-else class="bento-grid">
          <OverviewHeaderTiles :matches="matches" />
          <PlayerCard :matches="matches" :userName="profile.player_name || 'Player'" />
          <BentoItem :delay="200" extra-class="bento-item--wide shot-map-tile">
            <ShotMapSection :allShotsData="shots" :allGoalsData="goals" :matches="matches" />
          </BentoItem>
          <PitchInsightsTile
            :heatmapPoints="heatmapPoints"
            :passArrows="passArrows"
            :progressiveCount="progressivePasses"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BentoItem from '../dashboard/overview/BentoItem.vue'
import OverviewHeaderTiles from '../dashboard/overview/OverviewHeaderTiles.vue'
import PlayerCard from '../dashboard/overview/PlayerCard.vue'
import PitchInsightsTile from '../dashboard/overview/PitchInsightsTile.vue'
import ShotMapSection from '../ShotMapSection.vue'
import { buildSeasonHeatmapPoints, buildPassArrows } from '../../lib/playerSummary'

const props = defineProps({
  previewMode: { type: Boolean, default: false }
})
const route = useRoute()

const loading = ref(true)
const error = ref('')
const profile = ref({})
const matches = ref([])
const shots = ref([])
const goals = ref([])
const heatmap = ref([])

const initials = computed(() => (profile.value.player_name || '?').slice(0, 2).toUpperCase())
const heatmapPoints = computed(() => buildSeasonHeatmapPoints(goals.value, shots.value, heatmap.value))
const passArrows = computed(() => buildPassArrows(heatmap.value))
const progressivePasses = computed(() => passArrows.value.filter((p) => p.progressive).length)

onMounted(async () => {
  if (props.previewMode) {
    profile.value = { player_name: 'Alex Striker', position: 'Striker', club_team: 'FC Demo' }
    matches.value = [
      { id: 'm1', match_date: '2026-06-02', opponent: 'Rivals FC', score_for: 3, score_against: 1, position_played: 'Striker', my_goals: 2, shots_on_target: 4, shots_off_target: 1, assists: 1, successful_passes: 31, unsuccessful_passes: 6, tackles: 2 },
      { id: 'm2', match_date: '2026-05-26', opponent: 'City B', score_for: 1, score_against: 1, position_played: 'Striker', my_goals: 1, shots_on_target: 2, shots_off_target: 3, assists: 0, successful_passes: 24, unsuccessful_passes: 9, tackles: 1 }
    ]
    shots.value = [{ match_id: 'm1', on_target: true, field_position: '50.0,20.0' }]
    goals.value = [{ match_id: 'm1', field_position: '48.0,12.0' }]
    heatmap.value = []
    loading.value = false
    return
  }

  const token = route.params.token
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shared-dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({ token })
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      error.value = body?.error || 'This share link is unavailable.'
    } else {
      const d = body.data
      profile.value = d.profile || {}
      matches.value = d.matches || []
      shots.value = d.shots || []
      goals.value = d.goals || []
      heatmap.value = d.heatmap || []
    }
  } catch {
    error.value = 'Could not load this dashboard. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.shared {
  min-height: 100vh;
  background: var(--app-page-bg);
  color: var(--color-text-primary);
  padding: 40px 20px 60px;
}
.shared__wrap { max-width: 1120px; margin: 0 auto; }

.shared__state { text-align: center; padding: 80px 20px; color: var(--color-text-muted); }
.shared__state h2 { color: var(--color-text-primary); margin: 0 0 8px; }
.shared__state p { margin: 0 0 20px; }
.shared__icon { font-size: 2.5rem; margin-bottom: 12px; }
.shared__spinner {
  width: 36px; height: 36px; margin: 0 auto 16px;
  border: 3px solid var(--color-border-subtle); border-top-color: var(--color-accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.shared__header {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);
  margin-bottom: var(--space-5); padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}
.shared__id { display: flex; align-items: center; gap: var(--space-4); }
.shared__avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-accent); }
.shared__avatar--ph { display: flex; align-items: center; justify-content: center; background: var(--color-bg-surface-2); color: var(--color-text-secondary); font-weight: var(--font-weight-heavy); }
.shared__name { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-heavy); }
.shared__meta { margin: 4px 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }
.shared__badge {
  padding: 6px 12px; border-radius: var(--radius-pill);
  background: var(--color-accent-soft); border: 1px solid var(--color-accent-border);
  color: var(--color-accent); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
}

.bento-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; width: 100%;
  grid-auto-rows: minmax(120px, auto);
}
.bento-grid > :deep(.bento-item) { grid-column: span 2; }
.bento-grid > :deep(.header-stat-tile) { grid-column: span 1; }

@media (min-width: 480px) {
  .bento-grid > :deep(.bento-item) { grid-column: span 1; }
  .bento-grid > :deep(.bento-item--wide) { grid-column: span 2; }
}
@media (min-width: 768px) {
  .bento-grid { grid-template-columns: repeat(4, 1fr); }
  .bento-grid > :deep(.bento-item--wide) { grid-column: span 4; }
}
@media (min-width: 1200px) {
  .bento-grid > :deep(.bento-item--wide) { grid-column: span 2; }
  .bento-grid > :deep(.shot-map-tile) { grid-column: span 2; grid-row: span 2; }
  .bento-grid > :deep(.player-card-tile) { grid-column: span 1; }
}
</style>
