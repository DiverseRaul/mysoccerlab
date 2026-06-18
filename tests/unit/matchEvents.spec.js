import { describe, it, expect } from 'vitest'
import {
  EventActions,
  CategoryForEvent,
  LabelForEvent,
  ParseFieldPosition,
  ToPercentCoordinate,
  BuildLoggedEventCoordinates,
  GoalTargetXForQuadrant,
  IsDefensiveHalf,
  IsInOwnBox
} from '@/lib/matchEvents'

describe('EventActions', () => {
  it('exposes the consolidated 10-action menu with a single Pass entry', () => {
    const Keys = EventActions.map((Action) => Action.Key)
    expect(Keys).toEqual([
      'goal', 'assists', 'shot', 'pass', 'dribbles',
      'created_chances', 'tackles', 'interceptions', 'clearances', 'fouls'
    ])
    expect(EventActions.filter((Action) => Action.Key === 'pass')).toHaveLength(1)
  })

  it('marks goal, assist, shot, pass and chance as follow-up actions and the rest as instant', () => {
    const FollowUps = EventActions.filter((Action) => Action.FollowUp).map((Action) => Action.Key)
    expect(FollowUps).toEqual(['goal', 'assists', 'shot', 'pass', 'created_chances'])
  })
})

describe('CategoryForEvent / LabelForEvent', () => {
  it('classifies known event types', () => {
    expect(CategoryForEvent('goal')).toBe('positive')
    expect(LabelForEvent('goal')).toBe('Goal')
    expect(CategoryForEvent('shot')).toBe('neutral')
    expect(LabelForEvent('shot')).toBe('Shot')
    expect(CategoryForEvent('tackles')).toBe('defensive')
    expect(CategoryForEvent('successful_passes')).toBe('positive')
    expect(CategoryForEvent('unsuccessful_passes')).toBe('negative')
    expect(LabelForEvent('successful_passes')).toBe('Pass')
    expect(LabelForEvent('unsuccessful_passes')).toBe('Bad Pass')
  })

  it('falls back to neutral / Position for unknown keys', () => {
    expect(CategoryForEvent('mystery')).toBe('neutral')
    expect(LabelForEvent('mystery')).toBe('Position')
  })
})

describe('IsDefensiveHalf', () => {
  it('treats the bottom half (y >= 50) as the defensive half', () => {
    expect(IsDefensiveHalf(60)).toBe(true)
    expect(IsDefensiveHalf(50)).toBe(true)
    expect(IsDefensiveHalf(49)).toBe(false)
    expect(IsDefensiveHalf(10)).toBe(false)
  })
})

describe('IsInOwnBox', () => {
  it('detects fouls inside the own (bottom) penalty box', () => {
    expect(IsInOwnBox(50, 92)).toBe(true)
    expect(IsInOwnBox(30, 88)).toBe(true)
    expect(IsInOwnBox(75, 85)).toBe(true)
  })

  it('rejects positions outside the own box', () => {
    expect(IsInOwnBox(50, 80)).toBe(false) // not deep enough
    expect(IsInOwnBox(10, 95)).toBe(false) // too wide (left)
    expect(IsInOwnBox(90, 95)).toBe(false) // too wide (right)
    expect(IsInOwnBox(50, 20)).toBe(false) // attacking third
  })
})

describe('GoalTargetXForQuadrant', () => {
  it('maps the left column (1/4/7) to 37', () => {
    expect(GoalTargetXForQuadrant(1)).toBe(37)
    expect(GoalTargetXForQuadrant(4)).toBe(37)
    expect(GoalTargetXForQuadrant(7)).toBe(37)
  })

  it('maps the centre column (2/5/8) to 50', () => {
    expect(GoalTargetXForQuadrant(2)).toBe(50)
    expect(GoalTargetXForQuadrant(5)).toBe(50)
    expect(GoalTargetXForQuadrant(8)).toBe(50)
  })

  it('maps the right column (3/6/9) to 63', () => {
    expect(GoalTargetXForQuadrant(3)).toBe(63)
    expect(GoalTargetXForQuadrant(6)).toBe(63)
    expect(GoalTargetXForQuadrant(9)).toBe(63)
  })

  it('defaults to centre when no quadrant is set', () => {
    expect(GoalTargetXForQuadrant(null)).toBe(50)
    expect(GoalTargetXForQuadrant(undefined)).toBe(50)
    expect(GoalTargetXForQuadrant(0)).toBe(50)
  })
})

describe('ParseFieldPosition', () => {
  it('parses a valid "x,y" string', () => {
    expect(ParseFieldPosition('45.5,67.25')).toEqual({ XPct: 45.5, YPct: 67.25 })
  })

  it('returns null for malformed input', () => {
    expect(ParseFieldPosition(null)).toBeNull()
    expect(ParseFieldPosition('')).toBeNull()
    expect(ParseFieldPosition('45')).toBeNull()
    expect(ParseFieldPosition('a,b')).toBeNull()
  })
})

describe('ToPercentCoordinate', () => {
  const Rect = { left: 100, top: 200, width: 200, height: 400 }

  it('converts client coordinates to clamped, rounded percentages', () => {
    expect(ToPercentCoordinate(150, 300, Rect)).toEqual({ XPct: 25, YPct: 25 })
  })

  it('returns null when the tap is outside the field', () => {
    expect(ToPercentCoordinate(50, 300, Rect)).toBeNull()
    expect(ToPercentCoordinate(150, 700, Rect)).toBeNull()
  })

  it('returns null for a degenerate rect', () => {
    expect(ToPercentCoordinate(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toBeNull()
  })
})

describe('BuildLoggedEventCoordinates', () => {
  it('merges goals, shots and heatmap points into one normalized list', () => {
    const Goals = [{ id: 1, field_position: '40,30' }]
    const Shots = [
      { id: 2, on_target: true, field_position: '55,60' },
      { id: 3, on_target: false, field_position: '20,80' }
    ]
    const Heatmap = [{ id: 4, x_pct: 10.5, y_pct: 90.25, event_type: 'tackles' }]

    const Result = BuildLoggedEventCoordinates(Goals, Shots, Heatmap)

    expect(Result).toHaveLength(4)
    expect(Result[0]).toMatchObject({ Id: 1, Source: 'goal', Label: 'Goal', Category: 'positive', XPct: 40, YPct: 30 })
    expect(Result[1]).toMatchObject({ Id: 2, Source: 'shot', Category: 'neutral' })
    expect(Result[2]).toMatchObject({ Id: 3, Source: 'shot', Category: 'negative', Label: 'Shot (off target)' })
    expect(Result[3]).toMatchObject({ Id: 4, Source: 'heatmap', EventKey: 'tackles', Label: 'Tackle', Category: 'defensive', XPct: 10.5, YPct: 90.25 })
  })

  it('skips goals and shots with no parseable field position', () => {
    const Goals = [{ id: 1, field_position: null }]
    const Shots = [{ id: 2, on_target: true, field_position: '' }]
    const Heatmap = [{ id: 3, x_pct: 'nan', y_pct: 5, event_type: 'fouls' }]

    expect(BuildLoggedEventCoordinates(Goals, Shots, Heatmap)).toEqual([])
  })

  it('handles empty / undefined inputs', () => {
    expect(BuildLoggedEventCoordinates()).toEqual([])
    expect(BuildLoggedEventCoordinates([], [], [])).toEqual([])
  })

  it('only sets an end point when a real destination exists (null ≠ 0,0)', () => {
    const withDir = [{ id: 1, x_pct: 30, y_pct: 70, event_type: 'successful_passes', x2_pct: 52, y2_pct: 40 }]
    const noDir = [{ id: 2, x_pct: 20, y_pct: 88, event_type: 'tackles', x2_pct: null, y2_pct: null }]
    expect(BuildLoggedEventCoordinates([], [], withDir)[0]).toMatchObject({ EndX: 52, EndY: 40 })
    const tackle = BuildLoggedEventCoordinates([], [], noDir)[0]
    expect(tackle.EndX).toBeNull()
    expect(tackle.EndY).toBeNull()
  })
})
