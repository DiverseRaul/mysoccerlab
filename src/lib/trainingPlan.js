// Pure helpers for AI-generated weekly training plans. Shared by the AI Coach
// chat (CoachScreen) and the Weekly Plan tab so the parsing logic lives in one
// place and can be unit-tested without a component.

// Parse the AI coach's "Monday – Theme\n- drill" calendar text into structured
// days. Tolerates Day N / Session N headers and `:` / `–` / `-` separators,
// and strips markdown bold + list punctuation.
export function parseCalendar(text) {
  if (!text) return []
  // A day block runs from its header to the NEXT day header or the true end of
  // the string. The terminator must be end-of-STRING `(?![\s\S])`, not `$` —
  // with the /m flag `$` matches every line end, which would drop the drill
  // lines that follow the header.
  const pattern = /^((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day\s*\d+|Session\s*\d+)\b.*?)(?=\n(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day\s*\d+|Session\s*\d+)\b|(?![\s\S]))/gims
  const out = []
  const clean = text.replace(/\r\n/g, '\n')
  let m
  pattern.lastIndex = 0
  while ((m = pattern.exec(clean)) !== null) {
    const lines = m[1].trim().split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) continue
    const header = lines[0]
    const sep = header.match(/^(.*?)(?:\s*[:–—-]\s*)(.+)$/)
    const DayTitle = (sep ? sep[1] : header).replace(/^[#*]+\s*/, '').trim()
    const FocusTheme = (sep ? sep[2].replace(/\*\*/g, '') : 'Training').trim()
    const Drills = lines.slice(1).map((l) => l.replace(/^[-*•\d.]+\s*/, '').replace(/\*\*/g, '').trim()).filter(Boolean)
    out.push({ DayTitle, FocusTheme, Drills })
  }
  return out
}

// Build the user-message prompt for a one-week, one-focus training plan. The
// week builds toward a single aspect, shaped by the player's options (sessions
// per week, minutes per session, intensity, available equipment); it prefers
// the player's tracked drills and invents new ones to fill gaps.
export function buildWeeklyPlanPrompt(focus, drillSummary = [], opts = {}) {
  const aspect = (focus || 'overall game').trim()
  const daysPerWeek = Number(opts.daysPerWeek) || 4
  const minutes = Number(opts.minutesPerSession) || 45
  const intensity = (opts.intensity || 'Moderate').toString()
  const equipment = (opts.equipment || '').toString().trim()

  const drillList = (drillSummary || [])
    .map((d) => `- ${d.name} (${d.metricType}${d.latest ? `, latest ${d.latest}` : ''})`)
    .join('\n')
  const drillsBlock = drillList
    ? `The player already tracks these drills — prefer them where they fit, and invent new drills to fill gaps:\n${drillList}`
    : `The player has not logged any drills yet, so invent appropriate drills.`

  const lines = [
    `Build me a 7-day training week to improve ONE aspect: ${aspect}.`,
    `Schedule exactly ${daysPerWeek} training day(s) across the week; mark the remaining days as "Rest" with a short active-recovery note.`,
    `Each training day has ONE main drill of about ${minutes} minutes at ${intensity.toLowerCase()} intensity, and the training days must progress and build on each other toward ${aspect}.`
  ]
  if (equipment) lines.push(`Only assume this equipment / setting is available: ${equipment}.`)
  lines.push(drillsBlock)
  lines.push(
    `Output ONLY the plan, one line per day Monday→Sunday, in this exact format (no preamble):`,
    `Monday – <short theme, or "Rest">`,
    `- <one drill with reps/sets or duration, or "Active recovery">`,
    `…through Sunday. Keep each drill to a single concise line.`
  )
  return lines.join('\n')
}
