import { describe, it, expect } from 'vitest'
import { ComputeLoadStatus } from '@/lib/load'

const ReferenceDate = '2026-06-09'

describe('ComputeLoadStatus', () => {
  it('returns a neutral, no-data state for empty input', () => {
    const Result = ComputeLoadStatus([], { ReferenceDate })
    expect(Result.HasData).toBe(false)
    expect(Result.Zone).toBe('optimal')
    expect(Result.WeeklyMinutes).toBe(0)
    expect(Result.AverageFatigue).toBe(0)
    expect(Result.GaugePercent).toBe(0)
  })

  it('classifies a light week as optimal', () => {
    const Result = ComputeLoadStatus([
      { entry_date: '2026-06-08', minutes: 60, fatigue: 3 },
      { entry_date: '2026-06-05', minutes: 90, fatigue: 4 }
    ], { ReferenceDate })
    expect(Result.HasData).toBe(true)
    expect(Result.WeeklyMinutes).toBe(150)
    expect(Result.AverageFatigue).toBe(3.5)
    expect(Result.Zone).toBe('optimal')
    expect(Result.GaugePercent).toBeGreaterThan(0)
    expect(Result.GaugePercent).toBeLessThanOrEqual(100)
  })

  it('flags elevated minutes or moderate fatigue as caution', () => {
    const Result = ComputeLoadStatus([
      { entry_date: '2026-06-08', minutes: 220, fatigue: 5 },
      { entry_date: '2026-06-06', minutes: 200, fatigue: 5 }
    ], { ReferenceDate })
    expect(Result.WeeklyMinutes).toBe(420)
    expect(Result.Zone).toBe('caution')
  })

  it('flags very high minutes and fatigue as high-risk and caps the gauge', () => {
    const Result = ComputeLoadStatus([
      { entry_date: '2026-06-08', minutes: 320, fatigue: 8 },
      { entry_date: '2026-06-07', minutes: 300, fatigue: 9 }
    ], { ReferenceDate })
    expect(Result.WeeklyMinutes).toBe(620)
    expect(Result.Zone).toBe('high-risk')
    expect(Result.GaugePercent).toBe(100)
  })

  it('ignores entries outside the 7-day window', () => {
    const Result = ComputeLoadStatus([
      { entry_date: '2026-06-08', minutes: 60, fatigue: 4 },
      { entry_date: '2026-05-20', minutes: 500, fatigue: 9 }
    ], { ReferenceDate })
    expect(Result.WeeklyMinutes).toBe(60)
    expect(Result.AverageFatigue).toBe(4)
    expect(Result.Zone).toBe('optimal')
  })
})
