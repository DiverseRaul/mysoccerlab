import { describe, it, expect } from 'vitest'
import { parseCalendar, buildWeeklyPlanPrompt } from '../../src/lib/trainingPlan.js'

describe('parseCalendar', () => {
  it('returns [] for empty/nullish input', () => {
    expect(parseCalendar('')).toEqual([])
    expect(parseCalendar(null)).toEqual([])
  })

  it('parses weekday headers with a dash separator and bullet drills', () => {
    const text = [
      'Monday – Acceleration',
      '- 10 x 20m explosive starts',
      '- Sprint mechanics drill',
      'Tuesday – Recovery',
      '- 30 min easy jog'
    ].join('\n')
    const out = parseCalendar(text)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      DayTitle: 'Monday',
      FocusTheme: 'Acceleration',
      Drills: ['10 x 20m explosive starts', 'Sprint mechanics drill']
    })
    expect(out[1].DayTitle).toBe('Tuesday')
    expect(out[1].Drills).toEqual(['30 min easy jog'])
  })

  it('supports Day N / Session N headers and colon separators', () => {
    const out = parseCalendar('Day 1: Finishing\n- 20 shots\nSession 2 - Passing\n* wall passes')
    expect(out.map(d => d.DayTitle)).toEqual(['Day 1', 'Session 2'])
    expect(out[0].FocusTheme).toBe('Finishing')
    expect(out[1].Drills).toEqual(['wall passes'])
  })

  it('strips markdown bold and leading list punctuation', () => {
    const out = parseCalendar('Monday – **Power**\n1. **Box jumps** 3x8')
    expect(out[0].FocusTheme).toBe('Power')
    expect(out[0].Drills).toEqual(['Box jumps 3x8'])
  })

  it('defaults the theme to "Training" when no separator is present', () => {
    const out = parseCalendar('Wednesday\n- mobility work')
    expect(out[0].DayTitle).toBe('Wednesday')
    expect(out[0].FocusTheme).toBe('Training')
  })

  it('ignores prose before the first day header', () => {
    const out = parseCalendar('Here is your week:\nMonday – Finishing\n- 20 shots')
    expect(out).toHaveLength(1)
    expect(out[0].DayTitle).toBe('Monday')
  })
})

describe('buildWeeklyPlanPrompt', () => {
  it('embeds the focus aspect and a one-focus, one-drill instruction', () => {
    const p = buildWeeklyPlanPrompt('Finishing')
    expect(p).toMatch(/Finishing/)
    expect(p).toMatch(/ONE main drill/i)
    expect(p).toMatch(/7-day/i)
  })

  it('uses default options (4 days, 45 min, moderate) when none given', () => {
    const p = buildWeeklyPlanPrompt('Finishing')
    expect(p).toMatch(/exactly 4 training day/i)
    expect(p).toMatch(/45 minutes/)
    expect(p).toMatch(/moderate intensity/i)
  })

  it('embeds the chosen sessions/week, minutes, intensity and equipment', () => {
    const p = buildWeeklyPlanPrompt('Passing', [], {
      daysPerWeek: 5, minutesPerSession: 60, intensity: 'Hard', equipment: 'Just a ball'
    })
    expect(p).toMatch(/exactly 5 training day/i)
    expect(p).toMatch(/60 minutes/)
    expect(p).toMatch(/hard intensity/i)
    expect(p).toMatch(/Just a ball/)
  })

  it('omits the equipment line when no equipment is chosen', () => {
    expect(buildWeeklyPlanPrompt('Passing', [], { daysPerWeek: 3 })).not.toMatch(/equipment \/ setting/i)
  })

  it('lists the player\'s tracked drills when provided', () => {
    const p = buildWeeklyPlanPrompt('Passing', [
      { name: 'Wall passes', metricType: 'ratio', latest: '18 / 20 (90%)' }
    ])
    expect(p).toMatch(/Wall passes/)
    expect(p).toMatch(/prefer them/i)
  })

  it('tells the AI to invent drills when the player has none', () => {
    const p = buildWeeklyPlanPrompt('Stamina', [])
    expect(p).toMatch(/invent/i)
  })

  it('falls back to a generic focus when none is given', () => {
    expect(buildWeeklyPlanPrompt('')).toMatch(/overall game/i)
  })
})
