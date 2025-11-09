<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ userEmail ? userEmail.split('@')[0] : 'player' }}!</p>
    </div>

    <div class="dashboard-container">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
        <button class="tab-btn" :class="{ active: activeTab === 'matches' }" @click="activeTab = 'matches'">Matches</button>
      </div>

      <div v-if="activeTab === 'overview'" class="dashboard-view">
        <!-- Main Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card card-glass">
            <div class="stat-icon">⚽</div>
            <div class="stat-content">
              <h3>{{ matches.length }}</h3>
              <p>Matches Played</p>
            </div>
          </div>
          <div class="stat-card card-glass">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>{{ wins }}</h3>
              <p>Wins</p>
            </div>
          </div>
          <div class="stat-card card-glass">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>{{ winRate }}%</h3>
              <p>Win Rate</p>
            </div>
          </div>
          <div class="stat-card card-glass">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <h3 :class="getStatColorClass('rating', averageRating)">{{ averageRating }}</h3>
              <p>Avg Rating</p>
            </div>
          </div>
        </div>

        <!-- EA FC Style Player Card -->
        <div class="player-card-section">
          <h3>Player Stats</h3>
          <div class="ea-fc-card card-glass">
            <div class="player-card-header">
              <div class="player-name">
                <h2>{{ userEmail ? userEmail.split('@')[0].toUpperCase() : 'PLAYER' }}</h2>
              </div>
              <div class="rating-stats-container">
                <div class="overall-rating-container">
                  <div class="overall-rating" :class="getStatColorClass('rating', overallRating)">
                    {{ overallRating }}
                  </div>
                  <span class="rating-label">OVR</span>
                </div>
                <div class="form-rating-container">
                  <div class="form-rating" :class="getStatColorClass('rating', formStat)">
                    {{ formStat }}
                  </div>
                  <span class="rating-label">FORM</span>
                </div>
              </div>
            </div>
            <div class="player-stats-grid">
              <div class="stat-item">
                <span class="stat-name">PAC</span>
                <span class="stat-value" :class="getStatColorClass('rating', paceStat)">{{ paceStat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-name">SHO</span>
                <span class="stat-value" :class="getStatColorClass('rating', shootingStat)">{{ shootingStat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-name">PAS</span>
                <span class="stat-value" :class="getStatColorClass('rating', passingStat)">{{ passingStat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-name">DRI</span>
                <span class="stat-value" :class="getStatColorClass('rating', dribblingStat)">{{ dribblingStat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-name">DEF</span>
                <span class="stat-value" :class="getStatColorClass('rating', defendingStat)">{{ defendingStat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-name">PHY</span>
                <span class="stat-value" :class="getStatColorClass('rating', physicalStat)">{{ physicalStat }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Overview -->
        <div class="performance-section">
          <h3>Performance Overview</h3>
          <div class="performance-grid">
            <div class="performance-card card-glass">
              <div class="performance-header">
                <h4>Goals & Assists</h4>
                <div class="performance-icon">🎯</div>
              </div>
              <div class="performance-stats">
                <div class="performance-stat">
                  <span class="stat-value">{{ totalGoals }}</span>
                  <span class="stat-label">Goals</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ totalAssists }}</span>
                  <span class="stat-label">Assists</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ (totalGoals + totalAssists) }}</span>
                  <span class="stat-label">G+A</span>
                </div>
              </div>
            </div>

            <div class="performance-card card-glass">
              <div class="performance-header">
                <h4>Passing</h4>
                <div class="performance-icon">⚡</div>
              </div>
              <div class="performance-stats">
                <div class="performance-stat">
                  <span class="stat-value">{{ totalSuccessfulPasses }}</span>
                  <span class="stat-label">Good</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ totalUnsuccessfulPasses }}</span>
                  <span class="stat-label">Bad</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ passAccuracy }}%</span>
                  <span class="stat-label">Accuracy</span>
                </div>
              </div>
            </div>

            <div class="performance-card card-glass">
              <div class="performance-header">
                <h4>Defense</h4>
                <div class="performance-icon">🛡️</div>
              </div>
              <div class="performance-stats">
                <div class="performance-stat">
                  <span class="stat-value">{{ totalTackles }}</span>
                  <span class="stat-label">Tackles</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ totalInterceptions }}</span>
                  <span class="stat-label">Interceptions</span>
                </div>
                <div class="performance-stat">
                  <span class="stat-value">{{ totalClearances }}</span>
                  <span class="stat-label">Clearances</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shot Map Section -->
        <div class="shot-map-section">
          <div class="section-header">
            <h3><span class="section-icon">🎯</span> Shot Map Analytics</h3>
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
              <!-- View Toggle -->
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

              <!-- Goal Placement View -->
              <div v-if="shotMapView === 'goal'" class="goal-view-wrapper">
                <div class="goal-frame">
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
              
              <!-- Shot Origin Field View -->
              <div v-if="shotMapView === 'field'" class="field-origin-wrapper">
                <div v-if="allShotsWithPosition.length === 0 && allGoalsWithPosition.length === 0" class="no-data-message">
                  <p>No shot positions recorded yet.</p>
                  <p style="font-size: 0.85rem; opacity: 0.7;">New shots/goals will appear here after you apply the database migration and record them with field positions.</p>
                </div>
                
                <div v-else class="field-heat-map-frame">
                  <div class="field-markings">
                    <div class="penalty-box attacking-box"></div>
                    <div class="penalty-arc attacking-arc"></div>
                    <div class="goal-outline"></div>
                  </div>
                  
                  <!-- SVG for shot trajectory lines and target markers -->
                  <svg class="shot-trajectories" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <!-- Shot trajectory lines (only for on-target shots) -->
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
                    
                    <!-- Target markers on goal line (only for on-target shots and goals) -->
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

        <!-- Recent Form Charts -->
        <div class="trends-section">
          <h3>Recent Form</h3>
          <div class="trends-grid">
            <div class="trend-card card-glass">
              <div class="trend-header">
                <h4>Match Ratings</h4>
                <div class="rating-stats">
                  <span :class="getStatColorClass('rating', recentAverageRating)" class="avg-rating">Avg: {{ recentAverageRating }}</span>
                  <span :class="getStatColorClass('rating', recentHighestRating)" class="highest-rating">Best: {{ recentHighestRating }}</span>
                </div>
              </div>
              <div class="chart-wrapper">
                <div class="chart-container">
                  <div v-for="(match, index) in recentMatches" :key="match.id" class="bar-container">
                    <div class="rating-value">{{ calculateMatchRating(match) }}</div>
                    <div class="rating-bar" :style="{ height: parseFloat(calculateMatchRating(match)) === 0 ? '0%' : Math.max((parseFloat(calculateMatchRating(match)) / 10) * 100, 15) + '%' }" :class="getStatColorClass('rating', calculateMatchRating(match))"></div>
                    <span class="match-label">{{ match.opponent.length > 6 ? match.opponent.substring(0, 6) + '...' : match.opponent }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="trend-card card-glass">
              <div class="trend-header">
                <h4>G/A</h4>
                <span class="avg-stat">Avg: {{ averageGoalsPerMatch }}</span>
              </div>
              <div class="chart-wrapper">
                <div class="chart-container">
                  <div v-for="(match, index) in recentMatches" :key="match.id" class="bar-container">
                    <div class="goals-value">{{ (match.my_goals || 0) + (match.assists || 0) }}</div>
                    <div class="goals-bar" :style="{ height: ((match.my_goals || 0) + (match.assists || 0)) === 0 ? '0%' : Math.max(((match.my_goals || 0) + (match.assists || 0)) / Math.max(maxGoalsInMatch, 1) * 100, 15) + '%' }"></div>
                    <span class="match-label">{{ match.opponent.length > 6 ? match.opponent.substring(0, 6) + '...' : match.opponent }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'matches'" class="matches-section">
        <div class="card-header">
          <h2>All Matches</h2>
          <div class="header-controls">
            <select v-model="sortBy" class="sort-dropdown">
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button class="btn btn-primary" @click="showAddMatch = true">Add Match</button>
          </div>
        </div>
        <div v-if="!activeMatch">
          <div v-if="matches.length > 0" class="matches-list">
            <div v-for="match in sortedMatches" :key="match.id" class="match-item card-glass" @click="selectMatch(match)">
              <div class="match-details">
                <div class="match-opponent">
                  <h4>{{ match.opponent }}</h4>
                  <p>{{ formatDate(match.match_date) }}</p>
                </div>
                <div class="match-score-result">
                  <p class="score">{{ match.score_for }} - {{ match.score_against }}</p>
                  <span :class="['match-result', getMatchResult(match).toLowerCase()]">{{ getMatchResult(match) }}</span>
                </div>
              </div>
              <div class="match-stats-summary">
                <div class="stat-item">
                  <span :class="getStatColorClass('goals', match.my_goals || 0)">{{ match.my_goals || 0 }}</span>
                  <label>Goals</label>
                </div>
                <div class="stat-item">
                  <span :class="getStatColorClass('assists', match.assists)">{{ match.assists }}</span>
                  <label>Assists</label>
                </div>
                <div class="stat-item">
                  <span :class="getStatColorClass('rating', calculateMatchRating(match))">{{ calculateMatchRating(match) }}</span>
                  <label>Rating</label>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="empty-state">No matches recorded yet. Add your first match!</p>
        </div>
        <div v-else class="live-match-view card-glass">
          <div class="match-header-redesign">
            <button @click="handleBackToMatches" class="back-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
              <span>Back to Matches</span>
            </button>
            
            <div class="match-card">
              <div class="match-card-content">
                <div class="match-info">
                  <h2 class="opponent-name">vs {{ activeMatch.opponent }}</h2>
                  <div class="match-date">{{ formatDate(activeMatch.match_date) }}</div>
                </div>
                
                <div class="score-display">
                  <div class="score-container">
                    <div class="team-score home">
                      <span class="team-label">You</span>
                      <span class="score-number">{{ activeMatch.score_for }}</span>
                    </div>
                    <div class="score-divider">:</div>
                    <div class="team-score away">
                      <span class="team-label">{{ activeMatch.opponent }}</span>
                      <span class="score-number">{{ activeMatch.score_against }}</span>
                    </div>
                  </div>
                  <div class="match-result">
                    <span class="result-badge" :class="getMatchResult(activeMatch).toLowerCase()">{{ getMatchResult(activeMatch) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          
          
          <div class="match-view-controls">
            <div class="position-controls">
              <div class="position-display">
                <label>Position Played:</label>
                <select v-model="activeMatch.position_played" @change="updatePosition" class="position-select">
                  <option v-for="position in positions" :key="position" :value="position">{{ position }}</option>
                </select>
              </div>
              <div class="goalkeeper-toggle">
                <label for="gk-mode">Goalkeeper Mode</label>
                <label class="switch">
                  <input type="checkbox" id="gk-mode" v-model="isGoalkeeperMode">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="live-view-content single-column">
            <div class="live-stats-panel">
              <h4>Performance</h4>
              <div class="rating-display">
                <span :class="getStatColorClass('rating', calculateMatchRating(activeMatch))">{{ calculateMatchRating(activeMatch) }}</span>
                <label>Match Rating</label>
              </div>
            </div>

            <div class="shot-log-panel">
              <h4>Goals & Shots</h4>
              <div class="event-list">
                <div v-for="item in combinedEvents" :key="item.id" class="event-item" @click="selectEventForViz(item)">
                  <div class="event-time-and-icon">
                    <span class="event-icon">{{ item.type === 'Goal' ? '⚽' : '🎯' }}</span>
                  </div>
                  <div class="event-details">
                    <span class="event-type">
                      {{ item.details }}
                      <span v-if="item.count > 1" class="event-count">({{ item.count }}x)</span>
                    </span>
                    <span v-if="item.type === 'Goal'" class="event-subtype">({{ item.goal_type }})</span>
                  </div>
                  <div v-if="item.quadrant" class="event-quadrant-indicator">🎯</div>
                  <button @click.stop="removeEventGroup(item)" class="remove-event-btn">&times;</button>
                </div>
              </div>
              <div v-if="selectedEvent" class="shot-visualization">
                <h5>Shot Placement</h5>
                <div class="goal-grid-container viz-grid">
                  <div class="goal-grid">
                    <div v-for="i in 9" :key="i" class="goal-quadrant" :class="{ 'highlight': selectedEvent.quadrant === i }">
                      <span v-if="selectedEvent.quadrant === i">X</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="live-controls-panel">
              <h4>Match Events</h4>
              <div v-if="isGoalkeeperMode && goalkeeperStats" class="live-match-controls gk-controls">
                <div class="stat-control-group">
                  <span class="stat-label">Saves</span>
                  <div class="button-group">
                    <button @click="incrementGkStat('saves', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ goalkeeperStats.saves || 0 }}</span>
                    <button @click="incrementGkStat('saves', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Catches</span>
                  <div class="button-group">
                    <button @click="incrementGkStat('catches', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ goalkeeperStats.catches || 0 }}</span>
                    <button @click="incrementGkStat('catches', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Punches</span>
                  <div class="button-group">
                    <button @click="incrementGkStat('punches', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ goalkeeperStats.punches || 0 }}</span>
                    <button @click="incrementGkStat('punches', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Penalties Saved</span>
                  <div class="button-group">
                    <button @click="incrementGkStat('penalties_saved', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ goalkeeperStats.penalties_saved || 0 }}</span>
                    <button @click="incrementGkStat('penalties_saved', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Goal</span>
                  <div class="button-group">
                    <span class="stat-value-display">{{ myGoalsForMatch }}</span>
                    <button @click="handleMyGoal(1)" class="btn btn-success">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Assist</span>
                  <div class="button-group">
                    <button @click="incrementStat('assists', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.assists || 0 }}</span>
                    <button @click="incrementStat('assists', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Good Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('successful_passes', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.successful_passes || 0 }}</span>
                    <button @click="incrementStat('successful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Bad Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('unsuccessful_passes', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.unsuccessful_passes || 0 }}</span>
                    <button @click="incrementStat('unsuccessful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
              </div>
              <div v-else class="live-match-controls">
                <div class="stat-control-group">
                  <span class="stat-label">My Goal</span>
                  <div class="button-group">
                    <span class="stat-value-display">{{ myGoalsForMatch }}</span>
                    <button @click="handleMyGoal(1)" class="btn btn-success">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">My Assist</span>
                  <div class="button-group">
                    <button @click="incrementStat('assists', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.assists || 0 }}</span>
                    <button @click="incrementStat('assists', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Shot</span>
                  <div class="button-group">
                    <span class="stat-value-display">{{ shotsOnTarget + shotsOffTarget }}</span>
                    <button @click="handleShot()" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Tackle</span>
                  <div class="button-group">
                    <button @click="incrementStat('tackles', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.tackles || 0 }}</span>
                    <button @click="incrementStat('tackles', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Interception</span>
                  <div class="button-group">
                    <button @click="incrementStat('interceptions', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.interceptions || 0 }}</span>
                    <button @click="incrementStat('interceptions', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Clearance</span>
                  <div class="button-group">
                    <button @click="incrementStat('clearances', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.clearances || 0 }}</span>
                    <button @click="incrementStat('clearances', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Dribble</span>
                  <div class="button-group">
                    <button @click="incrementStat('dribbles', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.dribbles || 0 }}</span>
                    <button @click="incrementStat('dribbles', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Chance Created</span>
                  <div class="button-group">
                    <button @click="incrementStat('created_chances', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.created_chances || 0 }}</span>
                    <button @click="incrementStat('created_chances', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Possession Lost</span>
                  <div class="button-group">
                    <button @click="incrementStat('lost_possessions', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.lost_possessions || 0 }}</span>
                    <button @click="incrementStat('lost_possessions', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Good Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('successful_passes', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.successful_passes || 0 }}</span>
                    <button @click="incrementStat('successful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Bad Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('unsuccessful_passes', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.unsuccessful_passes || 0 }}</span>
                    <button @click="incrementStat('unsuccessful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Foul</span>
                  <div class="button-group">
                    <button @click="incrementStat('fouls', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.fouls || 0 }}</span>
                    <button @click="incrementStat('fouls', 1)" class="btn">+</button>
                  </div>
                </div>
              </div>
              <h4>Disciplinary</h4>
              <div class="live-match-controls card-controls">
                <div class="stat-control-group">
                  <span class="stat-label">Yellow Card</span>
                  <div class="button-group">
                    <button @click="incrementStat('yellow_card', -1)" class="btn btn-secondary card-btn-remove">-</button>
                    <span class="stat-value-display">{{ activeMatch.yellow_card || 0 }}</span>
                    <button @click="incrementStat('yellow_card', 1)" class="btn btn-warning card-btn"></button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Red Card</span>
                  <div class="button-group">
                    <button @click="incrementStat('red_card', -1)" class="btn btn-secondary card-btn-remove">-</button>
                    <span class="stat-value-display">{{ activeMatch.red_card || 0 }}</span>
                    <button @click="incrementStat('red_card', 1)" class="btn btn-danger card-btn"></button>
                  </div>
                </div>
              </div>
              <h4>Score Events</h4>
              <div class="live-match-controls">
                <div class="stat-control-group">
                  <span class="stat-label">Our Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('score_for', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.score_for || 0 }}</span>
                    <button @click="incrementStat('score_for', 1)" class="btn btn-primary">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Their Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('score_against', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.score_against || 0 }}</span>
                    <button @click="incrementStat('score_against', 1)" class="btn btn-danger">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Own Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('own_goals', -1)" class="btn btn-danger">-</button>
                    <span class="stat-value-display">{{ activeMatch.own_goals || 0 }}</span>
                    <button @click="incrementStat('own_goals', 1)" class="btn btn-danger">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="match-actions">
            <button @click="showEditMatch = true" class="action-btn edit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9l-3-3L2.5 11.707V14.5a.5.5 0 0 0 .5.5h2.793L11.207 9zM1 11.5a.5.5 0 0 1 .5-.5H2v-.5a.5.5 0 0 1 .5-.5H3v-.5a.5.5 0 0 1 .5-.5h.5V9a.5.5 0 0 1 .5-.5h1V8a.5.5 0 0 1 .5-.5h1V7a.5.5 0 0 1 .5-.5h1V6a.5.5 0 0 1 .5-.5h1V5a.5.5 0 0 1 .5-.5h1V4a.5.5 0 0 1 .5-.5h1V3a.5.5 0 0 1 .5-.5h1V2a.5.5 0 0 1 .5-.5h1V1a.5.5 0 0 1 .5-.5H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-.5.5H9a.5.5 0 0 1-.5-.5v-1H8a.5.5 0 0 1-.5-.5v-1H7a.5.5 0 0 1-.5-.5v-1H6a.5.5 0 0 1-.5-.5v-1H5a.5.5 0 0 1-.5-.5v-1H4a.5.5 0 0 1-.5-.5v-1H3a.5.5 0 0 1-.5-.5v-1H2a.5.5 0 0 1-.5-.5v-1H1.5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Edit Match
            </button>
            <button @click="confirmDeleteMatch" class="action-btn delete-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Delete Match
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Shot Type Modal -->
    <div v-if="showShotModal" class="modal-overlay" @click.self="showShotModal = false">
      <div class="modal card-glass" @click.stop>
        <div class="modal-header">
          <h3>Shot Outcome</h3>
          <button @click="showShotModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-options-grid shot-options">
            <button @click="handleShotOnTarget()" class="modal-option-btn btn-success">
              <span class="option-icon">🎯</span>
              <span>On Target</span>
            </button>
            <button @click="saveShot(false, null)" class="modal-option-btn btn-danger">
              <span class="option-icon">❌</span>
              <span>Off Target</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Type Modal -->
    <div v-if="showGoalModal" class="modal-overlay" @click.self="showGoalModal = false">
      <div class="modal card-glass" @click.stop>
        <div class="modal-header">
          <h3>Goal Type</h3>
          <button @click="showGoalModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-options-grid">
            <button v-for="type in goalTypes" :key="type" @click="addGoal(type)" class="modal-option-btn">
              <span>{{ type }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Quadrant Modal -->
    <div v-if="showQuadrantModal" class="modal-overlay" @click.self="showQuadrantModal = false">
      <div class="modal card-glass" @click.stop>
        <div class="modal-header">
          <h3>Select Shot Placement</h3>
          <button @click="showQuadrantModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="goal-grid-container">
            <div class="goal-grid">
              <div v-for="i in 9" :key="i" @click="handleQuadrantSelect(i)" class="goal-quadrant">
                {{ i }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Field Position Modal -->
    <div v-if="showFieldPositionModal" class="modal-overlay" @click.self="showFieldPositionModal = false">
      <div class="modal card-glass field-modal" @click.stop>
        <div class="modal-header">
          <h3>Select Shot Origin</h3>
          <button @click="showFieldPositionModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-instruction">Click where the {{ fieldPositionContext === 'goal' ? 'goal' : 'shot' }} was taken from</p>
          <div class="field-grid-container" @click="handleFieldClick">
            <div class="field-markings">
              <div class="penalty-box attacking-box"></div>
              <div class="penalty-arc attacking-arc"></div>
              <div class="goal-outline"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Match Modal -->
    <div v-if="showAddMatch" class="modal-overlay" @click.self="showAddMatch = false">
      <div class="modal card-glass" @click.stop>
        <h3>Add New Match</h3>
        <form @submit.prevent="addMatch">
          <div class="form-group">
            <label>Opponent</label>
            <input v-model="newMatch.opponent" type="text" required />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="newMatch.match_date" type="date" required />
          </div>
          <div class="form-group">
            <label>Position Played</label>
            <select v-model="newMatch.position_played" required>
              <option disabled value="">Please select one</option>
              <option v-for="position in positions" :key="position" :value="position">{{ position }}</option>
            </select>
          </div>
          <div class="modal-buttons">
            <button type="button" @click="showAddMatch = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Match</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Match Modal -->
    <div v-if="showEditMatch" class="modal-overlay" @click.self="showEditMatch = false">
      <div class="modal card-glass" @click.stop>
        <div class="modal-header">
          <h3>Edit Match</h3>
          <button @click="showEditMatch = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Opponent</label>
            <input v-model="activeMatch.opponent" type="text" required />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="activeMatch.match_date" type="date" required />
          </div>
          <div class="modal-buttons">
            <button type="button" @click="showEditMatch = false" class="btn btn-secondary">Cancel</button>
            <button type="button" @click="updateMatch" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal card-glass" @click.stop>
        <div class="modal-header">
          <h3>Delete Match</h3>
          <button @click="showDeleteConfirm = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this match against <strong>{{ activeMatch.opponent }}</strong>?</p>
          <p class="warning-text">This action cannot be undone and will delete all match data including goals, shots, and statistics.</p>
          <div class="modal-buttons">
            <button type="button" @click="showDeleteConfirm = false" class="btn btn-secondary">Cancel</button>
            <button type="button" @click="deleteMatch" class="btn btn-danger">Delete Match</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const matches = ref([])
    const userEmail = ref('')
    const showAddMatch = ref(false)
    const activeTab = ref('overview')
    const activeMatch = ref(null)
    const matchGoals = ref([])
    const matchShots = ref([])
    const showGoalModal = ref(false)
    const showShotModal = ref(false)
    const showQuadrantModal = ref(false)
    const showFieldPositionModal = ref(false)
    const shotMapView = ref('goal') // 'goal' or 'field'
    const selectedEvent = ref(null)
    const quadrantSelectionContext = ref('shot') // 'shot' or 'goal'
    const quadrantForGoal = ref(null)
    const pendingShotFieldPosition = ref(null)
    const pendingGoalFieldPosition = ref(null)
    const fieldPositionContext = ref('shot') // 'shot' or 'goal'
    const showEditMatch = ref(false)
    const showDeleteConfirm = ref(false)
    const goalTypes = ref(['Normal', 'Freekick', 'Penalty', 'Long Shot', 'Header', 'Tap-in'])
    const positions = ref([
      'Goalkeeper',
      'Center-Back',
      'Full-Back',
      'Wing-Back',
      'Defensive Midfielder',
      'Central Midfielder',
      'Attacking Midfielder',
      'Winger',
      'Striker',
      'Center-Forward'
    ]);
    const isGoalkeeperMode = ref(false);
    const goalkeeperStats = ref(null);
    const allShotsData = ref([]);
    const allGoalsData = ref([]);
    const sortBy = ref('date'); // 'date' or 'rating'

    const newMatch = ref({
      opponent: '',
      match_date: new Date().toISOString().split('T')[0],
      position_played: ''
    })

    const goalSummary = computed(() => {
      return matchGoals.value.reduce((acc, goal) => {
        acc[goal.goal_type] = (acc[goal.goal_type] || 0) + 1
        return acc
      }, {})
    })

    const shotsOnTarget = computed(() => {
      if (!activeMatch.value) return 0;
      return matchShots.value.filter(s => s.on_target).length;
    });
    const shotsOffTarget = computed(() => {
      if (!activeMatch.value) return 0;
      return matchShots.value.filter(s => !s.on_target).length;
    });

    const combinedEvents = computed(() => {
      const goals = matchGoals.value.map(g => ({ ...g, type: 'Goal', details: 'Goal Scored', event_time: g.created_at }));
      const shots = matchShots.value.map(s => ({ ...s, type: 'Shot', details: s.on_target ? 'On Target' : 'Off Target', event_time: s.created_at }));
      
      // Only group off-target shots, keep goals and on-target shots separate
      const eventGroups = {};
      const ungroupedEvents = [];
      
      [...goals, ...shots].forEach(event => {
        // Only group off-target shots
        if (event.type === 'Shot' && event.details === 'Off Target') {
          const key = `${event.type}-${event.details}`;
          if (!eventGroups[key]) {
            eventGroups[key] = {
              ...event,
              count: 1,
              events: [event]
            };
          } else {
            eventGroups[key].count++;
            eventGroups[key].events.push(event);
            // Keep the most recent event time
            if (new Date(event.event_time) > new Date(eventGroups[key].event_time)) {
              eventGroups[key].event_time = event.event_time;
            }
          }
        } else {
          // Keep goals and on-target shots as individual events
          ungroupedEvents.push({
            ...event,
            count: 1,
            events: [event]
          });
        }
      });
      
      return [...ungroupedEvents, ...Object.values(eventGroups)].sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
    });


    const wins = computed(() => {
      return matches.value.filter(match => match.score_for > match.score_against).length
    })

    const winRate = computed(() => {
      if (matches.value.length === 0) return 0
      return Math.round((wins.value / matches.value.length) * 100)
    })

    const averageRating = computed(() => {
      if (matches.value.length === 0) return '0.0'
      const totalRating = matches.value.reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
      return (totalRating / matches.value.length).toFixed(2)
    })

    const highestRating = computed(() => {
      if (matches.value.length === 0) return '0.0'
      const ratings = matches.value.map(match => parseFloat(calculateMatchRating(match)))
      return Math.max(...ratings).toFixed(2)
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

    const loadGoalkeeperStats = async (matchId) => {
      const { data, error } = await supabase
        .from('goalkeeper_match_stats')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (data) {
        goalkeeperStats.value = data;
      } else {
        goalkeeperStats.value = {
          match_id: matchId,
          user_id: activeMatch.value.user_id,
          saves: 0,
          catches: 0,
          punches: 0,
          goals_conceded: 0,
          penalties_saved: 0,
        };
      }
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading goalkeeper stats:', error);
      }
    };

    const incrementGkStat = async (stat, value) => {
      if (!goalkeeperStats.value) return;
      goalkeeperStats.value[stat] = Math.max(0, goalkeeperStats.value[stat] + value);
      
      // Only update the specific fields that exist in the goalkeeper_match_stats table
      const updateData = {
        match_id: goalkeeperStats.value.match_id,
        user_id: goalkeeperStats.value.user_id,
        saves: goalkeeperStats.value.saves || 0,
        catches: goalkeeperStats.value.catches || 0,
        punches: goalkeeperStats.value.punches || 0,
        goals_conceded: goalkeeperStats.value.goals_conceded || 0,
        penalties_saved: goalkeeperStats.value.penalties_saved || 0,
      };
      
      const { error } = await supabase
        .from('goalkeeper_match_stats')
        .upsert(updateData, { onConflict: 'match_id, user_id' });

      if (error) {
        console.error(`Error updating ${stat}:`, error);
        // Revert on error
        goalkeeperStats.value[stat] = Math.max(0, goalkeeperStats.value[stat] - value);
      }
    };

    // Calculate my goals dynamically from goals table
    const myGoalsForMatch = computed(() => {
      if (!activeMatch.value) return 0;
      return matchGoals.value.length;
    });

    const totalGoals = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.my_goals || 0), 0)
    })

    const totalAssists = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.assists || 0), 0)
    })

    const totalSuccessfulPasses = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.successful_passes || 0), 0)
    })

    const totalUnsuccessfulPasses = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.unsuccessful_passes || 0), 0)
    })

    const passAccuracy = computed(() => {
      const total = totalSuccessfulPasses.value + totalUnsuccessfulPasses.value
      if (total === 0) return 0
      return Math.round((totalSuccessfulPasses.value / total) * 100)
    })

    const totalTackles = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.tackles || 0), 0)
    })

    const totalInterceptions = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.interceptions || 0), 0)
    })

    const totalClearances = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.clearances || 0), 0)
    })

    const totalFouls = computed(() => {
      return matches.value.reduce((sum, match) => sum + (match.fouls || 0), 0)
    })

    const recentMatches = computed(() => {
      return matches.value.slice(0, 10).reverse()
    })

    const sortedMatches = computed(() => {
      const sorted = [...matches.value];
      if (sortBy.value === 'rating') {
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(calculateMatchRating(a));
          const ratingB = parseFloat(calculateMatchRating(b));
          return ratingB - ratingA; // Highest rating first
        });
      }
      // Default: sort by date (already sorted from query)
      return sorted;
    })

    const averageGoalsPerMatch = computed(() => {
      if (matches.value.length === 0) return '0.0'
      return ((totalGoals.value + totalAssists.value) / matches.value.length).toFixed(1)
    })

    const maxGoalsInMatch = computed(() => {
      if (matches.value.length === 0) return 1
      return Math.max(...matches.value.map(match => (match.my_goals || 0) + (match.assists || 0)), 1)
    })

    // Shot Map Computed Properties
    const totalShotsWithQuadrant = computed(() => {
      // Include ALL shots (on target + off target) and goals
      return allShotsData.value.length + allGoalsData.value.length
    })

    const totalShotsOnTarget = computed(() => {
      // Shots on target + goals (goals are always on target)
      return allShotsData.value.filter(shot => shot.on_target).length + allGoalsData.value.length
    })

    const totalShotsOffTarget = computed(() => {
      // Only off-target shots
      return allShotsData.value.filter(shot => !shot.on_target).length
    })

    const totalGoalsWithQuadrant = computed(() => {
      return allGoalsData.value.filter(goal => goal.quadrant).length
    })

    const shotAccuracy = computed(() => {
      // Total shots includes all shots + goals
      const totalShots = allShotsData.value.length + allGoalsData.value.length
      if (totalShots === 0) return 0
      // Shots on target includes on-target shots + goals (since goals are always on target)
      const shotsOnTarget = allShotsData.value.filter(shot => shot.on_target).length + allGoalsData.value.length
      return Math.round((shotsOnTarget / totalShots) * 100)
    })

    const getQuadrantShots = (quadrant) => {
      // Return all shots in this quadrant (both on and off target)
      return allShotsData.value.filter(shot => shot.quadrant === quadrant).length
    }

    const getQuadrantGoals = (quadrant) => {
      return allGoalsData.value.filter(goal => goal.quadrant === quadrant).length
    }

    const getHeatMapClass = (quadrant) => {
      const shots = getQuadrantShots(quadrant)
      const goals = getQuadrantGoals(quadrant)
      const total = shots + goals
      
      if (total === 0) return 'heat-none'
      if (total >= 5) return 'heat-high'
      if (total >= 3) return 'heat-medium'
      return 'heat-low'
    }

    const getHeatMapStyle = (quadrant) => {
      const goals = getQuadrantGoals(quadrant)
      const shots = getQuadrantShots(quadrant)
      const maxCount = Math.max(
        ...Array.from({length: 9}, (_, i) => getQuadrantShots(i + 1) + getQuadrantGoals(i + 1))
      )
      
      if (maxCount === 0) return {}
      
      const total = goals + shots
      const intensity = Math.min(1, total / Math.max(maxCount, 1))
      
      // Create a gradient from blue (shots) to green (goals)
      if (goals > shots) {
        const opacity = 0.3 + (intensity * 0.5)
        return {
          backgroundColor: `rgba(76, 175, 80, ${opacity})`
        }
      } else if (shots > 0) {
        const opacity = 0.2 + (intensity * 0.4)
        return {
          backgroundColor: `rgba(33, 150, 243, ${opacity})`
        }
      }
      
      return {}
    }

    // Field Zone Heat Map Functions
    const allShotsWithPosition = computed(() => {
      return allShotsData.value.filter(shot => shot.field_position && shot.field_position.includes(','))
    })

    const allGoalsWithPosition = computed(() => {
      return allGoalsData.value.filter(goal => goal.field_position && goal.field_position.includes(','))
    })

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
      // If no quadrant, default to center
      if (!item.quadrant) return 50
      
      // Quadrant layout (goal view):
      // 1  2  3
      // 4  5  6
      // 7  8  9
      
      const quadrant = item.quadrant
      const column = ((quadrant - 1) % 3) + 1 // 1, 2, or 3
      
      // Map columns to goal positions (goal is 40% wide, centered at 50%)
      // Goal spans from 30% to 70%
      if (column === 1) return 37  // Left post area
      if (column === 2) return 50  // Center
      if (column === 3) return 63  // Right post area
      
      return 50 // Default to center
    }

    const getFieldZoneCount = (zone) => {
      const shotsInZone = allShotsData.value.filter(shot => shot.field_position === zone).length
      const goalsInZone = allGoalsData.value.filter(goal => goal.field_position === zone).length
      return shotsInZone + goalsInZone
    }

    const getFieldHeatStyle = (zone) => {
      const count = getFieldZoneCount(zone)
      const maxCount = Math.max(
        ...Array.from({length: 9}, (_, i) => getFieldZoneCount(i + 1))
      )
      
      if (maxCount === 0 || count === 0) return {
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }
      
      const intensity = count / maxCount
      const opacity = 0.2 + (intensity * 0.6)
      
      return {
        backgroundColor: `rgba(33, 150, 243, ${opacity})`,
        borderColor: `rgba(33, 150, 243, ${Math.min(opacity + 0.2, 1)})`
      }
    }

    // EA FC Style Stats
    const overallRating = computed(() => {
      if (matches.value.length === 0) return 65
      const avgStats = (shootingStat.value + passingStat.value + defendingStat.value + dribblingStat.value + paceStat.value + physicalStat.value) / 6
      return Math.min(99, Math.max(30, Math.round(avgStats)))
    })

    const shootingStat = computed(() => {
      if (matches.value.length === 0) return 65
      const avgGoals = totalGoals.value / matches.value.length
      const avgShotsOnTarget = matches.value.reduce((sum, match) => {
        // Calculate shots on target from match data if available
        return sum + (match.shots_on_target || 0)
      }, 0) / matches.value.length
      
      let rating = 50 + (avgGoals * 15) + (avgShotsOnTarget * 5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const passingStat = computed(() => {
      if (matches.value.length === 0) return 65
      const accuracy = passAccuracy.value
      const avgPasses = (totalSuccessfulPasses.value + totalUnsuccessfulPasses.value) / matches.value.length
      
      let rating = 40 + (accuracy * 0.4) + (avgPasses * 0.5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const defendingStat = computed(() => {
      if (matches.value.length === 0) return 65
      const avgTackles = totalTackles.value / matches.value.length
      const avgInterceptions = totalInterceptions.value / matches.value.length
      const avgClearances = totalClearances.value / matches.value.length
      
      let rating = 45 + (avgTackles * 8) + (avgInterceptions * 6) + (avgClearances * 4)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const dribblingStat = computed(() => {
      if (matches.value.length === 0) return 65
      const avgDribbles = matches.value.reduce((sum, match) => sum + (match.dribbles || 0), 0) / matches.value.length
      const avgGoals = totalGoals.value / matches.value.length
      
      let rating = 50 + (avgDribbles * 6) + (avgGoals * 5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const paceStat = computed(() => {
      if (matches.value.length === 0) return 70
      // Base pace on overall performance and assists (indicating quick play)
      const avgAssists = totalAssists.value / matches.value.length
      const winRateBonus = winRate.value * 0.2
      
      let rating = 60 + (avgAssists * 8) + winRateBonus
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const physicalStat = computed(() => {
      if (matches.value.length === 0) return 65
      const avgFouls = totalFouls.value / matches.value.length
      const avgTackles = totalTackles.value / matches.value.length
      const matchesPlayed = matches.value.length
      
      // Higher fouls might indicate physicality, but too many is bad
      let rating = 55 + (avgTackles * 6) + (avgFouls * 2) + (matchesPlayed * 0.5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const formStat = computed(() => {
      if (matches.value.length === 0) return 65
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

    onMounted(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      userEmail.value = user.email
      await loadData()
    })

    // Watch for tab changes and reload data to get latest shots/goals
    watch(activeTab, async (newTab, oldTab) => {
      // Reload data whenever switching tabs
      if (oldTab && newTab !== oldTab) {
        await loadData()
      }
    })

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', user.id)
          .order('match_date', { ascending: false });

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          return;
        }

        const matchIds = matchesData.map(m => m.id);
        if (matchIds.length === 0) {
          matches.value = [];
          return;
        }

        // Load goals data to calculate my_goals for each match
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('match_id, quadrant, field_position')
          .in('match_id', matchIds);

        if (goalsError) {
          console.error('Error fetching goals for matches:', goalsError);
        }

        // Load shots data
        const { data: shotsData, error: shotsError } = await supabase
          .from('shots')
          .select('match_id, on_target, quadrant, field_position')
          .in('match_id', matchIds);
        
        // Store all shots and goals for shot map
        allShotsData.value = shotsData || [];
        allGoalsData.value = goalsData || [];

        if (shotsError) {
          console.error('Error fetching shots for matches:', shotsError);
          matches.value = matchesData; // Fallback
          return;
        }

        // Load goalkeeper stats for goalkeeper matches
        const goalkeeperMatchIds = matchesData
          .filter(m => m.position_played && m.position_played.toLowerCase().includes('goalkeeper'))
          .map(m => m.id);
        
        let goalkeeperStatsByMatch = {};
        if (goalkeeperMatchIds.length > 0) {
          const { data: goalkeeperData, error: goalkeeperError } = await supabase
            .from('goalkeeper_match_stats')
            .select('*')
            .in('match_id', goalkeeperMatchIds);

          if (!goalkeeperError && goalkeeperData) {
            goalkeeperStatsByMatch = goalkeeperData.reduce((acc, stats) => {
              acc[stats.match_id] = stats;
              return acc;
            }, {});
          }
        }

        const statsByMatch = shotsData.reduce((acc, shot) => {
          if (!acc[shot.match_id]) {
            acc[shot.match_id] = { shots_on_target: 0, shots_off_target: 0 };
          }
          if (shot.on_target) {
            acc[shot.match_id].shots_on_target++;
          } else {
            acc[shot.match_id].shots_off_target++;
          }
          return acc;
        }, {});

        // Calculate my_goals for each match from goals table
        const goalsByMatch = (goalsData || []).reduce((acc, goal) => {
          acc[goal.match_id] = (acc[goal.match_id] || 0) + 1;
          return acc;
        }, {});

        matches.value = matchesData.map(match => ({
          ...match,
          my_goals: goalsByMatch[match.id] || 0,
          shots_on_target: statsByMatch[match.id]?.shots_on_target || 0,
          shots_off_target: statsByMatch[match.id]?.shots_off_target || 0,
          goalkeeper_stats: goalkeeperStatsByMatch[match.id] || null,
        }));
      } catch (error) {
        console.error('Error in loadData:', error);
      }
    };

    const addMatch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const matchData = {
          ...newMatch.value,
          user_id: user.id,
          score_for: 0,
          score_against: 0,
          assists: 0,
          tackles: 0,
          interceptions: 0,
          clearances: 0,
          dribbles: 0,
          fouls: 0,
          successful_passes: 0,
          unsuccessful_passes: 0,
          own_goals: 0,
          created_chances: 0,
          lost_possessions: 0,
          yellow_card: 0,
          red_card: 0
        }

        const { data, error } = await supabase
          .from('matches')
          .insert([matchData])
          .select()

        if (error) throw error

        matches.value.unshift(data[0])
        newMatch.value = {
          opponent: '',
          match_date: new Date().toISOString().split('T')[0]
        }
        showAddMatch.value = false
      } catch (error) {
        console.error('Error adding match:', error)
        alert('Error adding match. Make sure your Supabase tables are set up correctly.')
      }
    }

    const selectMatch = async (match) => {
      if (activeMatch.value) return; // Prevent re-triggering when a match is active
      // Fetch the full, up-to-date match object to ensure all stats are loaded
      const { data: fullMatch, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', match.id)
        .single();

      if (matchError) {
        console.error('Error fetching full match data:', matchError);
        activeMatch.value = match; // Fallback to the list view's match object
      } else {
        activeMatch.value = fullMatch;
      }

      // Fetch related goals for the match
      const { data: goals, error: goalsError } = await supabase.from('goals').select('*').eq('match_id', match.id);
      if (goalsError) console.error('Error fetching goals:', goalsError); else matchGoals.value = goals;

      // Fetch related shots for the match
      const { data: shots, error: shotsError } = await supabase.from('shots').select('*').eq('match_id', match.id);
      if (shotsError) console.error('Error fetching shots:', shotsError); else matchShots.value = shots;

      // Check if the player was a goalkeeper in this match
      if (activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')) {
        isGoalkeeperMode.value = true;
        await loadGoalkeeperStats(match.id);
      } else {
        isGoalkeeperMode.value = false;
        goalkeeperStats.value = null;
      }
    };

    const loadMatchDetails = async (matchId) => {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('match_id', matchId)
      if (goalsError) console.error('Error loading goals:', goalsError)
      else matchGoals.value = goals

      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('*')
        .eq('match_id', matchId)
      if (shotsError) console.error('Error loading shots:', shotsError)
      else matchShots.value = shots
    }


    const handleMyGoal = async (value) => {
      if (!activeMatch.value) return;
      await incrementStat('score_for', value);
      fieldPositionContext.value = 'goal';
      showFieldPositionModal.value = true;
    }

    const addGoal = async (type) => {
      const quadrant = quadrantForGoal.value;
      if (!activeMatch.value) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Increment team score
      await incrementStat('score_for', 1)

      // 2. Add to goals table
      const { data, error } = await supabase.from('goals').insert([
        { user_id: user.id, match_id: activeMatch.value.id, goal_type: type, quadrant: quadrant, field_position: pendingGoalFieldPosition.value }
      ]).select()

      if (error) {
        console.error('Error adding goal:', error)
        // Revert team score if goal insert fails
        await incrementStat('score_for', -1)
      } else {
        matchGoals.value.push(data[0])
      }
      showGoalModal.value = false
      quadrantForGoal.value = null;
      pendingGoalFieldPosition.value = null;
    }

    const handleShot = () => {
      fieldPositionContext.value = 'shot';
      showFieldPositionModal.value = true;
    };

    const selectEventForViz = (event) => {
      // If the same event is already selected, close it (click-to-close functionality)
      if (selectedEvent.value && selectedEvent.value.id === event.id) {
        selectedEvent.value = null;
        return;
      }
      
      if ((event.type === 'Shot' && event.on_target && event.quadrant) || (event.type === 'Goal' && event.quadrant)) {
        selectedEvent.value = event;
      } else {
        selectedEvent.value = null;
      }
    };

    const handleQuadrantSelect = (quadrant) => {
      showQuadrantModal.value = false;
      if (quadrantSelectionContext.value === 'shot') {
        saveShot(true, quadrant);
      } else if (quadrantSelectionContext.value === 'goal') {
        quadrantForGoal.value = quadrant;
        showGoalModal.value = true;
      }
    };

    const removeEvent = async (event) => {
      if (!activeMatch.value) return;

      // If the event being removed is the one being visualized, close the viz
      if (selectedEvent.value && selectedEvent.value.id === event.id) {
        selectedEvent.value = null;
      }

      if (event.type === 'Shot') {
        const { error } = await supabase.from('shots').delete().eq('id', event.id);
        if (error) {
          console.error('Error removing shot:', error);
        } else {
          matchShots.value = matchShots.value.filter(s => s.id !== event.id);
        }
      } else if (event.type === 'Goal') {
        const { error } = await supabase.from('goals').delete().eq('id', event.id);
        if (error) {
          console.error('Error removing goal:', error);
        } else {
          // Decrement team score
          await incrementStat('score_for', -1);
          matchGoals.value = matchGoals.value.filter(g => g.id !== event.id);
        }
      }
    };

    const removeEventGroup = async (eventGroup) => {
      if (!activeMatch.value || !eventGroup.events || eventGroup.events.length === 0) return;

      let eventToRemove;

      if (eventGroup.count > 1) {
        // For groups, find the most recent event to remove
        eventToRemove = eventGroup.events.reduce((latest, current) => {
          return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
        });
      } else {
        // For single-item groups, remove the only event
        eventToRemove = eventGroup.events[0];
      }

      // If the event being removed is the one being visualized, close the viz
      if (selectedEvent.value && selectedEvent.value.id === eventToRemove.id) {
        selectedEvent.value = null;
      }

      // Call the single event removal function
      await removeEvent(eventToRemove);
    };

    const handleShotOnTarget = () => {
      showShotModal.value = false;
      quadrantSelectionContext.value = 'shot';
      showQuadrantModal.value = true;
    }

    const handleFieldClick = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width * 100).toFixed(2);
      const y = ((event.clientY - rect.top) / rect.height * 100).toFixed(2);
      
      // Store position as "x,y" string (e.g., "45.23,67.89")
      const position = `${x},${y}`;
      
      showFieldPositionModal.value = false;
      
      if (fieldPositionContext.value === 'shot') {
        pendingShotFieldPosition.value = position;
        showShotModal.value = true;
      } else if (fieldPositionContext.value === 'goal') {
        pendingGoalFieldPosition.value = position;
        quadrantSelectionContext.value = 'goal';
        showQuadrantModal.value = true;
      }
    }

    const handleFieldPositionSelect = (position) => {
      showFieldPositionModal.value = false;
      
      if (fieldPositionContext.value === 'shot') {
        pendingShotFieldPosition.value = position;
        showShotModal.value = true;
      } else if (fieldPositionContext.value === 'goal') {
        pendingGoalFieldPosition.value = position;
        quadrantSelectionContext.value = 'goal';
        showQuadrantModal.value = true;
      }
    }

    const saveShot = async (onTarget, quadrant) => {
      if (!activeMatch.value) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const shotData = {
        match_id: activeMatch.value.id,
        user_id: user.id,
        on_target: onTarget,
        quadrant: quadrant,
        field_position: pendingShotFieldPosition.value,
      };

      const { data, error } = await supabase.from('shots').insert(shotData).select();

      if (error) {
        console.error('Error saving shot:', error);
      } else {
        matchShots.value.push(data[0]);
      }

      showShotModal.value = false;
      showQuadrantModal.value = false;
      pendingShotFieldPosition.value = null;
    };



    const incrementStat = async (stat, value) => {
      if (!activeMatch.value) return;

      const currentValue = activeMatch.value[stat] || 0;
      if (currentValue + value < 0) return; // Prevent stats from going below zero

      const updatedValue = currentValue + value;
      activeMatch.value[stat] = updatedValue;

      const { error } = await supabase
        .from('matches')
        .update({ [stat]: updatedValue })
        .eq('id', activeMatch.value.id);

      if (error) {
        console.error(`Error updating ${stat}:`, error);
        // Revert optimistic update on error
        activeMatch.value[stat] -= value;
        return;
      }

      // If this is a goalkeeper match and we're changing score_against, also update goals_conceded
      const isGoalkeeper = activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper');
      if (isGoalkeeper && stat === 'score_against' && value !== 0 && goalkeeperStats.value) {
        await incrementGkStat('goals_conceded', value);
      }
    };

    const handleBackToMatches = async () => {
      activeMatch.value = null;
      await loadData();
    };

    const calculateMatchRating = (match) => {
      if (!match) return '0.00';

      let rating = 6.0;
      let shotsOnTarget = 0;
      let shotsOffTarget = 0;
      let myGoalsCount = 0;

      if (activeMatch.value && match.id === activeMatch.value.id) {
        // Live view: calculate from the reactive 'matchShots' array
        shotsOnTarget = matchShots.value.filter(s => s.on_target).length;
        shotsOffTarget = matchShots.value.filter(s => !s.on_target).length;
        // Live view: goals come from reactive goals array
        myGoalsCount = matchGoals.value.length;
      } else {
        // List view: use the pre-calculated stats on the match object
        shotsOnTarget = match.shots_on_target || 0;
        shotsOffTarget = match.shots_off_target || 0;
        // List view: goals precomputed on match object
        myGoalsCount = match.my_goals || 0;
      }

      // Check if this is a goalkeeper match and include goalkeeper stats
      const isGoalkeeper = match.position_played && match.position_played.toLowerCase().includes('goalkeeper');
      const currentGoalkeeperStats = (activeMatch.value && match.id === activeMatch.value.id) ? goalkeeperStats.value : null;

      if (isGoalkeeper && currentGoalkeeperStats) {
        // Goalkeeper-specific rating calculation (live view)
        rating += (currentGoalkeeperStats.saves || 0) * 0.175;
        rating += (currentGoalkeeperStats.catches || 0) * 0.175;
        rating += (currentGoalkeeperStats.punches || 0) * 0.15;
        rating += (currentGoalkeeperStats.penalties_saved || 0) * 1.25;
        rating -= (currentGoalkeeperStats.goals_conceded || 0) * 1;
      } else if (isGoalkeeper && match.goalkeeper_stats) {
        // Goalkeeper-specific rating calculation (list view with preloaded stats)
        rating += (match.goalkeeper_stats.saves || 0) * 0.175;
        rating += (match.goalkeeper_stats.catches || 0) * 0.175;
        rating += (match.goalkeeper_stats.punches || 0) * 0.15;
        rating += (match.goalkeeper_stats.penalties_saved || 0) * 1.25;
        rating -= (match.goalkeeper_stats.goals_conceded || 0) * 1;
      } else if (isGoalkeeper) {
        // Default goalkeeper rating when no stats are available yet - clean sheet bonus
        const goalsAgainst = match.score_against || 0;

        rating -= goalsAgainst * 1; // Goals conceded penalty
      }

      // Regular player contributions
      rating += myGoalsCount * 1.7;
      rating += (match.assists || 0) * 1.0;
      rating += shotsOnTarget * 0.2;
      rating += shotsOffTarget * 0.1;
      rating += (match.tackles || 0) * 0.1;
      rating += (match.interceptions || 0) * 0.2;
      rating += (match.dribbles || 0) * 0.1;
      rating += (match.successful_passes || 0) * 0.05;
      rating += (match.created_chances || 0) * 0.25;

      // Negative contributions
      rating -= (match.fouls || 0) * 0.25;
      rating -= (match.lost_possessions || 0) * 0.15;
      rating -= (match.unsuccessful_passes || 0) * 0.05;
      rating -= (match.own_goals || 0) * 2.0;

      // Disciplinary
      rating -= (match.yellow_card || 0) * 0.75;
      rating -= (match.red_card || 0) * 3;

      // Result impact
      const result = getMatchResult(match);
      if (result === 'WIN') rating += 1.0;
      else if (result === 'LOSS') rating -= 1.0;

      return Math.max(0, Math.min(10, rating)).toFixed(2);
    };
    const ratingColorConfig = {
      excellent: { threshold: 9.0, class: 'stat-excellent' },
      good: { threshold: 8.0, class: 'stat-good' },
      mid: { threshold: 6.5, class: 'stat-mid' },
      bad: { threshold: 5.0, class: 'stat-bad' },
      horrible: { threshold: 0, class: 'stat-horrible' },
    };

    const getStatColorClass = (statType, value) => {
      const numValue = parseFloat(value) || 0;
      if (statType === 'rating') {
        if (numValue >= ratingColorConfig.excellent.threshold) return ratingColorConfig.excellent.class;
        if (numValue >= ratingColorConfig.good.threshold) return ratingColorConfig.good.class;
        if (numValue >= ratingColorConfig.mid.threshold) return ratingColorConfig.mid.class;
        if (numValue >= ratingColorConfig.bad.threshold) return ratingColorConfig.bad.class;
        return ratingColorConfig.horrible.class;
      }
      // Keep original logic for other stat types
      if (statType === 'goals') {
        if (numValue >= 2) return 'stat-good';
        if (numValue >= 1) return 'stat-mid';
        return 'stat-bad';
      }
      if (statType === 'assists') {
        if (numValue >= 2) return 'stat-good';
        if (numValue >= 1) return 'stat-mid';
        return 'stat-bad';
      }
      return '';
    };

    const confirmDeleteMatch = () => {
      showDeleteConfirm.value = true
    }

    const deleteMatch = async () => {
      if (!activeMatch.value) return
      
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', activeMatch.value.id)
      
      if (error) {
        console.error('Error deleting match:', error)
      } else {
        // Remove from local matches array
        matches.value = matches.value.filter(m => m.id !== activeMatch.value.id)
        activeMatch.value = null
        showDeleteConfirm.value = false
      }
    }

    const updatePosition = async () => {
      if (!activeMatch.value) return
      
      const { error } = await supabase
        .from('matches')
        .update({
          position_played: activeMatch.value.position_played
        })
        .eq('id', activeMatch.value.id)
      
      if (error) {
        console.error('Error updating position:', error)
      } else {
        // Update local matches array
        const matchIndex = matches.value.findIndex(m => m.id === activeMatch.value.id)
        if (matchIndex > -1) {
          matches.value[matchIndex].position_played = activeMatch.value.position_played
        }
        
        // Auto-toggle goalkeeper mode based on position
        if (activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')) {
          isGoalkeeperMode.value = true
          await loadGoalkeeperStats(activeMatch.value.id)
        } else {
          isGoalkeeperMode.value = false
          goalkeeperStats.value = null
        }
      }
    }

    const updateMatch = async () => {
      if (!activeMatch.value) return
      
      const { error } = await supabase
        .from('matches')
        .update({
          opponent: activeMatch.value.opponent,
          match_date: activeMatch.value.match_date
        })
        .eq('id', activeMatch.value.id)
      
      if (error) {
        console.error('Error updating match:', error)
      } else {
        // Update local matches array
        const matchIndex = matches.value.findIndex(m => m.id === activeMatch.value.id)
        if (matchIndex > -1) {
          matches.value[matchIndex] = { ...activeMatch.value }
        }
        showEditMatch.value = false
      }
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
      matches,
      userEmail,
      showAddMatch,
      newMatch,
      wins,
      winRate,
      addMatch,
      getMatchResult,
      formatDate,
      activeTab,
      activeMatch,
      selectMatch,
      incrementStat,
      handleBackToMatches,
      handleMyGoal,
      myGoalsForMatch,
      showGoalModal,
      showShotModal,
      showQuadrantModal,
      showFieldPositionModal,
      shotMapView,
      fieldPositionContext,
      quadrantSelectionContext,
      pendingShotFieldPosition,
      pendingGoalFieldPosition,
      quadrantForGoal,
      handleShot,
      handleShotOnTarget,
      handleQuadrantSelect,
      handleFieldPositionSelect,
      handleFieldClick,
      saveShot,
      combinedEvents,
      selectedEvent,
      selectEventForViz,
      goalTypes,
      addGoal,
      removeEvent,
      removeEventGroup,
      matchGoals,
      goalSummary,
      shotsOnTarget,
      shotsOffTarget,
      calculateMatchRating,
      getStatColorClass,
      showEditMatch,
      showDeleteConfirm,
      confirmDeleteMatch,
      deleteMatch,
      updatePosition,
      updateMatch,
      averageRating,
      highestRating,
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
      recentMatches,
      averageGoalsPerMatch,
      maxGoalsInMatch,
      totalShotsWithQuadrant,
      totalGoalsWithQuadrant,
      totalShotsOnTarget,
      totalShotsOffTarget,
      shotAccuracy,
      getQuadrantShots,
      getQuadrantGoals,
      getHeatMapClass,
      getHeatMapStyle,
      getFieldZoneCount,
      getFieldHeatStyle,
      allShotsData,
      allGoalsData,
      allShotsWithPosition,
      allGoalsWithPosition,
      getShotMarkerStyle,
      getShotCoordinates,
      getGoalTargetX,
      overallRating,
      shootingStat,
      passingStat,
      defendingStat,
      dribblingStat,
      paceStat,
      physicalStat,
      formStat,
      positions,
      isGoalkeeperMode,
      goalkeeperStats,
      incrementGkStat,
      sortBy,
      sortedMatches
    }
  }
}
</script>

<style scoped>
.goalkeeper-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-direction: column;
  text-align: center;
}

.goalkeeper-toggle > label:first-child {
  font-size: 0.9rem;
  color: #aaa;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #333;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.match-view-controls {
  display: flex;
  justify-content: center;
  padding: 1rem 2rem;
  background: rgba(10, 10, 10, 0.5);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.position-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.position-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.position-display label {
  font-size: 0.9rem;
  color: #aaa;
  font-weight: 500;
}

.position-select {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #f0f0f0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
}

.position-select:hover {
  border-color: #4CAF50;
}

.position-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.live-stat.gk-stat strong {
  color: #3498db;
}

.dashboard-page {
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-top: 5rem;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #888;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #222;
}

.tab-btn {
  padding: 1rem 2rem;
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  color: #4CAF50;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4CAF50;
}

.card-glass {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #222;
  border-radius: 16px;
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  font-size: 2rem;
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 2rem;
  color: #f0f0f0;
  margin: 0;
}

.stat-content p {
  color: #888;
  margin: 0;
  font-size: 0.9rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #222;
}

.card-header h2 {
  color: #f0f0f0;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.sort-dropdown {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  color: #f0f0f0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.sort-dropdown:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #4CAF50;
}

.sort-dropdown:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.sort-dropdown option {
  background: #1a1a1a;
  color: #f0f0f0;
}

.player-item, .match-item {
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  background: #1a1a1a;
  transition: background 0.3s ease;
  cursor: pointer;
}

.match-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.match-opponent h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
}

.match-opponent p {
  margin: 0;
  color: #888;
}

.match-score-result {
  text-align: right;
}

.match-score-result .score {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.25rem 0;
}

.match-stats-summary {
  display: flex;
  justify-content: center;
  gap: 4rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #333;
}

@media (max-width: 768px) {
  .match-stats-summary {
    gap: 1.25rem;
  }
}

.stat-item span {
  font-size: 1.25rem;
  font-weight: bold;
  display: block;
}

.stat-item label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
}

.stat-excellent {
  color: #00c8ff; /* Bright blue for excellent */
}

.stat-good {
  color: #4CAF50; /* Green for good */
}

.stat-mid {
  color: #FFC107; /* Amber for mid-tier */
}

.stat-bad {
  color: #F44336; /* Red for bad */
}

.stat-horrible {
  color: #b71c1c; /* Dark red for horrible */
}

.live-view-content.three-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

.live-view-content.single-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.shot-log-panel {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #222;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.shot-log-panel h4 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
}

.event-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #1a1a1a;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.event-time-and-icon {
  text-align: center;
}

.event-details {
  flex-grow: 1;
}

.event-quadrant-indicator {
  font-size: 1.2rem;
  color: #4CAF50;
  margin-left: auto;
  padding-right: 2rem; /* Space before the remove button */
}

.event-count {
  color: #888;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.event-item:hover {
  background-color: #2c3e50;
}

.event-item {
  position: relative;
}

.remove-event-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #333;
  color: #aaa;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  line-height: 25px;
  text-align: center;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

.event-item:hover .remove-event-btn {
  opacity: 1;
}

.remove-event-btn:hover {
  background: #dc3545;
  color: #fff;
}

.event-icon {
  font-size: 1.5rem;
}

.event-details {
  flex-grow: 1;
}

.event-type {
  font-weight: 500;
}

.event-subtype {
  font-size: 0.8rem;
  color: #888;
  margin-left: 0.5rem;
}

.shot-visualization {
  position: relative;
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}

.close-viz-btn {
  position: absolute;
  top: 1.5rem;
  right: 0;
  background: none;
  border: none;
  color: #888;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.5rem;
}

.close-viz-btn:hover {
  color: #fff;
}

.shot-visualization h5 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #aaa;
}

.viz-grid {
  max-width: 200px !important;
  aspect-ratio: 1.5 / 1 !important;
}

.viz-grid .goal-quadrant.highlight {
  background-color: rgba(76, 175, 80, 0.7) !important;
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
}

.match-header-redesign {
  margin-bottom: 2rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #888;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1.5rem;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #fff;
}

.match-card {
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.9));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.match-card-content {
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.match-info {
  flex: 1;
}


.opponent-name {
  font-size: 2.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.1;
  background: linear-gradient(135deg, #fff, #e0e0e0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.match-date {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.5rem;
}

.score-display {
  text-align: center;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.team-label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.score-number {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
  line-height: 1;
}

.score-divider {
  font-size: 2rem;
  color: #444;
  font-weight: 300;
}

.match-result {
  display: flex;
  justify-content: center;
}

.result-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-badge.win {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.result-badge.loss {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.result-badge.draw {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

/* Desktop improvements - stacked layout */
@media (min-width: 769px) {
  .match-card {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .match-card-content {
    flex-direction: column;
    gap: 2rem;
    padding: 2.5rem;
    text-align: center;
  }
  
  .opponent-name {
    font-size: 2.75rem;
  }
  
  .score-container {
    gap: 2rem;
    justify-content: center;
  }
  
  .score-number {
    font-size: 4rem;
  }
  
  .match-actions {
    max-width: 400px;
    margin: 2rem auto;
  }
}

@media (max-width: 768px) {
  .match-card-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .opponent-name {
    font-size: 1.75rem;
    text-align: center;
  }
  
  .score-number {
    font-size: 2.5rem;
  }
}

.match-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.button-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-value-display {
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 2ch; /* Ensure space for 2 digits */
  text-align: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.edit-btn:hover {
  background: rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.3);
  transform: translateY(-1px);
}

.warning-text {
  color: #ff9800;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* EA FC Player Card Styles */
.player-card-section {
  margin: 2rem 0;
}

.player-card-section h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.ea-fc-card {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #222;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: none;
  margin: 0;
}

.player-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.player-name h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f0f0f0;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rating-stats-container {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.overall-rating-container, .form-rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.overall-rating, .form-rating {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.rating-label {
  font-size: 0.7rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

/* Performance Section Styles */
.performance-section {
  margin: 2rem 0;
}

.performance-section h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.performance-card {
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.performance-header h4 {
  color: #fff;
  margin: 0;
  font-size: 1.1rem;
}

.performance-icon {
  font-size: 1.5rem;
}

.performance-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
}

.performance-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Shot Map Section Styles */
.shot-map-section {
  margin: 2rem 0;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.section-icon {
  font-size: 1.5rem;
}

.section-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin: 0;
  font-weight: 400;
}

.shot-map-container {
  padding: 2.5rem;
  border-radius: 16px;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.shot-map-header {
  margin-bottom: 2.5rem;
}

.shot-map-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.shot-stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.shot-stat-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
}

.stat-icon-wrapper.shots {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.1));
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.stat-icon-wrapper.goals {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.stat-icon-wrapper.accuracy {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  text-align: center;
}

.shot-stat-item .stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.shot-stat-item .stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.shot-stat-item .stat-breakdown {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
  font-weight: 400;
}

.shot-map-content {
  margin-top: 2rem;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.toggle-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.9);
}

.toggle-btn.active {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.8);
  color: #fff;
}

.goal-view-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.field-origin-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.goal-frame {
  position: relative;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-left: 5px solid rgba(255, 255, 255, 0.7);
  border-right: 5px solid rgba(255, 255, 255, 0.7);
  border-top: 5px solid rgba(255, 255, 255, 0.7);
}

.goal-crossbar {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  height: 5px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.8) 100%);
  border-radius: 3px;
  z-index: 15;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 255, 255, 0.3) inset;
}

.shot-heat-map {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  aspect-ratio: 1.5 / 1;
  position: relative;
  z-index: 2;
}

.heat-map-quadrant {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.heat-map-quadrant::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.heat-map-quadrant:hover::before {
  opacity: 1;
}

.heat-map-quadrant:hover {
  transform: scale(1.05);
  z-index: 10;
}

.heat-map-quadrant.heat-none {
  background: rgba(0, 0, 0, 0.4);
}

.heat-map-quadrant.heat-low {
  background: rgba(0, 0, 0, 0.25);
}

.heat-map-quadrant.heat-medium {
  background: rgba(0, 0, 0, 0.2);
}

.heat-map-quadrant.heat-high {
  background: rgba(0, 0, 0, 0.1);
}

.quadrant-data {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  z-index: 3;
  position: relative;
}

.quadrant-goals,
.quadrant-shots {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  min-width: 35px;
  min-height: 35px;
}

.quadrant-data .count {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.quadrant-goals {
  background-color: rgba(76, 175, 80, 0.8);
}

.quadrant-shots {
  background-color: rgba(33, 150, 243, 0.8);
}

.goal-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.goal-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.legend-indicator {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid;
}

.legend-indicator.goal {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.6);
}

.legend-indicator.shot {
  background: rgba(33, 150, 243, 0.3);
  border-color: rgba(33, 150, 243, 0.6);
}

.legend-indicator.empty {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.goal-legend .legend-item span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Field Origin Heat Map */
.no-data-message {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 400px;
  margin: 0 auto;
}

.no-data-message p {
  margin: 0.5rem 0;
}

.field-heat-map-frame {
  position: relative;
  background: transparent;
  border-radius: 12px;
  padding: 0;
  border: 5px solid rgba(255, 255, 255, 1);
  aspect-ratio: 1 / 1;
  max-width: 350px;
  margin: 0 auto;
}

/* SVG trajectories layer */
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
  stroke: rgba(33, 150, 243, 0.4);
  stroke-width: 0.5;
  stroke-dasharray: 2, 2;
  transition: all 0.3s ease;
}

.shot-trajectory-line.goal-trajectory {
  stroke: rgba(76, 175, 80, 0.6);
  stroke-width: 0.8;
  stroke-dasharray: none;
}

/* Goal target markers */
.goal-target-marker {
  transition: all 0.3s ease;
}

.goal-target-marker.shot-target {
  fill: rgba(33, 150, 243, 0.8);
  stroke: rgba(33, 150, 243, 1);
  stroke-width: 0.5;
}

.goal-target-marker.goal-target {
  fill: rgba(76, 175, 80, 0.9);
  stroke: rgba(76, 175, 80, 1);
  stroke-width: 0.5;
}

.shot-markers {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  z-index: 3;
}

.shot-marker {
  position: absolute;
  width: 10px;
  height: 10px;
  background: rgba(33, 150, 243, 0.9);
  border: 2px solid rgba(33, 150, 243, 1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.shot-marker:hover {
  transform: translate(-50%, -50%) scale(1.5) !important;
  background: rgba(33, 150, 243, 1);
  box-shadow: 0 0 8px rgba(33, 150, 243, 1);
}

.shot-marker.off-target-shot {
  background: rgba(239, 83, 80, 0.9);
  border-color: rgba(239, 83, 80, 1);
}

.shot-marker.off-target-shot:hover {
  transform: translate(-50%, -50%) scale(1.5) !important;
  background: rgba(239, 83, 80, 1);
  box-shadow: 0 0 8px rgba(239, 83, 80, 1);
}

.goal-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgba(76, 175, 80, 0.95);
  border: 2px solid rgba(76, 175, 80, 1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.goal-marker:hover {
  transform: translate(-50%, -50%) scale(1.5) !important;
  background: rgba(76, 175, 80, 1);
  box-shadow: 0 0 8px rgba(76, 175, 80, 1);
}

.field-heat-map {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  aspect-ratio: 1 / 1;
  max-width: 300px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.field-heat-zone {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-height: 40px;
  z-index: 2;
}

.zone-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.zone-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Responsive adjustments for shot map */
@media (max-width: 768px) {
  .shot-map-container {
    padding: 1.5rem;
  }

  .shot-map-stats {
    gap: 1rem;
  }
  
  .shot-stat-item {
    padding: 1rem;
  }

  .stat-icon-wrapper {
    width: 45px;
    height: 45px;
    font-size: 1.3rem;
  }
  
  .shot-stat-item .stat-value {
    font-size: 1.5rem;
  }
  
  .heat-map-quadrant {
    min-height: 70px;
  }

  .quadrant-data .count {
    font-size: 1.1rem;
  }
  
  .goal-legend {
    gap: 1rem;
    flex-wrap: wrap;
  }
}

/* Trends Section Styles */
.trends-section {
  margin: 2rem 0;
}

.trends-section h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.trend-card {
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.trend-header h4 {
  color: #fff;
  margin: 0;
  font-size: 1.1rem;
}

.highest-rating, .avg-stat, .avg-rating {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.rating-stats {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.chart-wrapper {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 1rem;
  overflow-x: auto;
}

.chart-wrapper::-webkit-scrollbar {
  height: 8px;
}

.chart-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.chart-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.chart-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.chart-container {
  display: flex;
  align-items: end;
  gap: 0.75rem;
  height: 120px;
  padding: 0.5rem 0;
  min-width: min-content;
}

.bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  min-width: 50px;
  height: 100%;
  position: relative;
}

.rating-value, .goals-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
  min-height: 1rem;
}

.rating-bar, .goals-bar {
  width: 24px;
  border-radius: 4px 4px 0 0;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.goals-bar {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

/* Rating bar color classes */
.rating-bar.stat-excellent {
  background: linear-gradient(135deg, #00c8ff, #0099cc);
}

.rating-bar.stat-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.rating-bar.stat-mid {
  background: linear-gradient(135deg, #FFC107, #FF8F00);
}

.rating-bar.stat-bad {
  background: linear-gradient(135deg, #FF5722, #D32F2F);
}

.rating-bar.stat-horrible {
  background: linear-gradient(135deg, #B71C1C, #880E4F);
}

/* Default rating bar color */
.rating-bar {
  background: linear-gradient(135deg, #757575, #424242);
}

.match-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  word-wrap: break-word;
  margin-top: auto;
}

/* Remove old grid media queries since we're using single column now */

.live-stats-panel h4, .live-controls-panel h4 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
}

.rating-display {
  text-align: center;
  margin-bottom: 2rem;
}

.rating-display span {
  font-size: 3rem;
  font-weight: bold;
  display: block;
  line-height: 1;
}

.rating-display label {
  font-size: 1rem;
  color: #888;
  text-transform: uppercase;
}

.live-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.live-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a1a;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.live-stat span {
  color: #aaa;
}

.live-stat strong {
  font-size: 1.1rem;
  font-weight: bold;
}

.card-stat.yellow strong {
  color: #ffc107;
}

.card-stat.red strong {
  color: #dc3545;
}

.card-controls {
  grid-template-columns: repeat(2, 1fr);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #111;
}

.card-btn {
  min-width: 50px;
  height: 70px;
  border-radius: 6px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.card-btn-remove {
  min-width: 40px;
  height: 70px;
  font-size: 1.5rem;
  background-color: #333;
  border-radius: 6px;
}

.live-match-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 0.75rem;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.button-group .btn {
  flex-grow: 1;
  padding: 1rem;
  font-size: 1.3rem;
  line-height: 1;
  min-width: 80px;
}

.live-match-stats-details {
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.live-match-stats-details h4 {
  margin-top: 0;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.stat-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.player-info h4, .match-info h4 {
  margin: 0 0 0.25rem 0;
  color: #f0f0f0;
}

.player-info p, .match-info p {
  margin: 0;
  color: #888;
  font-size: 0.9rem;
}

.match-result {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.match-result.win { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
.match-result.loss { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.match-result.draw { background: rgba(255, 165, 0, 0.2); color: #ffa500; }

.delete-btn { background: none; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; color: #888; transition: color 0.3s ease;
}
.delete-btn:hover { color: #ff4757; }

.empty-state { text-align: center; color: #888; padding: 2rem; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}

.modal {
  width: 90%; max-width: 400px; max-height: 90vh; overflow-y: auto; padding: 2rem;
}

.modal h3 { margin: 0; color: #f0f0f0; font-weight: 500; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #333;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #fff;
}

.modal-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.shot-options {
  grid-template-columns: 1fr 1fr;
}

.modal-option-btn {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #f0f0f0;
  border-radius: 8px;
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  aspect-ratio: 1 / 1;
}

.modal-option-btn:hover {
  background: #2c3e50;
  border-color: #4CAF50;
  transform: translateY(-3px);
}

.modal-option-btn .option-icon {
  font-size: 2rem;
  line-height: 1;
}

.modal-option-btn.btn-success {
  border-color: rgba(76, 175, 80, 0.5);
}

.modal-option-btn.btn-success:hover {
  background: #4CAF50;
  border-color: #4CAF50;
}

.modal-option-btn.btn-danger {
  border-color: rgba(220, 53, 69, 0.5);
}

.modal-option-btn.btn-danger:hover {
  background: #413536;
  border-color: #dc3545;
}

.goal-grid-container {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  aspect-ratio: 1.5 / 1; /* Approximate goal shape */
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: 3px solid #fff;
  border-top-width: 5px;
  padding: 5px;
  box-sizing: border-box;
}

.goal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  height: 100%;
  gap: 5px;
}

.goal-quadrant {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.goal-quadrant:hover {
  background: rgba(76, 175, 80, 0.5);
}

/* Field Position Grid */
.field-grid-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 1rem auto;
  aspect-ratio: 1 / 1; /* Square for half field */
  background: linear-gradient(180deg, rgba(34, 139, 34, 0.3) 0%, rgba(34, 139, 34, 0.15) 50%, rgba(34, 139, 34, 0.3) 100%);
  border: 5px solid rgba(255, 255, 255, 1);
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
  cursor: crosshair;
  overflow: hidden;
}

/* Field markings overlay */
.field-grid-container::before {
  content: '';
  position: absolute;
  inset: 8px;
  pointer-events: none;
  z-index: 1;
  border-radius: 2px;
}

/* Field markings container */
.field-markings {
  position: absolute;
  inset: 8px;
  pointer-events: none;
  z-index: 1;
}

/* Field markings in heat map frame */
.field-heat-map-frame .field-markings {
  inset: 0;
}

/* Penalty box for attacking half */
.penalty-box.attacking-box {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 30%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

/* Penalty arc for attacking half (semicircle) */
.penalty-arc.attacking-arc {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 15%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
  border-radius: 0 0 50% 50%;
}

/* Goal line at the top (2D view from above) */
.goal-outline {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  height: 100%;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.field-zone {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  z-index: 2;
}

.field-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.field-zone:hover {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.6);
  transform: scale(1.05);
}

.field-zone:hover::before {
  opacity: 1;
}

.zone-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  z-index: 1;
}

.modal-instruction {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-row { display: flex; gap: 1rem; }
.form-row .form-group { flex: 1; }

.form-group label { color: #aaa; }
.form-group input, .form-group select { background: #1a1a1a; border: 1px solid #333; color: #f0f0f0; }
.form-group input:focus, .form-group select:focus { border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2); }

.modal-buttons { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }

.btn-primary { background: #4CAF50; color: white; border: none; }
.btn-primary:hover { background: #45a049; }
.btn-secondary { background: #333; color: #ccc; border: 1px solid #444; }
.btn-secondary:hover { background: #444; }

@media (max-width: 768px) {
  .dashboard-grid, .stats-grid, .live-view-content {
    grid-template-columns: 1fr;
  }

  .live-match-controls {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .button-group .btn {
    padding-left: 0.8rem;
    padding-right: 0.8rem;
    font-size: 1rem;
    font-weight: 600;
    min-width: 50px;
  }
}
</style>
