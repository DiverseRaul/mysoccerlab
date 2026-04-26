<template>
  <BentoItem :delay="850" extra-class="bento-item--wide insights-tile">
    <div class="tile-header">
      <h4>Season Insights</h4>
    </div>
    <div class="insights-content">
      <div class="insight-block">
        <span class="insight-label">Recent Form</span>
        <div class="form-guide">
          <div
            v-for="(Match, I) in FormGuide"
            :key="I"
            class="form-dot"
            :class="`form-${Match.result}`"
            :title="`${Match.label} vs ${Match.opponent}`"
          >{{ Match.letter }}</div>
        </div>
      </div>

      <div class="divider-line"></div>

      <div class="insight-block" v-if="BestMatch">
        <span class="insight-label">Best Performance</span>
        <MatchCard variant="tile" :match="BestMatch" />
      </div>

      <div class="divider-line"></div>

      <div class="records-grid">
        <div class="record-item">
          <span
            class="rec-val rec-streak-val"
            :class="{
              'rec-val--win':  CurrentStreak.type === 'W',
              'rec-val--loss': CurrentStreak.type === 'L',
              'rec-val--draw': CurrentStreak.type === 'D'
            }"
          >{{ CurrentStreak.count }} {{ CurrentStreak.FullType || '' }}</span>
          <span class="rec-lbl">Streak</span>
          <span
            v-if="PeakWinStreak > 1 && CurrentStreak.type !== 'W'"
            class="rec-sub"
          >best: {{ PeakWinStreak }} Win</span>
          <span
            v-else-if="PeakWinStreak > CurrentStreak.count && CurrentStreak.type === 'W'"
            class="rec-sub"
          >best: {{ PeakWinStreak }} Win</span>
        </div>
        <div class="record-item">
          <span class="rec-val">{{ MaxGoalsRecord }}</span>
          <span class="rec-lbl">Most Goals</span>
        </div>
        <div
          class="record-item record-item--trend"
          :title="FormTrendTitle"
        >
          <span
            class="rec-val rec-val--trend"
            :class="{
              'rec-val--improving': FormTrend === 'improving',
              'rec-val--declining': FormTrend === 'declining'
            }"
          >
            {{ FormTrend === 'improving' ? '↑' : FormTrend === 'declining' ? '↓' : '→' }}
            <span v-if="FormTrendDelta !== null" class="rec-trend-delta">
              {{ FormTrendDelta > 0 ? '+' : '' }}{{ FormTrendDelta }}
            </span>
          </span>
          <span class="rec-lbl">AVG Rating</span>
          <span v-if="AvgLast5Display" class="rec-sub">
            Last 5 games: {{ AvgLast5Display }} | {{ AvgPrev5Display }} prior 5 games
          </span>
          <span v-else class="rec-sub">last 5 vs prior 5</span>
        </div>
        <div class="record-item">
          <span class="rec-val rec-val--rating">{{ BestRating }}</span>
          <span class="rec-lbl">Best Rating</span>
        </div>
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'
import MatchCard from '../../ui/MatchCard.vue'
import { calculateMatchRating } from '../../../lib/rating'

const Props = defineProps({
  matches: { type: Array, required: true }
})

const FormGuide = computed(() =>
  Props.matches.slice(0, 5).map(Match => {
    if (Match.score_for > Match.score_against) {
      return { letter: 'W', result: 'win', label: 'Win', opponent: Match.opponent }
    }
    if (Match.score_for < Match.score_against) {
      return { letter: 'L', result: 'loss', label: 'Loss', opponent: Match.opponent }
    }
    return { letter: 'D', result: 'draw', label: 'Draw', opponent: Match.opponent }
  })
)

const BestMatch = computed(() => {
  if (Props.matches.length === 0) return null
  return Props.matches.reduce(
    (Best, Current) => {
      const BestRating = parseFloat(calculateMatchRating(Best))
      const CurrentRating = parseFloat(calculateMatchRating(Current))
      return CurrentRating > BestRating ? Current : Best
    },
    Props.matches[0]
  )
})

const MaxGoalsRecord = computed(() => {
  if (Props.matches.length === 0) return 0
  return Math.max(...Props.matches.map(M => M.my_goals || 0))
})

const PeakWinStreak = computed(() => {
  let MaxStreak = 0
  let Current = 0
  for (const M of Props.matches) {
    if (M.score_for > M.score_against) {
      Current++
      if (Current > MaxStreak) MaxStreak = Current
    } else {
      Current = 0
    }
  }
  return MaxStreak
})

const CurrentStreak = computed(() => {
  if (Props.matches.length === 0) return { count: 0, type: null, FullType: null }
  
  const ResultOf = (M) => {
    if (M.score_for > M.score_against) return 'W'
    if (M.score_for < M.score_against) return 'L'
    return 'D'
  }
  
  const TypeMap = { W: 'Win', L: 'Lose', D: 'Draw' }
  const Type = ResultOf(Props.matches[0])
  let Count = 1
  
  for (let I = 1; I < Props.matches.length; I++) {
    if (ResultOf(Props.matches[I]) === Type) Count++
    else break
  }
  
  return { count: Count, type: Type, FullType: TypeMap[Type] }
})

const FormTrendComputation = computed(() => {
  if (Props.matches.length < 6) return { trend: 'stable', delta: null, avgLast: null, avgPrev: null }
  const Last5 = Props.matches.slice(0, 5)
  const Prev = Props.matches.slice(5, 10)
  if (Prev.length === 0) return { trend: 'stable', delta: null, avgLast: null, avgPrev: null }
  
  const AvgLast = Last5.reduce((Sum, M) => Sum + parseFloat(calculateMatchRating(M)), 0) / Last5.length
  const AvgPrev = Prev.reduce((Sum, M) => Sum + parseFloat(calculateMatchRating(M)), 0) / Prev.length
  const Diff = AvgLast - AvgPrev
  const Delta = Math.round(Diff * 10) / 10
  
  let Trend = 'stable'
  if (Diff > 0.3) Trend = 'improving'
  else if (Diff < -0.3) Trend = 'declining'
  
  return { trend: Trend, delta: Delta, avgLast: AvgLast, avgPrev: AvgPrev }
})

const FormTrend = computed(() => FormTrendComputation.value.trend)
const FormTrendDelta = computed(() => FormTrendComputation.value.delta)

const AvgLast5Display = computed(() => {
  const V = FormTrendComputation.value.avgLast
  return V === null ? '' : V.toFixed(1)
})

const AvgPrev5Display = computed(() => {
  const V = FormTrendComputation.value.avgPrev
  return V === null ? '' : V.toFixed(1)
})

const FormTrendTitle = computed(() => {
  const { avgLast: AvgLast, avgPrev: AvgPrev, delta: Delta } = FormTrendComputation.value
  if (AvgLast === null) return 'Need at least 6 matches to show a rating trend'
  const Direction = Delta > 0 ? 'higher' : Delta < 0 ? 'lower' : 'unchanged'
  return `Your average match rating across the last 5 games (${AvgLast.toFixed(1)}) is ${Math.abs(Delta)} ${Direction} than the 5 games before that (${AvgPrev.toFixed(1)}).`
})

const BestRating = computed(() => {
  if (!BestMatch.value) return '—'
  return parseFloat(calculateMatchRating(BestMatch.value)).toFixed(1)
})
</script>

<style scoped>
.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tile-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.insights-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.insight-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.divider-line {
  height: 1px;
  background: var(--color-border-subtle);
}

.form-guide {
  display: flex;
  gap: 6px;
}

.form-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
}

.form-win  { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-accent-border); }
.form-loss { background: var(--color-danger-bg);  color: var(--color-danger);  border: 1px solid rgba(239, 83, 80, 0.4); }
.form-draw { background: var(--color-neutral-bg); color: var(--color-neutral); border: 1px solid rgba(189, 189, 189, 0.4); }

.records-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.record-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-sm);
}

.record-item--trend {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.rec-val {
  font-size: 1.6rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.rec-val--streak { color: var(--color-success); }
.rec-val--rating { color: var(--color-accent); }
.rec-val--win    { color: var(--color-success); }
.rec-val--loss   { color: var(--color-danger); }
.rec-val--draw   { color: var(--color-neutral); }

.rec-streak-val {
  letter-spacing: 0.5px;
}

.rec-val--trend {
  font-size: 1.6rem;
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.rec-trend-delta {
  font-size: 0.95rem;
  font-weight: var(--font-weight-bold);
}

.rec-val--improving { color: var(--color-success); }
.rec-val--declining { color: var(--color-danger); }

.rec-lbl {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rec-sub {
  font-size: 0.65rem;
  color: var(--color-text-faint);
  letter-spacing: 0.3px;
  margin-top: 2px;
}
</style>