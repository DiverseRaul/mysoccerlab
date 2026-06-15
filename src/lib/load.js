const OptimalMaxMinutes = 360
const CautionMaxMinutes = 540
const CautionFatigue = 5
const HighRiskFatigue = 7
const WindowDays = 7

const ZoneLabels = {
  optimal: 'Optimal training zone',
  caution: 'Elevated load',
  'high-risk': 'High fatigue risk'
}

const Clamp = (Value, Min, Max) => Math.min(Max, Math.max(Min, Value))

const ToMidnight = (Value) => {
  const Result = Value instanceof Date ? new Date(Value.getTime()) : new Date(Value)
  Result.setHours(0, 0, 0, 0)
  return Result
}

export const ComputeLoadStatus = (Entries, Options = {}) => {
  const Reference = ToMidnight(Options.ReferenceDate ?? new Date())
  const WindowStart = new Date(Reference.getTime())
  WindowStart.setDate(WindowStart.getDate() - (WindowDays - 1))

  const Recent = (Entries || []).filter((Entry) => {
    if (!Entry || Entry.entry_date == null) return false
    const When = ToMidnight(Entry.entry_date)
    return When >= WindowStart && When <= Reference
  })

  if (Recent.length === 0) {
    return {
      HasData: false,
      WeeklyMinutes: 0,
      AverageFatigue: 0,
      Zone: 'optimal',
      ZoneLabel: 'No recent load logged',
      GaugePercent: 0
    }
  }

  const WeeklyMinutes = Recent.reduce((Sum, Entry) => Sum + (Number(Entry.minutes) || 0), 0)
  const AverageFatigue = Recent.reduce((Sum, Entry) => Sum + (Number(Entry.fatigue) || 0), 0) / Recent.length

  let Zone = 'optimal'
  if (AverageFatigue >= HighRiskFatigue || WeeklyMinutes > CautionMaxMinutes) {
    Zone = 'high-risk'
  } else if (AverageFatigue >= CautionFatigue || WeeklyMinutes > OptimalMaxMinutes) {
    Zone = 'caution'
  }

  const MinutesScore = WeeklyMinutes / CautionMaxMinutes
  const FatigueScore = AverageFatigue / 10
  const GaugePercent = Clamp(Math.round((MinutesScore * 0.6 + FatigueScore * 0.4) * 100), 0, 100)

  return {
    HasData: true,
    WeeklyMinutes,
    AverageFatigue: Math.round(AverageFatigue * 10) / 10,
    Zone,
    ZoneLabel: ZoneLabels[Zone],
    GaugePercent
  }
}
