<template>
  <BentoItem :delay="0" extra-class="bento-item--wide season-totals-tile">
    <div class="season-totals">
      <header class="season-totals__head">
        <h3 class="season-totals__title">Season Totals</h3>
        <span class="season-totals__sub">{{ matchesCount }} {{ matchesCount === 1 ? 'match' : 'matches' }} · avg {{ avgRating }} rating</span>
      </header>

      <div class="season-totals__groups">
        <section v-for="g in groups" :key="g.title" class="stat-group">
          <h4 class="stat-group__title">{{ g.title }}</h4>
          <div v-for="r in g.rows" :key="r.label" class="stat-row">
            <span class="stat-row__label">{{ r.label }}</span>
            <span class="stat-row__value">
              {{ r.value }}<span v-if="r.unit" class="stat-row__unit">{{ r.unit }}</span>
              <span v-if="r.per" class="stat-row__per">{{ r.per }}/match</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import { calculateMatchRating } from '../../../lib/rating'

const props = defineProps({
  matches: { type: Array, required: true }
})

const matchesCount = computed(() => props.matches.length)

const sum = (key) => props.matches.reduce((acc, m) => acc + (Number(m[key]) || 0), 0)
const per = (total) => (matchesCount.value ? (total / matchesCount.value).toFixed(1) : '0.0')

const avgRating = computed(() => {
  if (!matchesCount.value) return '0.00'
  const total = props.matches.reduce((acc, m) => acc + parseFloat(calculateMatchRating(m)), 0)
  return (total / matchesCount.value).toFixed(2)
})

const groups = computed(() => {
  const goals = sum('my_goals')
  const assists = sum('assists')
  const shotsOn = sum('shots_on_target')
  const shotsOff = sum('shots_off_target')
  const chances = sum('created_chances')
  const passOk = sum('successful_passes')
  const passBad = sum('unsuccessful_passes')
  const dribbles = sum('dribbles')
  const tackles = sum('tackles')
  const interceptions = sum('interceptions')
  const clearances = sum('clearances')
  const fouls = sum('fouls')
  const pensConceded = sum('penalties_conceded')

  const totalShots = goals + shotsOn + shotsOff
  const conversion = totalShots ? Math.round((goals / totalShots) * 100) : 0
  const passTotal = passOk + passBad
  const passAcc = passTotal ? Math.round((passOk / passTotal) * 100) : 0

  return [
    {
      title: 'Attacking',
      rows: [
        { label: 'Goals', value: goals, per: per(goals) },
        { label: 'Assists', value: assists, per: per(assists) },
        { label: 'Shots', value: totalShots, per: per(totalShots) },
        { label: 'On target', value: goals + shotsOn },
        { label: 'Conversion', value: conversion, unit: '%' }
      ]
    },
    {
      title: 'Possession',
      rows: [
        { label: 'Passes', value: passOk, per: per(passOk) },
        { label: 'Pass accuracy', value: passAcc, unit: '%' },
        { label: 'Chances created', value: chances, per: per(chances) },
        { label: 'Dribbles', value: dribbles, per: per(dribbles) }
      ]
    },
    {
      title: 'Defending',
      rows: [
        { label: 'Tackles', value: tackles, per: per(tackles) },
        { label: 'Interceptions', value: interceptions, per: per(interceptions) },
        { label: 'Clearances', value: clearances, per: per(clearances) },
        { label: 'Fouls', value: fouls },
        { label: 'Pens conceded', value: pensConceded }
      ]
    }
  ]
})
</script>

<style scoped>
.season-totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.season-totals__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.season-totals__title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.season-totals__sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.season-totals__groups {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.stat-group__title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 9px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.stat-row__value {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-row__unit {
  font-size: 0.7em;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  margin-left: 1px;
}

.stat-row__per {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-faint);
}

@media (min-width: 600px) {
  .season-totals__groups {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }
}
</style>
