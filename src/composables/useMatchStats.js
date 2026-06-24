import { computed } from 'vue'
import { calculateMatchRating as calculateMatchRatingFn, getRatingColor } from '../lib/rating'

/**
 * Pure aggregation + presentation logic. No Supabase access.
 *
 * Owns the career/recent aggregations, the EA-FC style stat computeds, the
 * live-rating wrapper (which injects in-progress shot/goal data for the active
 * match), and the small formatting helpers.
 *
 * @param {object} deps
 * @param {() => any[]} deps.matches - getter returning the reactive matches array
 * @param {import('vue').Ref} deps.activeMatch
 * @param {import('vue').Ref} deps.matchGoals
 * @param {import('vue').Ref} deps.matchShots
 * @param {import('vue').Ref} deps.goalkeeperStats
 */
export function useMatchStats({ matches, activeMatch, matchGoals, matchShots, goalkeeperStats }) {
  // Wrap the shared function to inject live shot/goal data when in active match view
  const calculateMatchRating = (match) => {
    if (!match) return '0.00'
    if (activeMatch.value && match.id === activeMatch.value.id) {
      // Live view: inject reactive data as liveData override
      const liveData = {
        goals: matchGoals.value.length,
        shotsOn: matchShots.value.filter(s => s.on_target).length,
        shotsOff: matchShots.value.filter(s => !s.on_target).length,
        gkStats: goalkeeperStats.value || null,
      }
      return calculateMatchRatingFn(match, liveData)
    }
    return calculateMatchRatingFn(match)
  }

  const wins = computed(() => {
    return matches().filter(match => match.score_for > match.score_against).length
  })

  const winRate = computed(() => {
    if (matches().length === 0) return 0
    return Math.round((wins.value / matches().length) * 100)
  })

  const averageRating = computed(() => {
    if (matches().length === 0) return '0.0'
    const totalRating = matches().reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
    return (totalRating / matches().length).toFixed(2)
  })

  const highestRating = computed(() => {
    if (matches().length === 0) return '0.0'
    const ratings = matches().map(match => parseFloat(calculateMatchRating(match)))
    return Math.max(...ratings).toFixed(2)
  })

  const recentMatches = computed(() => {
    return matches().slice(0, 10).reverse()
  })

  // Average rating for last 10 matches
  const recentAverageRating = computed(() => {
    if (recentMatches.value.length === 0) return '0.0'
    const totalRating = recentMatches.value.reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
    return (totalRating / recentMatches.value.length).toFixed(2)
  })

  // Highest rating in last 10 matches
  const recentHighestRating = computed(() => {
    if (recentMatches.value.length === 0) return '0.0'
    const ratings = recentMatches.value.map(match => parseFloat(calculateMatchRating(match)))
    return Math.max(...ratings).toFixed(2)
  })

  const totalGoals = computed(() => {
    return matches().reduce((sum, match) => sum + (match.my_goals || 0), 0)
  })

  const totalAssists = computed(() => {
    return matches().reduce((sum, match) => sum + (match.assists || 0), 0)
  })

  const totalSuccessfulPasses = computed(() => {
    return matches().reduce((sum, match) => sum + (match.successful_passes || 0), 0)
  })

  const totalUnsuccessfulPasses = computed(() => {
    return matches().reduce((sum, match) => sum + (match.unsuccessful_passes || 0), 0)
  })

  const passAccuracy = computed(() => {
    const total = totalSuccessfulPasses.value + totalUnsuccessfulPasses.value
    if (total === 0) return 0
    return Math.round((totalSuccessfulPasses.value / total) * 100)
  })

  const totalTackles = computed(() => {
    return matches().reduce((sum, match) => sum + (match.tackles || 0), 0)
  })

  const totalInterceptions = computed(() => {
    return matches().reduce((sum, match) => sum + (match.interceptions || 0), 0)
  })

  const totalClearances = computed(() => {
    return matches().reduce((sum, match) => sum + (match.clearances || 0), 0)
  })

  const totalFouls = computed(() => {
    return matches().reduce((sum, match) => sum + (match.fouls || 0), 0)
  })

  const averageGoalsPerMatch = computed(() => {
    if (matches().length === 0) return '0.0'
    return ((totalGoals.value + totalAssists.value) / matches().length).toFixed(1)
  })

  const maxGoalsInMatch = computed(() => {
    if (matches().length === 0) return 1
    return Math.max(...matches().map(match => (match.my_goals || 0) + (match.assists || 0)), 1)
  })

  // EA FC Style Stats
  const shootingStat = computed(() => {
    if (matches().length === 0) return 65
    const avgGoals = totalGoals.value / matches().length
    const avgShotsOnTarget = matches().reduce((sum, match) => {
      // Calculate shots on target from match data if available
      return sum + (match.shots_on_target || 0)
    }, 0) / matches().length

    let rating = 50 + (avgGoals * 15) + (avgShotsOnTarget * 5)
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const passingStat = computed(() => {
    if (matches().length === 0) return 65
    const accuracy = passAccuracy.value
    const avgPasses = (totalSuccessfulPasses.value + totalUnsuccessfulPasses.value) / matches().length

    let rating = 40 + (accuracy * 0.4) + (avgPasses * 0.5)
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const defendingStat = computed(() => {
    if (matches().length === 0) return 65
    const avgTackles = totalTackles.value / matches().length
    const avgInterceptions = totalInterceptions.value / matches().length
    const avgClearances = totalClearances.value / matches().length

    let rating = 45 + (avgTackles * 8) + (avgInterceptions * 6) + (avgClearances * 4)
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const dribblingStat = computed(() => {
    if (matches().length === 0) return 65
    const avgDribbles = matches().reduce((sum, match) => sum + (match.dribbles || 0), 0) / matches().length
    const avgGoals = totalGoals.value / matches().length

    let rating = 50 + (avgDribbles * 6) + (avgGoals * 5)
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const paceStat = computed(() => {
    if (matches().length === 0) return 70
    // Base pace on overall performance and assists (indicating quick play)
    const avgAssists = totalAssists.value / matches().length
    const winRateBonus = winRate.value * 0.2

    let rating = 60 + (avgAssists * 8) + winRateBonus
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const physicalStat = computed(() => {
    if (matches().length === 0) return 65
    const avgFouls = totalFouls.value / matches().length
    const avgTackles = totalTackles.value / matches().length
    const matchesPlayed = matches().length

    // Higher fouls might indicate physicality, but too many is bad
    let rating = 55 + (avgTackles * 6) + (avgFouls * 2) + (matchesPlayed * 0.5)
    return Math.min(99, Math.max(30, Math.round(rating)))
  })

  const formStat = computed(() => {
    if (matches().length === 0) return 65
    const recent = recentMatches.value.slice(0, 10) // Last 10 matches
    if (recent.length === 0) return 65

    const recentRatings = recent.map(match => parseFloat(calculateMatchRating(match)))
    const avgRecentRating = recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length

    // Convert match rating (0-10) to stat rating (30-99)
    let formRating = 30 + (avgRecentRating * 6.9) // Scale 0-10 to 30-99

    // Bonus for recent wins
    const recentWins = recent.filter(match => match.score_for > match.score_against).length
    const winBonus = (recentWins / recent.length) * 10

    return Math.min(99, Math.max(30, Math.round(formRating + winBonus)))
  })

  const overallRating = computed(() => {
    if (matches().length === 0) return 65
    const avgStats = (shootingStat.value + passingStat.value + defendingStat.value + dribblingStat.value + paceStat.value + physicalStat.value) / 6
    return Math.min(99, Math.max(30, Math.round(avgStats)))
  })

  const getStatColorClass = (statType, value) => {
    const numValue = parseFloat(value) || 0
    if (statType === 'rating') {
      // Delegate to shared rating utility
      return getRatingColor(numValue)
    }
    // Keep original logic for other stat types
    if (statType === 'goals') {
      if (numValue >= 2) return 'stat-good'
      if (numValue >= 1) return 'stat-mid'
      return 'stat-bad'
    }
    if (statType === 'assists') {
      if (numValue >= 2) return 'stat-good'
      if (numValue >= 1) return 'stat-mid'
      return 'stat-bad'
    }
    return ''
  }

  const getMatchResult = (match) => {
    if (match.score_for > match.score_against) return 'Win'
    if (match.score_for < match.score_against) return 'Loss'
    return 'Draw'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    // Add a day to the date to correct for timezone issues
    const date = new Date(dateString)
    date.setDate(date.getDate() + 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return {
    calculateMatchRating,
    wins,
    winRate,
    averageRating,
    highestRating,
    recentMatches,
    recentAverageRating,
    recentHighestRating,
    totalGoals,
    totalAssists,
    totalSuccessfulPasses,
    totalUnsuccessfulPasses,
    passAccuracy,
    totalTackles,
    totalInterceptions,
    totalClearances,
    totalFouls,
    averageGoalsPerMatch,
    maxGoalsInMatch,
    shootingStat,
    passingStat,
    defendingStat,
    dribblingStat,
    paceStat,
    physicalStat,
    formStat,
    overallRating,
    getStatColorClass,
    getMatchResult,
    formatDate,
  }
}
