export const EventCatalog = {
  goal: { Label: 'Goal', Category: 'positive' },
  shot: { Label: 'Shot', Category: 'neutral' },
  penalties_conceded: { Label: 'Penalty conceded', Category: 'negative' },
  assists: { Label: 'Assist', Category: 'positive' },
  successful_passes: { Label: 'Pass', Category: 'positive' },
  unsuccessful_passes: { Label: 'Bad Pass', Category: 'negative' },
  dribbles: { Label: 'Dribble', Category: 'positive' },
  created_chances: { Label: 'Chance', Category: 'positive' },
  tackles: { Label: 'Tackle', Category: 'defensive' },
  interceptions: { Label: 'Interception', Category: 'defensive' },
  clearances: { Label: 'Clearance', Category: 'defensive' },
  fouls: { Label: 'Foul', Category: 'negative' }
}

export const EventActions = [
  { Key: 'goal', Label: 'Goal', Category: 'positive', FollowUp: 'goal' },
  { Key: 'assists', Label: 'Assist', Category: 'positive', FollowUp: 'assist' },
  { Key: 'shot', Label: 'Shot', Category: 'neutral', FollowUp: 'shot' },
  { Key: 'pass', Label: 'Pass', Category: 'positive', FollowUp: 'pass' },
  { Key: 'dribbles', Label: 'Dribble', Category: 'positive', FollowUp: null },
  { Key: 'created_chances', Label: 'Chance', Category: 'positive', FollowUp: 'chance' },
  { Key: 'tackles', Label: 'Tackle', Category: 'defensive', FollowUp: null },
  { Key: 'interceptions', Label: 'Interception', Category: 'defensive', FollowUp: null },
  { Key: 'clearances', Label: 'Clearance', Category: 'defensive', FollowUp: null },
  { Key: 'fouls', Label: 'Foul', Category: 'negative', FollowUp: null }
]

export const CategoryForEvent = (EventKey) => {
  const Entry = EventCatalog[EventKey]
  return Entry ? Entry.Category : 'neutral'
}

export const LabelForEvent = (EventKey) => {
  const Entry = EventCatalog[EventKey]
  return Entry ? Entry.Label : 'Position'
}

export const RoundCoordinate = (Value) => Math.round(Value * 100) / 100

// ── Pitch geometry helpers (logger orientation: attacking goal at the TOP) ──
// Coordinates are 0–100 percentages. The halfway line sits at y = 50.

// Your own (defensive) half is the bottom half of the pitch.
export const IsDefensiveHalf = (YPct) => Number(YPct) >= 50

// Your own penalty box — the bottom box. A foul committed here is a penalty
// given away. Mirrors the SVG box (x 25–75, y 127–149 of the 0–150 viewBox →
// y ≈ 85–100 in percentage terms).
export const IsInOwnBox = (XPct, YPct) => {
  const x = Number(XPct)
  const y = Number(YPct)
  return x >= 25 && x <= 75 && y >= 85
}

// Maps a goal quadrant (1–9, numbered left→right, top→bottom) to the horizontal
// target on the goal line (0–100). Columns: 1/4/7 → 37, 2/5/8 → 50, 3/6/9 → 63.
// Null/0/undefined (no placement) defaults to centre. Mirrors the trajectory
// math in ShotMapSection.vue so the feed's mini shot map draws identical lines.
export const GoalTargetXForQuadrant = (Quadrant) => {
  if (!Quadrant) return 50
  const Column = ((Quadrant - 1) % 3) + 1
  if (Column === 1) return 37
  if (Column === 3) return 63
  return 50
}

export const ToPercentCoordinate = (ClientX, ClientY, Rect) => {
  if (!Rect || !Rect.width || !Rect.height) return null
  const XPct = ((ClientX - Rect.left) / Rect.width) * 100
  const YPct = ((ClientY - Rect.top) / Rect.height) * 100
  if (XPct < 0 || XPct > 100 || YPct < 0 || YPct > 100) return null
  return { XPct: RoundCoordinate(XPct), YPct: RoundCoordinate(YPct) }
}

export const ParseFieldPosition = (Value) => {
  if (typeof Value !== 'string') return null
  const Parts = Value.split(',')
  if (Parts.length !== 2) return null
  const XPct = Number(Parts[0])
  const YPct = Number(Parts[1])
  if (!Number.isFinite(XPct) || !Number.isFinite(YPct)) return null
  return { XPct, YPct }
}

export const BuildLoggedEventCoordinates = (Goals, Shots, HeatmapPoints) => {
  const Coordinates = []

  for (const Goal of Goals || []) {
    const Position = ParseFieldPosition(Goal.field_position)
    if (!Position) continue
    Coordinates.push({
      Id: Goal.id,
      Source: 'goal',
      EventKey: 'goal',
      Label: 'Goal',
      Category: 'positive',
      XPct: Position.XPct,
      YPct: Position.YPct,
      // Goal-mouth placement for the "where it went" view.
      Quadrant: Goal.quadrant ?? null,
      Placement: Goal.placement ?? null,
      OnTarget: true
    })
  }

  for (const Shot of Shots || []) {
    const Position = ParseFieldPosition(Shot.field_position)
    if (!Position) continue
    Coordinates.push({
      Id: Shot.id,
      Source: 'shot',
      EventKey: 'shot',
      Label: Shot.on_target === false ? 'Shot (off target)' : 'Shot',
      Category: Shot.on_target === false ? 'negative' : 'neutral',
      XPct: Position.XPct,
      YPct: Position.YPct,
      Quadrant: Shot.quadrant ?? null,
      Placement: Shot.placement ?? null,
      OnTarget: Shot.on_target !== false
    })
  }

  for (const Point of HeatmapPoints || []) {
    const XPct = Number(Point.x_pct)
    const YPct = Number(Point.y_pct)
    if (!Number.isFinite(XPct) || !Number.isFinite(YPct)) continue
    // Only events that genuinely recorded a destination get an arrow. Guard
    // against null/'' (Number(null) === 0 would otherwise draw a phantom arrow
    // to the top-left for every plain point like a tackle or foul).
    const HasEnd =
      Point.x2_pct != null && Point.x2_pct !== '' &&
      Point.y2_pct != null && Point.y2_pct !== '' &&
      Number.isFinite(Number(Point.x2_pct)) && Number.isFinite(Number(Point.y2_pct))
    Coordinates.push({
      Id: Point.id,
      Source: 'heatmap',
      EventKey: Point.event_type,
      Label: LabelForEvent(Point.event_type),
      Category: CategoryForEvent(Point.event_type),
      XPct,
      YPct,
      EndX: HasEnd ? Number(Point.x2_pct) : null,
      EndY: HasEnd ? Number(Point.y2_pct) : null
    })
  }

  return Coordinates
}
