import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { selectByIds } from '../lib/queryBatch'

/**
 * Owns the Supabase reads/writes for a single active match and its events:
 * matches / goals / shots / goalkeeper_match_stats / match_heatmap_points.
 *
 * Returns reactive refs plus the CRUD operations. Reactivity is preserved by
 * returning the refs themselves (never destructure their `.value`).
 *
 * @param {object} options
 * @param {import('vue').Ref<boolean>} options.isGoalkeeperMode
 * @param {object} options.activeSeason - reactive ref/getter for the active season
 * @param {Function} options.emit - component emit fn ('match-updated')
 */
export function useMatchData({ isGoalkeeperMode, activeSeason, emit }) {
  const activeMatch = ref(null)
  const matchGoals = ref([])
  const matchShots = ref([])
  const goalkeeperStats = ref(null)
  const MatchHeatmapPoints = ref([])

  const loadGoalkeeperStats = async (matchId) => {
    const { data, error } = await supabase
      .from('goalkeeper_match_stats')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (data) {
      goalkeeperStats.value = data
    } else {
      goalkeeperStats.value = {
        match_id: matchId,
        user_id: activeMatch.value.user_id,
        saves: 0,
        catches: 0,
        punches: 0,
        goals_conceded: 0,
        penalties_saved: 0,
        errors_led_to_goal: 0,
      }
    }
    if (error && error.code !== 'PGRST116') {
      console.error('Error loading goalkeeper stats:', error)
    }
  }

  const selectMatch = async (match) => {
    if (activeMatch.value) return // Prevent re-triggering when a match is active
    // Fetch the full, up-to-date match object to ensure all stats are loaded
    const { data: fullMatch, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match.id)
      .single()

    if (matchError) {
      console.error('Error fetching full match data:', matchError)
      activeMatch.value = match // Fallback to the list view's match object
    } else {
      activeMatch.value = fullMatch
    }

    // Fetch related goals for the match
    const { data: goals, error: goalsError } = await selectByIds('goals', '*', [match.id])
    if (goalsError) console.error('Error fetching goals:', goalsError)
    else matchGoals.value = goals

    // Fetch related shots for the match
    const { data: shots, error: shotsError } = await selectByIds('shots', '*', [match.id])
    if (shotsError) console.error('Error fetching shots:', shotsError)
    else matchShots.value = shots

    MatchHeatmapPoints.value = []
    if (activeMatch.value?.track_heatmap_for_match) {
      const { data: heatmapPoints } = await supabase
        .from('match_heatmap_points')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true })
      MatchHeatmapPoints.value = heatmapPoints || []
    }

    // Check if the player was a goalkeeper in this match
    if (activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')) {
      isGoalkeeperMode.value = true
      await loadGoalkeeperStats(match.id)
    } else {
      isGoalkeeperMode.value = false
      goalkeeperStats.value = null
    }
  }

  const addMatch = async (formData, { onSuccess } = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const seasonValue = typeof activeSeason === 'function' ? activeSeason() : activeSeason?.value
      const matchData = {
        ...formData,
        user_id: user.id,
        season_id: seasonValue?.id || null,
        score_for: 0,
        score_against: 0,
        assists: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        dribbles: 0,
        fouls: 0,
        successful_passes: 0,
        unsuccessful_passes: 0,
        own_goals: 0,
        created_chances: 0,
        lost_possessions: 0,
        yellow_card: 0,
        red_card: 0,
        // New matches log shot/goal origins over the full pitch (x,y). Old
        // matches predate this (NULL) and are treated as half-field on read.
        origins_full_field: true,
      }

      const { error } = await supabase
        .from('matches')
        .insert([matchData])
        .select()

      if (error) throw error

      if (onSuccess) onSuccess()
      emit('match-updated')
    } catch (error) {
      console.error('Error adding match:', error)
      return { error }
    }
    return { error: null }
  }

  const updatePosition = async () => {
    if (!activeMatch.value) return

    const { error } = await supabase
      .from('matches')
      .update({
        position_played: activeMatch.value.position_played,
      })
      .eq('id', activeMatch.value.id)

    if (error) {
      console.error('Error updating position:', error)
    } else {
      // Auto-toggle goalkeeper mode based on position
      if (activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')) {
        isGoalkeeperMode.value = true
        await loadGoalkeeperStats(activeMatch.value.id)
      } else {
        isGoalkeeperMode.value = false
        goalkeeperStats.value = null
      }
      emit('match-updated')
    }
  }

  const updateMatch = async ({ onSuccess } = {}) => {
    if (!activeMatch.value) return

    const { error } = await supabase
      .from('matches')
      .update({
        opponent: activeMatch.value.opponent,
        match_date: activeMatch.value.match_date,
      })
      .eq('id', activeMatch.value.id)

    if (error) {
      console.error('Error updating match:', error)
    } else {
      if (onSuccess) onSuccess()
      emit('match-updated')
    }
  }

  const deleteMatch = async ({ onSuccess } = {}) => {
    if (!activeMatch.value) return

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', activeMatch.value.id)

    if (error) {
      console.error('Error deleting match:', error)
    } else {
      activeMatch.value = null
      if (onSuccess) onSuccess()
      emit('match-updated')
    }
  }

  return {
    activeMatch,
    matchGoals,
    matchShots,
    goalkeeperStats,
    MatchHeatmapPoints,
    selectMatch,
    addMatch,
    loadGoalkeeperStats,
    updateMatch,
    updatePosition,
    deleteMatch,
  }
}
