/**
 * MySoccerLab — Dynamic Match Rating Engine v3 (Advanced Fairness)
 *
 * Scale: 1.0 – 10.0  (displayed as X.XX)
 */

const POSITION_FLAGS = (posStr = '') => {
  const p = posStr.toLowerCase()
  return {
    isGoalkeeper: p.includes('goalkeeper') || p.includes('goalie') || p.includes('gk'),
    isStriker: p.includes('striker') || p.includes('forward') || p.includes('cf') || p.includes('st'),
    isWinger: p.includes('winger') || p.includes('lw') || p.includes('rw') || p.includes('wide'),
    isAM: p.includes('attacking mid') || p.includes('am') || p.includes('number 10'),
    isCM: p.includes('central mid') || p.includes(' cm') || p.includes('box-to-box'),
    isDM: p.includes('defensive mid') || p.includes('dm') || p.includes('pivot') || p.includes('cdm'),
    isFullBack: p.includes('full back') || p.includes('fullback') || p.includes('lb') || p.includes('rb'),
    isCentreBack: p.includes('centre-back') || p.includes('center-back') || p.includes(' cb') || p.includes('centreback'),
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

// Progressive Goal Bonus (Diminishing returns per goal to require overall good play for a 10.0)
function _goalBonus(goals, baseValue) {
  let bonus = 0;
  for (let i = 1; i <= goals; i++) {
    if (i === 1) bonus += baseValue;         // 1st goal = 100% value
    else if (i === 2) bonus += baseValue * 0.85;  // 2nd goal = 85% value
    else bonus += baseValue * 0.70;  // 3rd+ goal = 70% value
  }
  return bonus;
}

// Progressive Save Bonus
function _saveBonus(saves) {
  if (saves <= 0) return 0
  let bonus = 0
  for (let i = 1; i <= saves; i++) {
    if (i <= 3) bonus += 0.25   // routine save
    else if (i <= 6) bonus += 0.35   // good save
    else bonus += 0.5   // exceptional save (kept team alive)
  }
  return bonus
}

// Graduated Conceded Penalty (1st goal hurts most, collapse hurts steadily)
function _concededPenalty(conceded) {
  if (conceded <= 0) return 0
  const penalties = [0.45, 0.40, 0.35]
  let total = 0
  for (let i = 0; i < conceded; i++) {
    total += penalties[i] !== undefined ? penalties[i] : 0.30
  }
  return total
}

// ─── Goalkeeper Formula ────────────────────────────────────────────────────────
function _goalkeeperRating(match, liveGkStats) {
  let r = 6.0

  // Result context
  if (match.score_for > match.score_against) r += 0.35
  else if (match.score_for < match.score_against) r -= 0.15

  const gk = liveGkStats || match.goalkeeper_stats
  const conceded = gk ? (gk.goals_conceded || 0) : (match.score_against || 0)
  const saves = gk ? (gk.saves || 0) : 0

  // 1. Goalkeeper Core Actions
  if (gk) {
    r += _saveBonus(saves)
    r += (gk.catches || 0) * 0.12
    r += (gk.punches || 0) * 0.08
    r += (gk.penalties_saved || 0) * 1.8
    r -= _concededPenalty(conceded)
    r -= (gk.errors_led_to_goal || 0) * 1.6
  } else {
    r -= _concededPenalty(conceded)
  }

  // 2. Clean Sheet Value (Scales with saves to reward earned clean sheets)
  if (conceded === 0) {
    if (saves >= 7) r += 1.2   // Heroic
    else if (saves >= 5) r += 0.9
    else if (saves >= 3) r += 0.65
    else if (saves >= 1) r += 0.4
    else r += 0.2   // Team defended well, GK wasn't tested
  }

  // 3. Modern GK Distribution (passing volume & accuracy)
  const succPasses = match.successful_passes || 0;
  const totalPasses = succPasses + (match.unsuccessful_passes || 0);
  if (totalPasses >= 10) {
    const passAcc = succPasses / totalPasses;
    const diff = passAcc - 0.65; // GKs expected to have ~65% due to long balls
    r += diff * 2.0; // Small bonus/penalty for good/bad distribution
  }

  // 4. Discipline & Costly Mistakes (GK losing possession is deadly)
  r -= (match.lost_possessions || 0) * 0.25
  r -= (match.own_goals || 0) * 2.5
  r -= (match.fouls || 0) * 0.2
  r -= (match.yellow_card || 0) * 0.8
  r -= (match.red_card || 0) * 3.5

  return Math.max(1.0, Math.min(10.0, r)).toFixed(2)
}

// ─── Outfield Formula ─────────────────────────────────────────────────────────
function _outfieldRating(match, pos, goals, shotsOn, shotsOff) {
  const {
    isStriker, isWinger, isAM, isCM, isDM, isFullBack, isCentreBack
  } = pos

  let r = 6.0

  // ── 1. Match Result Context ───────────────────────────────────────────────
  const won = match.score_for > match.score_against
  const lost = match.score_for < match.score_against
  if (won) r += 0.3
  if (lost) r -= 0.15

  // ── 2. Goal Contributions (Diminishing Returns applied) ───────────────────
  const assists = match.assists || 0
  const chances = match.created_chances || 0

  const goalVal = isStriker ? 1.8 : isWinger ? 1.6 : isAM ? 1.5 : 1.4
  const assistVal = isAM || isWinger ? 1.15 : 1.0
  const chanceVal = isAM ? 0.40 : isWinger ? 0.35 : 0.25

  r += _goalBonus(goals, goalVal);
  r += assists * assistVal
  r += chances * chanceVal

  // ── 3. Shooting Accuracy & Wastefulness ───────────────────────────────────
  const totalShots = shotsOn + shotsOff
  r += shotsOn * 0.15 // Reward testing the keeper

  // Wastefulness Penalty: Scales fairly by how many shots were wasted
  if (totalShots >= 3 && goals === 0) {
    const onTargetRate = shotsOn / totalShots
    if (onTargetRate < 0.35) {
      // Missing 6 shots hurts twice as much as missing 3
      r -= 0.12 * (totalShots / 3);
    }
  }

  // ── 4. Continuous, Volume-Weighted Passing ────────────────────────────────
  const succPasses = match.successful_passes || 0
  const failPasses = match.unsuccessful_passes || 0
  const totalPasses = succPasses + failPasses

  if (totalPasses > 5) {
    const passAcc = succPasses / totalPasses;

    // Different positions have different passing expectations
    const expectedAcc = (isCentreBack) ? 0.85
      : (isFullBack || isDM || isCM) ? 0.80
        : 0.75;

    const diff = passAcc - expectedAcc; // Positive = good, Negative = bad

    // Volume multiplier: Completing 60 passes is 2x more impactful than 30 passes
    // Capped at 3.0x multiplier (~75 passes) to avoid infinity
    const volumeScale = Math.min(3.0, Math.max(0.4, totalPasses / 25));

    const passWeight = (isCM || isDM) ? 1.5
      : (isCentreBack || isFullBack) ? 1.2
        : 1.0;

    // Continuous score: Smoothly applies rating without arbitrary tiers
    let passScore = diff * 5.0 * volumeScale;

    // Clamp the single pass impact to prevent massive extremes (+/- 1.8 max shift)
    passScore = Math.max(-1.8, Math.min(1.8, passScore));

    r += passScore * passWeight;
  }

  // ── 5. Defensive Accountability (Missing in original logic) ───────────────
  const conceded = match.score_against || 0;

  if (isCentreBack || isFullBack) {
    if (conceded === 0) r += 0.5; // Earned clean sheet
    else r -= (conceded * 0.15);  // Penetrated defense
  } else if (isDM) {
    if (conceded === 0) r += 0.3; // Earned clean sheet
    else r -= (conceded * 0.10);  // Penetrated defense
  }

  // ── 6. Defensive Actions ──────────────────────────────────────────────────
  const tackles = match.tackles || 0
  const interceptions = match.interceptions || 0
  const clearances = match.clearances || 0

  const defWeight = (isDM || isCentreBack) ? 1.35 : isFullBack ? 1.20 : 0.9

  r += tackles * 0.10 * defWeight
  r += interceptions * 0.15 * defWeight
  r += clearances * 0.05 * defWeight

  // ── 7. Possession & Contextual Risk Assessment ────────────────────────────
  const dribbles = match.dribbles || 0
  const lostPoss = match.lost_possessions || 0
  const dribWeight = isWinger ? 1.3 : isStriker ? 1.1 : 1.0
  
  // Wingers lose the ball naturally from taking risky dribbles — penalize less
  const lostPossWeight = isWinger ? 0.06 : isStriker ? 0.09 : (isFullBack || isDM) ? 0.18 : (isCM) ? 0.12 : 0.25;

  r += dribbles * 0.12 * dribWeight
  r -= lostPoss * lostPossWeight;

  // ── 8. Match-defining Errors & Discipline ─────────────────────────────────
  r -= (match.errors_led_to_goal || 0) * 1.6
  r -= (match.own_goals || 0) * 2.5
  r -= (match.fouls || 0) * 0.18
  r -= (match.yellow_card || 0) * 0.85
  r -= (match.red_card || 0) * 3.5

  return Math.max(1.0, Math.min(10.0, r)).toFixed(2)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * calculateMatchRating(match, liveData?)
 *
 * @param {object}  match       — match object from Supabase
 * @param {object}  [liveData]  — optional live overrides: { shotsOn, shotsOff, goals, gkStats }
 * @returns {string} e.g. "7.83"
 */
export function calculateMatchRating(match, liveData = null) {
  if (!match) return '0.00'

  const pos = POSITION_FLAGS(match.position_played || '')

  if (pos.isGoalkeeper) {
    return _goalkeeperRating(match, liveData?.gkStats ?? null)
  }

  const goals = liveData?.goals ?? (match.my_goals || 0)
  const shotsOn = liveData?.shotsOn ?? (match.shots_on_target || 0)
  const shotsOff = liveData?.shotsOff ?? (match.shots_off_target || 0)

  return _outfieldRating(match, pos, goals, shotsOn, shotsOff)
}

/**
 * getRatingColor(rating)  →  CSS class name
 */
export function getRatingColor(rating) {
  const r = parseFloat(rating)
  if (r >= 9.5) return 'rating-world-class'
  if (r >= 9.0) return 'rating-elite'
  if (r >= 8.0) return 'rating-excellent'
  if (r >= 7.0) return 'rating-good'
  if (r >= 6.0) return 'rating-average'
  if (r >= 5.0) return 'rating-poor'
  return 'rating-bad'
}

/**
 * getRatingLabel(rating)  →  human-readable tier
 */
export function getRatingLabel(rating) {
  const r = parseFloat(rating)
  if (r >= 9.5) return 'World Class'
  if (r >= 9.0) return 'Outstanding'
  if (r >= 8.0) return 'Excellent'
  if (r >= 7.0) return 'Good'
  if (r >= 6.5) return 'Solid'
  if (r >= 6.0) return 'Average'
  if (r >= 5.5) return 'Below Average'
  if (r >= 4.0) return 'Poor'
  return 'Very Poor'
}