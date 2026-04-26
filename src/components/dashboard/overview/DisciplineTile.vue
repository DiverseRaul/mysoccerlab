<template>
  <BentoItem :delay="750" extra-class="performance-tile">
    <div class="tile-header">
      <h4>Discipline & Physical</h4>
    </div>
    <div class="stats-row mini-stats">
      <div class="stat-group">
        <span class="medium-number">{{ totalFouls }}</span>
        <span class="label">Fouls</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-group">
        <span class="medium-number medium-number--yellow">{{ totalYellowCards }}</span>
        <span class="label">Yellows</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-group">
        <span class="medium-number medium-number--red">{{ totalRedCards }}</span>
        <span class="label">Reds</span>
      </div>
    </div>
  </BentoItem>
</template>

<script setup>
import { computed } from 'vue'
import BentoItem from './BentoItem.vue'

const props = defineProps({
  matches: { type: Array, required: true }
})

const totalFouls = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.fouls || 0), 0)
)

const totalYellowCards = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.yellow_card || 0), 0)
)

const totalRedCards = computed(() =>
  props.matches.reduce((sum, m) => sum + (m.red_card || 0), 0)
)
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

.header-spaced {
  margin-bottom: 30px;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 10px 0;
}

.mini-stats {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.medium-number {
  font-size: 1.6rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  background: linear-gradient(135deg, #fff 30%, var(--color-brand-fg) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.medium-number--yellow {
  background: none;
  -webkit-text-fill-color: var(--color-card-yellow);
  color: var(--color-card-yellow);
}

.medium-number--red {
  background: none;
  -webkit-text-fill-color: var(--color-danger);
  color: var(--color-danger);
}

.label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-weight-semibold);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent);
}
</style>
