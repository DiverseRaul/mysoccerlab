<template>
  <div class="shot-map-section">
    <div class="section-header">
      <h3>Shot Map Analytics</h3>
      <p class="section-subtitle">Visualize your shooting accuracy and goal placement</p>
    </div>
    <div class="shot-map-container card-glass">
      <div class="shot-map-header">
        <div class="shot-map-stats">
          <div class="shot-stat-item">
            <div class="stat-icon-wrapper shots">
              <span class="icon">📊</span>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ totalShotsWithQuadrant }}</span>
              <span class="stat-label">Total Shots</span>
              <span class="stat-breakdown">{{ totalShotsOnTarget }} on target • {{ totalShotsOffTarget }} off target</span>
            </div>
          </div>
          <div class="shot-stat-item">
            <div class="stat-icon-wrapper goals">
              <span class="icon">⚽</span>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ totalGoalsWithQuadrant }}</span>
              <span class="stat-label">Goals Scored</span>
            </div>
          </div>
          <div class="shot-stat-item">
            <div class="stat-icon-wrapper accuracy">
              <span class="icon">✓</span>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ shotAccuracy }}%</span>
              <span class="stat-label">Accuracy</span>
            </div>
          </div>
        </div>
      </div>
      <div class="shot-map-content">
        <div class="view-toggle">
          <button 
            @click="shotMapView = 'goal'" 
            :class="['toggle-btn', { active: shotMapView === 'goal' }]"
          >
            Goal Placement
          </button>
          <button 
            @click="shotMapView = 'field'" 
            :class="['toggle-btn', { active: shotMapView === 'field' }]"
          >
            Shot Origins
          </button>
        </div>

        <div v-if="shotMapView === 'goal'" class="goal-view-wrapper">
          <div class="goal-frame shared-frame">
            <div class="shot-heat-map">
              <div 
                v-for="i in 9" 
                :key="i" 
                class="heat-map-quadrant"
                :class="getHeatMapClass(i)"
                :style="getHeatMapStyle(i)"
              >
                <div class="quadrant-data">
                  <div class="quadrant-goals" v-if="getQuadrantGoals(i) > 0">
                    <span class="count">{{ getQuadrantGoals(i) }}</span>
                  </div>
                  <div class="quadrant-shots" v-if="getQuadrantShots(i) > 0">
                    <span class="count">{{ getQuadrantShots(i) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="goal-legend">
            <div class="legend-item">
              <div class="legend-indicator goal"></div>
              <span>Goals</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator shot"></div>
              <span>Shots on Target</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator empty"></div>
              <span>No Shots</span>
            </div>
          </div>
        </div>
        
        <div v-if="shotMapView === 'field'" class="field-origin-wrapper">
          <div v-if="allShotsWithPosition.length === 0 && allGoalsWithPosition.length === 0" class="no-data-message">
            <p>No shot positions recorded yet.</p>
            <p style="font-size: 0.85rem; opacity: 0.7;">New shots/goals will appear here after you apply the database migration and record them with field positions.</p>
          </div>
          
          <div v-else class="field-heat-map-frame shared-frame">
            <div class="field-pattern"></div>
            
            <!-- SVG Field Markings -->
            <svg class="field-markings-svg" viewBox="0 0 68 52.5" preserveAspectRatio="none">
              <!-- Outline -->
              <rect x="0" y="0" width="68" height="52.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
              
              <!-- Penalty Box (16.5m deep, 40.32m wide) -->
              <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
              
              <!-- Goal Area (5.5m deep, 18.32m wide) -->
              <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
              
              <!-- Penalty Spot (11m from goal) -->
              <circle cx="34" cy="11" r="0.4" fill="rgba(255,255,255,0.8)" />
              
              <!-- Penalty Arc (Radius 9.15m) -->
              <path d="M 26.68 16.5 A 9.15 9.15 0 0 0 41.32 16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
              
              <!-- Center Circle Arc (at 52.5m) -->
              <path d="M 24.85 52.5 A 9.15 9.15 0 0 1 43.15 52.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
              
              <!-- Corner Arcs -->
              <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
              <path d="M 68 2 A 2 2 0 0 1 66 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
              
              <!-- Goal Post (External) -->
              <path d="M 30.34 0 L 30.34 -1.5 L 37.66 -1.5 L 37.66 0" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8" />
            </svg>
            
            <svg class="shot-trajectories" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line 
                v-for="(shot, index) in allShotsWithPosition.filter(s => s.on_target)" 
                :key="'shot-line-' + index"
                :x1="getShotCoordinates(shot).x"
                :y1="getShotCoordinates(shot).y"
                :x2="getGoalTargetX(shot)"
                y2="0"
                class="shot-trajectory-line"
              />
              <line 
                v-for="(goal, index) in allGoalsWithPosition" 
                :key="'goal-line-' + index"
                :x1="getShotCoordinates(goal).x"
                :y1="getShotCoordinates(goal).y"
                :x2="getGoalTargetX(goal)"
                y2="0"
                class="shot-trajectory-line goal-trajectory"
              />
              
              <circle 
                v-for="(shot, index) in allShotsWithPosition.filter(s => s.on_target)" 
                :key="'shot-target-' + index"
                :cx="getGoalTargetX(shot)"
                cy="0"
                r="1.2"
                class="goal-target-marker shot-target"
              />
              <circle 
                v-for="(goal, index) in allGoalsWithPosition" 
                :key="'goal-target-' + index"
                :cx="getGoalTargetX(goal)"
                cy="0"
                r="1.5"
                class="goal-target-marker goal-target"
              />
            </svg>
            
            <div class="shot-markers">
              <div 
                v-for="(shot, index) in allShotsWithPosition" 
                :key="'shot-' + index" 
                class="shot-marker"
                :class="{ 'off-target-shot': !shot.on_target }"
                :style="getShotMarkerStyle(shot)"
                :title="`Shot ${index + 1} - ${shot.on_target ? 'On Target' : 'Off Target'}`"
              ></div>
              <div 
                v-for="(goal, index) in allGoalsWithPosition" 
                :key="'goal-' + index" 
                class="goal-marker"
                :style="getShotMarkerStyle(goal)"
                :title="`Goal ${index + 1}`"
              ></div>
            </div>
          </div>
          
          <div v-if="allShotsWithPosition.length > 0 || allGoalsWithPosition.length > 0" class="goal-legend">
            <div class="legend-item">
              <div class="legend-indicator" style="background: rgba(76, 175, 80, 0.8); border: 2px solid rgba(76, 175, 80, 1);"></div>
              <span>Goals ({{ allGoalsWithPosition.length }})</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator" style="background: rgba(33, 150, 243, 0.7); border: 2px solid rgba(33, 150, 243, 1);"></div>
              <span>On Target ({{ allShotsWithPosition.filter(s => s.on_target).length }})</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator" style="background: rgba(239, 83, 80, 0.7); border: 2px solid rgba(239, 83, 80, 1);"></div>
              <span>Off Target ({{ allShotsWithPosition.filter(s => !s.on_target).length }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  allShotsData: {
    type: Array,
    required: true
  },
  allGoalsData: {
    type: Array,
    required: true
  }
})

const shotMapView = ref('goal')

const totalShotsWithQuadrant = computed(() => {
  return props.allShotsData.length + props.allGoalsData.length
})

const totalShotsOnTarget = computed(() => {
  return props.allShotsData.filter(shot => shot.on_target).length + props.allGoalsData.length
})

const totalShotsOffTarget = computed(() => {
  return props.allShotsData.filter(shot => !shot.on_target).length
})

const totalGoalsWithQuadrant = computed(() => {
  return props.allGoalsData.filter(goal => goal.quadrant).length
})

const shotAccuracy = computed(() => {
  const totalShots = props.allShotsData.length + props.allGoalsData.length
  if (totalShots === 0) return 0
  const shotsOnTarget = props.allShotsData.filter(shot => shot.on_target).length + props.allGoalsData.length
  return Math.round((shotsOnTarget / totalShots) * 100)
})

const allShotsWithPosition = computed(() => {
  return props.allShotsData.filter(shot => shot.field_position && shot.field_position.includes(','))
})

const allGoalsWithPosition = computed(() => {
  return props.allGoalsData.filter(goal => goal.field_position && goal.field_position.includes(','))
})

const getQuadrantShots = (quadrant) => {
  return props.allShotsData.filter(shot => shot.quadrant === quadrant).length
}

const getQuadrantGoals = (quadrant) => {
  return props.allGoalsData.filter(goal => goal.quadrant === quadrant).length
}

const getHeatMapClass = (quadrant) => {
  const shots = getQuadrantShots(quadrant)
  const goals = getQuadrantGoals(quadrant)
  const total = shots + goals
  
  if (total === 0) return 'heat-none'
}

const getHeatMapStyle = (quadrant) => {
  return {}
}

const getShotMarkerStyle = (item) => {
  if (!item.field_position || !item.field_position.includes(',')) return {}
  
  const [x, y] = item.field_position.split(',').map(Number)
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const getShotCoordinates = (item) => {
  if (!item.field_position || !item.field_position.includes(',')) return { x: 50, y: 50 }
  
  const [x, y] = item.field_position.split(',').map(Number)
  
  return { x, y }
}

const getGoalTargetX = (item) => {
  if (!item.quadrant) return 50
  
  const quadrant = item.quadrant
  const column = ((quadrant - 1) % 3) + 1
  
  if (column === 1) return 37
  if (column === 2) return 50
  if (column === 3) return 63
  
  return 50
}
</script>

<style scoped>
.shot-map-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-subtitle {
  margin: 5px 0 0;
  font-size: 0.85rem;
  color: #89938d;
}

.shot-map-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

/* Stats Row */
.shot-map-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.shot-stat-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.shot-stat-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
  border-color: rgba(76, 218, 156, 0.2);
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-icon-wrapper.shots { background: rgba(33, 150, 243, 0.15); color: #2196F3; }
.stat-icon-wrapper.goals { background: rgba(76, 218, 156, 0.15); color: #4cda9c; }
.stat-icon-wrapper.accuracy { background: rgba(255, 193, 7, 0.15); color: #FFC107; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.75rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.stat-breakdown {
  font-size: 0.65rem;
  color: #666;
  margin-top: 4px;
}

/* Content Area */
.shot-map-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  flex: 1;
}

/* Toggle */
.view-toggle {
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 12px;
  display: flex;
  gap: 4px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #89938d;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.toggle-btn:hover:not(.active) {
  color: #ccc;
}

/* Goal View */
.goal-view-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.shared-frame {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 4/3;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-radius: 4px;
}

.goal-frame {
  border: 8px solid #e0e0e0;
  border-bottom: none;
  background: rgba(20, 25, 30, 0.5);
  box-shadow: inset 0 0 50px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.3);
  border-radius: 4px 4px 0 0;
}

.goal-frame::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -8px;
  right: -8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.shot-heat-map {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
}

.heat-map-quadrant {
  border: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.quadrant-data {
  display: flex;
  gap: 8px;
  z-index: 2;
}

.quadrant-goals, .quadrant-shots {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.quadrant-goals {
  background: #4cda9c;
  color: #003822;
}

.quadrant-shots {
  background: #2196F3;
  color: #fff;
}

/* Field View */
.field-origin-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.field-heat-map-frame {
  background: #1a1d21; /* Dark gray background */
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.4);
}

/* Grass Pattern - Removed or made very subtle gray */
.field-pattern {
  display: none;
}

.field-markings-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5; /* Fainter lines */
}

/* Remove old marking styles */

.shot-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(33, 150, 243, 0.7); /* Less bright blue */
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(33, 150, 243, 0.3);
  border: 1px solid rgba(255,255,255,0.3);
  z-index: 5;
}

.shot-marker.off-target-shot {
  background: rgba(239, 83, 80, 0.7); /* Less bright red */
  box-shadow: 0 0 4px rgba(239, 83, 80, 0.3);
}

.goal-marker {
  position: absolute;
  width: 8px; /* Same size */
  height: 8px;
  background: rgba(76, 218, 156, 0.8); /* Less bright green */
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(76, 218, 156, 0.4);
  border: 1px solid rgba(255,255,255,0.5);
  z-index: 6;
}

.shot-trajectories {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.shot-trajectory-line {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.shot-trajectory-line.goal-trajectory {
  stroke: rgba(76, 218, 156, 0.5);
  stroke-width: 1.5;
}

.goal-target-marker {
  fill: rgba(255, 255, 255, 0.5);
}

.goal-target-marker.goal-target {
  fill: #4cda9c;
}

.no-data-message {
  padding: 40px;
  text-align: center;
  color: #89938d;
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.1);
}

/* Legend */
.goal-legend {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #ccc;
}

.legend-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-indicator.goal { background: #4cda9c; box-shadow: 0 0 5px rgba(76, 218, 156, 0.5); }
.legend-indicator.shot { background: rgba(33, 150, 243, 0.8); box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
.legend-indicator.empty { border: 1px solid #666; background: rgba(255,255,255,0.05); }

@media (max-width: 768px) {
  .shot-map-stats {
    grid-template-columns: 1fr;
  }
  
  .goal-frame {
    max-width: 100%;
  }
}
</style>
