import { ref, computed } from 'vue'
import { ParseFieldPosition, LabelForEvent, CategoryForEvent } from '../lib/matchEvents'
import { expectedGoal, sumExpectedGoals } from '../lib/xg'

/**
 * Read-only shot/event visualization state and aggregations. No Supabase access.
 *
 * Owns: the sidebar viz toggle (`vizView`), the currently selected event and its
 * placement marker, trajectory/quadrant/field-zone geometry helpers, and the
 * derived event aggregations (`EditorHeatmapPoints`, `timelineEvents`,
 * `combinedEvents`, `matchXg`).
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.matchGoals
 * @param {import('vue').Ref} deps.matchShots
 * @param {import('vue').Ref} deps.MatchHeatmapPoints
 */
export function useShotViz({ matchGoals, matchShots, MatchHeatmapPoints }) {
  const shotMapView = ref('goal') // 'goal' or 'field'
  const vizView = ref('field') // 'field' or 'goal' for sidebar visualization
  const selectedEvent = ref(null)

  // Free goal placement marker for the Placement view (null → fall back to quadrant grid).
  const selectedEventPlacementMarker = computed(() => {
    const e = selectedEvent.value
    if (!e || !e.placement) return null
    const parts = String(e.placement).split(',').map(Number)
    if (parts.length !== 2 || !parts.every(Number.isFinite)) return null
    const type = e.type === 'Goal' ? 'goal' : (e.on_target ? 'on-target' : 'off-target')
    return { xPct: parts[0], yPct: parts[1], type }
  })

  // Every mapped action (tracked events + shot/goal origins) for the heatmap.
  const EditorHeatmapPoints = computed(() => {
    const Out = MatchHeatmapPoints.value
      .map(p => ({ x_pct: Number(p.x_pct), y_pct: Number(p.y_pct) }))
      .filter(p => Number.isFinite(p.x_pct) && Number.isFinite(p.y_pct))
    for (const g of matchGoals.value) {
      const Pos = ParseFieldPosition(g.field_position)
      if (Pos) Out.push({ x_pct: Pos.XPct, y_pct: Pos.YPct })
    }
    for (const s of matchShots.value) {
      const Pos = ParseFieldPosition(s.field_position)
      if (Pos) Out.push({ x_pct: Pos.XPct, y_pct: Pos.YPct })
    }
    return Out
  })

  // Match xG total (goals + shots that recorded where they were taken).
  const matchXg = computed(() =>
    sumExpectedGoals([...matchGoals.value, ...matchShots.value])
  )

  // Unified, newest-first event log feeding the timeline + undo.
  const timelineEvents = computed(() => {
    const items = []
    for (const g of matchGoals.value) {
      items.push({ kind: 'goal', id: g.id, label: 'Goal', category: 'positive', xg: expectedGoal(g.field_position), at: g.created_at })
    }
    for (const s of matchShots.value) {
      items.push({
        kind: 'shot', id: s.id,
        label: s.on_target ? 'Shot on target' : 'Shot off target',
        category: s.on_target ? 'neutral' : 'negative',
        xg: expectedGoal(s.field_position), at: s.created_at,
      })
    }
    for (const p of MatchHeatmapPoints.value) {
      items.push({
        kind: 'heatmap', id: p.id, eventType: p.event_type,
        label: LabelForEvent(p.event_type),
        category: CategoryForEvent(p.event_type),
        xg: null, at: p.created_at,
      })
    }
    return items.sort((a, b) => new Date(b.at) - new Date(a.at))
  })

  const combinedEvents = computed(() => {
    const goals = matchGoals.value.map(g => ({
      ...g,
      type: 'Goal',
      details: 'Goal Scored',
      event_time: g.created_at,
      count: 1,
      events: [{ ...g, type: 'Goal' }],
    }))

    const shots = matchShots.value.map(s => ({
      ...s,
      type: 'Shot',
      details: s.on_target ? 'On Target' : 'Off Target',
      event_time: s.created_at,
      count: 1,
      events: [{ ...s, type: 'Shot' }],
    }))

    return [...goals, ...shots].sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
  })

  const showTrajectory = computed(() => {
    if (!selectedEvent.value || !selectedEvent.value.field_position) return false
    // Show for Goals and On-Target Shots only
    return selectedEvent.value.type === 'Goal' || (selectedEvent.value.type === 'Shot' && selectedEvent.value.on_target)
  })

  const shotTrajectory = computed(() => {
    if (!selectedEvent.value || !selectedEvent.value.field_position) return { x1: 0, y1: 0, x2: 0, y2: 0 }

    const [xPct, yPct] = selectedEvent.value.field_position.split(',').map(Number)

    // Convert percentage to SVG coordinates (68 width, 52.5 height)
    const x1 = (xPct / 100) * 68
    const y1 = (yPct / 100) * 52.5

    // Calculate destination point based on quadrant
    // Goal width is approx 30.34 to 37.66. Center is 34. Width ~7.32
    // Quadrants 1,4,7 (Left): Target left side of goal (~31.56)
    // Quadrants 2,5,8 (Center): Target center of goal (34)
    // Quadrants 3,6,9 (Right): Target right side of goal (~36.44)

    let x2 = 34 // Default center
    const quadrant = selectedEvent.value.quadrant

    if ([1, 4, 7].includes(quadrant)) {
      x2 = 31.56
    } else if ([3, 6, 9].includes(quadrant)) {
      x2 = 36.44
    }

    const y2 = 0

    return { x1, y1, x2, y2 }
  })

  const selectEventForViz = (event) => {
    // If the same event is already selected, close it (click-to-close functionality)
    if (selectedEvent.value && selectedEvent.value.id === event.id && selectedEvent.value.type === event.type) {
      selectedEvent.value = null
      return
    }

    // Allow selecting any event that has origin, placement, or quadrant data
    if (event.field_position || event.placement || event.quadrant) {
      selectedEvent.value = event
    } else {
      // Fallback or ignore events without data
      selectedEvent.value = null
    }
  }

  const getShotMarkerStyle = (item) => {
    if (!item.field_position || !item.field_position.includes(',')) return {}

    const [x, y] = item.field_position.split(',').map(Number)

    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    }
  }

  const getShotCoordinates = (item) => {
    if (!item.field_position || !item.field_position.includes(',')) return { x: 50, y: 50 }

    const [x, y] = item.field_position.split(',').map(Number)

    return { x, y }
  }

  const getGoalTargetX = (item) => {
    // If no quadrant, default to center
    if (!item.quadrant) return 50

    // Quadrant layout (goal view):
    // 1  2  3
    // 4  5  6
    // 7  8  9

    const quadrant = item.quadrant
    const column = ((quadrant - 1) % 3) + 1 // 1, 2, or 3

    // Map columns to goal positions (goal is 40% wide, centered at 50%)
    // Goal spans from 30% to 70%
    if (column === 1) return 37 // Left post area
    if (column === 2) return 50 // Center
    if (column === 3) return 63 // Right post area

    return 50 // Default to center
  }

  return {
    shotMapView,
    vizView,
    selectedEvent,
    selectedEventPlacementMarker,
    EditorHeatmapPoints,
    matchXg,
    timelineEvents,
    combinedEvents,
    showTrajectory,
    shotTrajectory,
    selectEventForViz,
    getShotMarkerStyle,
    getShotCoordinates,
    getGoalTargetX,
  }
}
