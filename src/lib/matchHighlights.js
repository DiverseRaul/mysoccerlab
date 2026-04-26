/**
 * Pure function — picks the most notable stat for a match for display as a
 * "top-stat highlight chip" on the match list card. Position-aware: a
 * goalkeeper's standout will be a clean sheet, a striker's will usually be
 * goals, etc.
 *
 * Returns { icon, label } or null when nothing is notable enough.
 */

const isGoalkeeper = (m) =>
  typeof m?.position_played === 'string' &&
  m.position_played.toLowerCase().includes('goalkeeper')

export function getMatchHighlight(match) {
  if (!match) return null

  const goals = match.my_goals || 0
  const assists = match.assists || 0
  const tackles = match.tackles || 0
  const interceptions = match.interceptions || 0
  const clearances = match.clearances || 0
  const chances = match.created_chances || 0
  const conceded = match.score_against ?? 0
  const gkSaves = match.goalkeeper_stats?.saves || 0

  // Goalkeepers — clean sheets and big-save games come first
  if (isGoalkeeper(match)) {
    if (conceded === 0) return { icon: '🛡', label: 'Clean sheet' }
    if (gkSaves >= 6) return { icon: '🧤', label: `${gkSaves} saves` }
  }

  // Outfield scoring milestones
  if (goals >= 3) return { icon: '🎯', label: 'Hat-trick' }
  if (goals >= 2) return { icon: '⚽', label: 'Brace' }
  if (goals >= 1 && assists >= 2) return { icon: '🅰️', label: `${goals}G ${assists}A` }
  if (goals >= 1) return { icon: '⚽', label: `${goals} goal${goals > 1 ? 's' : ''}` }
  if (assists >= 2) return { icon: '🅰️', label: `${assists} assists` }

  // Defensive standouts
  if (tackles >= 8) return { icon: '💪', label: `${tackles} tackles` }
  if (tackles + interceptions + clearances >= 12) {
    return { icon: '🛡', label: 'Defensive wall' }
  }

  // Playmaker games
  if (chances >= 4) return { icon: '🎯', label: `${chances} chances` }

  return null
}
