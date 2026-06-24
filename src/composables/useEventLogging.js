import { supabase } from '../lib/supabase'
import { EventActions, IsInOwnBox } from '../lib/matchEvents'

/**
 * Event-logging operations: stat counters, goalkeeper counters, shot/goal/event
 * capture handlers, heatmap point persistence and undo. Owns all the writes that
 * happen while logging an in-progress match.
 *
 * All match/event state is injected as the refs returned by useMatchData (plus a
 * few cross-cutting refs), so reactivity is preserved.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.activeMatch
 * @param {import('vue').Ref} deps.matchGoals
 * @param {import('vue').Ref} deps.matchShots
 * @param {import('vue').Ref} deps.goalkeeperStats
 * @param {import('vue').Ref} deps.MatchHeatmapPoints
 * @param {import('vue').Ref} deps.selectedEvent
 * @param {import('vue').Ref} deps.eventCaptureFlow
 * @param {import('vue').Ref<boolean>} deps.EnableHeatmapTracking
 * @param {Function} deps.loadGoalkeeperStats
 * @param {Function} deps.flashToast
 */
export function useEventLogging({
  activeMatch,
  matchGoals,
  matchShots,
  goalkeeperStats,
  MatchHeatmapPoints,
  selectedEvent,
  eventCaptureFlow,
  EnableHeatmapTracking,
  loadGoalkeeperStats,
  flashToast,
}) {
  const incrementGkStat = async (stat, value) => {
    if (!goalkeeperStats.value) return
    goalkeeperStats.value[stat] = Math.max(0, goalkeeperStats.value[stat] + value)

    // Only update the specific fields that exist in the goalkeeper_match_stats table
    const updateData = {
      match_id: goalkeeperStats.value.match_id,
      user_id: goalkeeperStats.value.user_id,
      saves: goalkeeperStats.value.saves || 0,
      catches: goalkeeperStats.value.catches || 0,
      punches: goalkeeperStats.value.punches || 0,
      goals_conceded: goalkeeperStats.value.goals_conceded || 0,
      penalties_saved: goalkeeperStats.value.penalties_saved || 0,
      errors_led_to_goal: goalkeeperStats.value.errors_led_to_goal || 0,
    }

    const { error } = await supabase
      .from('goalkeeper_match_stats')
      .upsert(updateData, { onConflict: 'match_id, user_id' })

    if (error) {
      console.error(`Error updating ${stat}:`, error)
      // Revert on error
      goalkeeperStats.value[stat] = Math.max(0, goalkeeperStats.value[stat] - value)
    }
  }

  // Remove the most recently logged heatmap pin of a given event type, keeping
  // the counter and the map in sync when a stat is decremented in counters mode.
  const removeLatestHeatmapPoint = async (eventType) => {
    const matching = MatchHeatmapPoints.value.filter(p => p.event_type === eventType)
    if (!matching.length) return
    const latest = matching.reduce((a, b) =>
      new Date(b.created_at) > new Date(a.created_at) ? b : a
    )
    const { error } = await supabase.from('match_heatmap_points').delete().eq('id', latest.id)
    if (!error) {
      MatchHeatmapPoints.value = MatchHeatmapPoints.value.filter(p => p.id !== latest.id)
    }
  }

  const incrementStat = async (stat, value, { syncHeatmap = true } = {}) => {
    if (!activeMatch.value) return

    const currentValue = activeMatch.value[stat] || 0
    if (currentValue + value < 0) return // Prevent stats from going below zero

    const updatedValue = currentValue + value
    activeMatch.value[stat] = updatedValue

    const { error } = await supabase
      .from('matches')
      .update({ [stat]: updatedValue })
      .eq('id', activeMatch.value.id)

    if (error) {
      // A missing column (DB behind on a migration) shouldn't break logging —
      // revert quietly and keep going.
      if (error.code === 'PGRST204') {
        console.warn(`[match] column "${stat}" not in schema yet — apply the latest migration to persist it.`)
      } else {
        console.error(`Error updating ${stat}:`, error)
      }
      activeMatch.value[stat] -= value
      return
    }

    // Decrementing a tracked event removes its most recent map pin so the
    // pitch never shows ghost actions the counter no longer reflects. (No-op
    // for stats with no heatmap points, e.g. score_for / cards.)
    if (value < 0 && syncHeatmap) {
      await removeLatestHeatmapPoint(stat)
    }

    // If this is a goalkeeper match and we're changing score_against, also update goals_conceded
    const isGoalkeeper = activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')
    if (isGoalkeeper && stat === 'score_against' && value !== 0 && goalkeeperStats.value) {
      await incrementGkStat('goals_conceded', value)
    }
  }

  // Insert with the free-placement column, retrying without it if the DB is
  // behind on migration 0014 (PGRST204 = unknown column), so logging never breaks.
  const insertWithPlacementFallback = async (table, payload) => {
    let result = await supabase.from(table).insert(payload).select()
    if (result.error?.code === 'PGRST204' && 'placement' in payload) {
      const { placement, ...rest } = payload
      result = await supabase.from(table).insert(rest).select()
    }
    return result
  }

  const onShotCaptured = async ({ onTarget, quadrant, placement, fieldPosition }) => {
    if (!activeMatch.value) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await insertWithPlacementFallback('shots', {
      match_id: activeMatch.value.id,
      user_id: user.id,
      on_target: onTarget,
      quadrant,
      placement: placement ?? null,
      field_position: fieldPosition,
    })

    if (error) {
      console.error('Error saving shot:', error)
      return
    }
    matchShots.value.push(data[0])
  }

  const onGoalCaptured = async ({ goalType, quadrant, placement, fieldPosition }) => {
    if (!activeMatch.value) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Increment team score (single source of truth — fixes prior double-increment bug).
    await incrementStat('score_for', 1)

    const { data, error } = await insertWithPlacementFallback('goals', {
      user_id: user.id,
      match_id: activeMatch.value.id,
      goal_type: goalType,
      quadrant,
      placement: placement ?? null,
      field_position: fieldPosition,
    })

    if (error) {
      console.error('Error adding goal:', error)
      // Revert team score if goal insert fails
      await incrementStat('score_for', -1)
      return
    }
    matchGoals.value.push(data[0])
  }

  const removeEvent = async (event) => {
    if (!activeMatch.value) return

    // If the event being removed is the one being visualized, close the viz
    if (selectedEvent.value && selectedEvent.value.id === event.id && selectedEvent.value.type === event.type) {
      selectedEvent.value = null
    }

    if (event.type === 'Shot') {
      const { error } = await supabase.from('shots').delete().eq('id', event.id)
      if (error) {
        console.error('Error removing shot:', error)
      } else {
        matchShots.value = matchShots.value.filter(s => s.id !== event.id)
      }
    } else if (event.type === 'Goal') {
      const { error } = await supabase.from('goals').delete().eq('id', event.id)
      if (error) {
        console.error('Error removing goal:', error)
      } else {
        // Decrement team score
        await incrementStat('score_for', -1)
        matchGoals.value = matchGoals.value.filter(g => g.id !== event.id)
      }
    }
  }

  const removeEventGroup = async (eventGroup) => {
    if (!activeMatch.value || !eventGroup.events || eventGroup.events.length === 0) return

    let eventToRemove

    if (eventGroup.count > 1) {
      // For groups, find the most recent event to remove
      eventToRemove = eventGroup.events.reduce((latest, current) => {
        return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      })
    } else {
      // For single-item groups, remove the only event
      eventToRemove = eventGroup.events[0]
    }

    // If the event being removed is the one being visualized, close the viz
    if (selectedEvent.value && selectedEvent.value.id === eventToRemove.id && selectedEvent.value.type === eventToRemove.type) {
      selectedEvent.value = null
    }

    // Call the single event removal function
    await removeEvent(eventToRemove)
  }

  const handleMyGoal = () => {
    if (!activeMatch.value) return
    eventCaptureFlow.value?.triggerGoal()
  }

  const handleShot = () => {
    if (!activeMatch.value) return
    eventCaptureFlow.value?.triggerShot()
  }

  const SaveHeatmapPoint = async ({ XPct, YPct, EventType, EndX = null, EndY = null }) => {
    if (!activeMatch.value) return
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return
      const base = { match_id: activeMatch.value.id, user_id: user.id, x_pct: XPct, y_pct: YPct, event_type: EventType || null }
      const payload = (EndX !== null && EndY !== null) ? { ...base, x2_pct: EndX, y2_pct: EndY } : base
      let { data, error } = await supabase.from('match_heatmap_points').insert(payload).select().single()
      // Retry without direction columns if the DB is behind on migration 0016.
      if (error?.code === 'PGRST204' && payload !== base) {
        ({ data, error } = await supabase.from('match_heatmap_points').insert(base).select().single())
      }
      if (error) throw error
      MatchHeatmapPoints.value = [...MatchHeatmapPoints.value, data]
    } catch (e) {
      console.error('Error saving heatmap point:', e)
    }
  }

  const LogEvent = (stat, label) => {
    if (!activeMatch.value) return
    if (EnableHeatmapTracking.value && activeMatch.value.track_heatmap_for_match && eventCaptureFlow.value) {
      eventCaptureFlow.value.triggerEvent(stat, label)
    } else {
      incrementStat(stat, 1)
    }
  }

  const onEventCaptured = async ({ eventType, fieldPosition, destination }) => {
    if (!eventType) return
    let type = eventType
    let x = null, y = null
    if (fieldPosition) {
      const Parts = fieldPosition.split(',').map(Number)
      if (Number.isFinite(Parts[0]) && Number.isFinite(Parts[1])) { x = Parts[0]; y = Parts[1] }
    }
    let endX = null, endY = null
    if (destination) {
      const Parts = destination.split(',').map(Number)
      if (Number.isFinite(Parts[0]) && Number.isFinite(Parts[1])) { endX = Parts[0]; endY = Parts[1] }
    }
    // Smart reclassification: a foul committed in your own box is a penalty given away.
    if (eventType === 'fouls' && x !== null && IsInOwnBox(x, y)) {
      type = 'penalties_conceded'
      flashToast('Penalty conceded — foul in your own box', 'danger')
    }
    await incrementStat(type, 1)
    if (x !== null) {
      await SaveHeatmapPoint({ XPct: x, YPct: y, EventType: type, EndX: endX, EndY: endY })
    }
  }

  const OnMapLogEvent = ({ ActionKey, Coordinate }) => {
    if (!activeMatch.value || !Coordinate) return
    const Action = EventActions.find((Item) => Item.Key === ActionKey)
    if (!Action) return
    const FieldPosition = `${Math.round(Coordinate.XPct)},${Math.round(Coordinate.YPct)}`
    if (Action.FollowUp) {
      eventCaptureFlow.value?.triggerFromMap({ context: Action.FollowUp, fieldPosition: FieldPosition })
      return
    }
    onEventCaptured({ eventType: Action.Key, fieldPosition: FieldPosition })
  }

  const DeleteLoggedEvent = async (Coordinate) => {
    if (!activeMatch.value || !Coordinate) return
    if (Coordinate.Source === 'goal') {
      const { error } = await supabase.from('goals').delete().eq('id', Coordinate.Id)
      if (error) { console.error('Error removing goal:', error); flashToast('Couldn’t remove that event', 'danger'); return }
      await incrementStat('score_for', -1)
      matchGoals.value = matchGoals.value.filter((Goal) => Goal.id !== Coordinate.Id)
    } else if (Coordinate.Source === 'shot') {
      const { error } = await supabase.from('shots').delete().eq('id', Coordinate.Id)
      if (error) { console.error('Error removing shot:', error); flashToast('Couldn’t remove that event', 'danger'); return }
      matchShots.value = matchShots.value.filter((Shot) => Shot.id !== Coordinate.Id)
    } else if (Coordinate.Source === 'heatmap') {
      const { error } = await supabase.from('match_heatmap_points').delete().eq('id', Coordinate.Id)
      if (error) { console.error('Error removing heatmap point:', error); flashToast('Couldn’t remove that event', 'danger'); return }
      MatchHeatmapPoints.value = MatchHeatmapPoints.value.filter((Point) => Point.id !== Coordinate.Id)
      // This exact pin is already gone — decrement the counter only (syncHeatmap
      // off so we don't also remove a second, unrelated pin of the same type).
      if (Coordinate.EventKey) await incrementStat(Coordinate.EventKey, -1, { syncHeatmap: false })
    }
    if (selectedEvent.value && selectedEvent.value.id === Coordinate.Id) selectedEvent.value = null
    flashToast(`${Coordinate.Label || 'Event'} removed`)
  }

  const OnQuickIncrement = ({ Stat, Delta }) => incrementStat(Stat, Delta)
  const OnQuickIncrementGk = ({ Stat, Delta }) => incrementGkStat(Stat, Delta)

  return {
    incrementStat,
    incrementGkStat,
    removeLatestHeatmapPoint,
    onShotCaptured,
    onGoalCaptured,
    removeEvent,
    removeEventGroup,
    handleMyGoal,
    handleShot,
    SaveHeatmapPoint,
    LogEvent,
    onEventCaptured,
    OnMapLogEvent,
    DeleteLoggedEvent,
    OnQuickIncrement,
    OnQuickIncrementGk,
  }
}
