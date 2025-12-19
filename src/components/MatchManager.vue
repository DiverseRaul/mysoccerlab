<template>
  <div class="matches-section">
        <div class="card-header">
          <h2>All Matches</h2>
          <div class="header-controls">
            <select v-model="sortBy" class="sort-dropdown">
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button class="btn btn-primary btn-icon-only" @click="showAddMatch = true" title="Add Match">+</button>
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
                <div v-for="item in combinedEvents" :key="item.type + item.id" class="event-item" @click="selectEventForViz(item)">
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
                <div class="viz-header">
                  <div class="view-toggles">
                    <button 
                      @click="vizView = 'field'" 
                      class="viz-toggle-btn" 
                      :class="{ active: vizView === 'field' }"
                    >
                      Origin
                    </button>
                    <button 
                      @click="vizView = 'goal'" 
                      class="viz-toggle-btn" 
                      :class="{ active: vizView === 'goal' }"
                    >
                      Placement
                    </button>
                  </div>
                </div>

                <div class="viz-container">
                  <div v-if="vizView === 'field'" class="viz-section">
                    <div class="field-grid-container viz-field">
                      <!-- SVG Field Markings (Dark Theme) -->
                      <svg class="field-markings-svg" viewBox="0 0 68 52.5" preserveAspectRatio="none">
                        <!-- Outline -->
                        <rect x="0" y="0" width="68" height="52.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
                        <!-- Penalty Box -->
                        <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                        <!-- Goal Area -->
                        <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                        <!-- Penalty Spot -->
                        <circle cx="34" cy="11" r="0.4" fill="rgba(255,255,255,0.8)" />
                        <!-- Penalty Arc -->
                        <path d="M 26.68 16.5 A 9.15 9.15 0 0 0 41.32 16.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.5" />
                        <!-- Center Circle -->
                        <path d="M 24.85 52.5 A 9.15 9.15 0 0 1 43.15 52.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                        <!-- Corner Arcs -->
                        <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                        <path d="M 68 2 A 2 2 0 0 1 66 0" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                        <!-- Goal Post -->
                        <path d="M 30.34 0 L 30.34 -1.5 L 37.66 -1.5 L 37.66 0" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.8" />
                      </svg>
                      <!-- Shot Trajectory Line (Only for Goals and On-Target Shots) -->
                      <svg class="field-markings-svg overlay" viewBox="0 0 68 52.5" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
                        <line 
                          v-if="showTrajectory"
                          :x1="shotTrajectory.x1" 
                          :y1="shotTrajectory.y1" 
                          :x2="shotTrajectory.x2" 
                          :y2="shotTrajectory.y2" 
                          stroke="rgba(255,255,255,0.4)" 
                          stroke-width="0.5" 
                          stroke-dasharray="2"
                        />
                      </svg>
                      <div 
                        v-if="selectedEvent.field_position" 
                        class="shot-marker" 
                        :class="{ 
                          'off-target': selectedEvent.type === 'Shot' && !selectedEvent.on_target,
                          'goal': selectedEvent.type === 'Goal'
                        }"
                        :style="getShotMarkerStyle(selectedEvent)"
                      ></div>
                      <div v-else class="viz-placeholder">
                        <span>No origin recorded</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="vizView === 'goal'" class="viz-section">
                    <div class="goal-grid-container viz-grid">
                      <div class="goal-grid">
                        <div v-for="i in 9" :key="i" class="goal-quadrant" :class="{ 'highlight': selectedEvent.quadrant === i }">
                          <span v-if="selectedEvent.quadrant === i">X</span>
                        </div>
                      </div>
                      <div v-if="!selectedEvent.quadrant" class="viz-placeholder-text">
                        No placement recorded
                      </div>
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
            <button @click="openShareModal" class="action-btn share-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
              </svg>
              Share Match
            </button>
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
            <!-- SVG Field Markings (Dark Theme) -->
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
          </div>
          <div class="modal-footer-actions">
            <button @click="skipFieldPosition" class="btn btn-secondary btn-sm">Skip</button>
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

    <!-- Share Match Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="showShareModal = false">
      <div class="modal card-glass share-modal" @click.stop>
        <div class="modal-header">
          <h3>Share Match Result</h3>
          <button @click="showShareModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="share-card-container">
            <div id="share-card" class="share-card">
              <!-- Card Content -->
              <div class="share-card-header">
                <div class="share-date">{{ formatDate(activeMatch.match_date) }}</div>
                <div class="share-result" :class="getMatchResult(activeMatch).toLowerCase()">
                  {{ getMatchResult(activeMatch) }}
                </div>
              </div>
              
              <div class="share-score">
                <div class="share-team">
                  <span class="share-team-name">You</span>
                  <span class="share-score-num">{{ activeMatch.score_for }}</span>
                </div>
                <div class="share-divider">-</div>
                <div class="share-team">
                  <span class="share-team-name">{{ activeMatch.opponent }}</span>
                  <span class="share-score-num">{{ activeMatch.score_against }}</span>
                </div>
              </div>

              <div class="share-stats">
                <div class="share-stat">
                  <span class="share-stat-val" :class="getStatColorClass('rating', calculateMatchRating(activeMatch))">
                    {{ calculateMatchRating(activeMatch) }}
                  </span>
                  <span class="share-stat-label">Rating</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ myGoalsForMatch }}</span>
                  <span class="share-stat-label">Goals</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ activeMatch.assists || 0 }}</span>
                  <span class="share-stat-label">Assists</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ getMatchPassAccuracy(activeMatch) }}%</span>
                  <span class="share-stat-label">Pass Acc</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ activeMatch.created_chances || 0 }}</span>
                  <span class="share-stat-label">Chances</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ activeMatch.tackles || 0 }}</span>
                  <span class="share-stat-label">Tackles</span>
                </div>
              </div>
              
              <div class="share-footer">
                {{ shareLink }}
              </div>
            </div>
          </div>
          
          <div class="modal-buttons share-actions">
            <button @click="shareViaWhatsApp" class="btn share-option-btn">
              <span class="btn-icon">💬</span> WhatsApp
            </button>
            <button @click="shareNative" class="btn share-option-btn">
              <span class="btn-icon">🔗</span> Share Image
            </button>
            <button @click="downloadShareImage" class="btn share-option-btn">
              <span class="btn-icon">⬇️</span> Download
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import html2canvas from 'html2canvas'

const props = defineProps({
  matches: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['match-updated'])

const showAddMatch = ref(false)
const activeMatch = ref(null)
    const matchGoals = ref([])
    const matchShots = ref([])
    const showGoalModal = ref(false)
    const showShotModal = ref(false)
    const showQuadrantModal = ref(false)
    const showFieldPositionModal = ref(false)
    const shotMapView = ref('goal') // 'goal' or 'field'
    const vizView = ref('field') // 'field' or 'goal' for sidebar visualization
    const selectedEvent = ref(null)
    const quadrantSelectionContext = ref('shot') // 'shot' or 'goal'
    const quadrantForGoal = ref(null)
    const pendingShotFieldPosition = ref(null)
    const pendingGoalFieldPosition = ref(null)
    const fieldPositionContext = ref('shot') // 'shot' or 'goal'
    const showEditMatch = ref(false)
    const showDeleteConfirm = ref(false)
    const showShareModal = ref(false)
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
      const goals = matchGoals.value.map(g => ({ 
        ...g, 
        type: 'Goal', 
        details: 'Goal Scored', 
        event_time: g.created_at,
        count: 1,
        events: [{ ...g, type: 'Goal' }]
      }));
      
      const shots = matchShots.value.map(s => ({ 
        ...s, 
        type: 'Shot', 
        details: s.on_target ? 'On Target' : 'Off Target', 
        event_time: s.created_at,
        count: 1,
        events: [{ ...s, type: 'Shot' }]
      }));
      
      return [...goals, ...shots].sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
    });


    const wins = computed(() => {
      return props.matches.filter(match => match.score_for > match.score_against).length
    })

    const winRate = computed(() => {
      if (props.matches.length === 0) return 0
      return Math.round((wins.value / props.matches.length) * 100)
    })

    const averageRating = computed(() => {
      if (props.matches.length === 0) return '0.0'
      const totalRating = props.matches.reduce((sum, match) => sum + parseFloat(calculateMatchRating(match)), 0)
      return (totalRating / props.matches.length).toFixed(2)
    })

    const highestRating = computed(() => {
      if (props.matches.length === 0) return '0.0'
      const ratings = props.matches.map(match => parseFloat(calculateMatchRating(match)))
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
      return props.matches.reduce((sum, match) => sum + (match.my_goals || 0), 0)
    })

    const totalAssists = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.assists || 0), 0)
    })

    const totalSuccessfulPasses = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.successful_passes || 0), 0)
    })

    const totalUnsuccessfulPasses = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.unsuccessful_passes || 0), 0)
    })

    const passAccuracy = computed(() => {
      const total = totalSuccessfulPasses.value + totalUnsuccessfulPasses.value
      if (total === 0) return 0
      return Math.round((totalSuccessfulPasses.value / total) * 100)
    })

    const totalTackles = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.tackles || 0), 0)
    })

    const totalInterceptions = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.interceptions || 0), 0)
    })

    const totalClearances = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.clearances || 0), 0)
    })

    const totalFouls = computed(() => {
      return props.matches.reduce((sum, match) => sum + (match.fouls || 0), 0)
    })

    const recentMatches = computed(() => {
      return props.matches.slice(0, 10).reverse()
    })

    const sortedMatches = computed(() => {
      const sorted = [...props.matches];
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
      if (props.matches.length === 0) return '0.0'
      return ((totalGoals.value + totalAssists.value) / props.matches.length).toFixed(1)
    })

    const maxGoalsInMatch = computed(() => {
      if (props.matches.length === 0) return 1
      return Math.max(...props.matches.map(match => (match.my_goals || 0) + (match.assists || 0)), 1)
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

    const showTrajectory = computed(() => {
      if (!selectedEvent.value || !selectedEvent.value.field_position) return false
      // Show for Goals and On-Target Shots only
      return selectedEvent.value.type === 'Goal' || (selectedEvent.value.type === 'Shot' && selectedEvent.value.on_target)
    })

    const shotTrajectory = computed(() => {
      if (!selectedEvent.value || !selectedEvent.value.field_position) return { x1: 0, y1: 0, x2: 0, y2: 0 }
      
      const [xPct, yPct] = selectedEvent.value.field_position.split(',').map(Number)
      
      // Convert percentage to SVG coordinates (68 width, 52.5 height)
      const x1 = (xPct / 100) * 68
      const y1 = (yPct / 100) * 52.5
      
      // Calculate destination point based on quadrant
      // Goal width is approx 30.34 to 37.66. Center is 34. Width ~7.32
      // Quadrants 1,4,7 (Left): Target left side of goal (~31.56)
      // Quadrants 2,5,8 (Center): Target center of goal (34)
      // Quadrants 3,6,9 (Right): Target right side of goal (~36.44)
      
      let x2 = 34 // Default center
      const quadrant = selectedEvent.value.quadrant
      
      if ([1, 4, 7].includes(quadrant)) {
        x2 = 31.56
      } else if ([3, 6, 9].includes(quadrant)) {
        x2 = 36.44
      }
      
      const y2 = 0
      
      return { x1, y1, x2, y2 }
    })

    const selectEventForViz = (event) => {
      // If the same event is already selected, close it (click-to-close functionality)
      if (selectedEvent.value && selectedEvent.value.id === event.id && selectedEvent.value.type === event.type) {
        selectedEvent.value = null;
        return;
      }
      
      // Allow selecting any event that has field position or quadrant data
      if (event.field_position || event.quadrant) {
        selectedEvent.value = event;
      } else {
        // Fallback or ignore events without data
        selectedEvent.value = null;
      }
    };

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
      if (props.matches.length === 0) return 65
      const avgStats = (shootingStat.value + passingStat.value + defendingStat.value + dribblingStat.value + paceStat.value + physicalStat.value) / 6
      return Math.min(99, Math.max(30, Math.round(avgStats)))
    })

    const shootingStat = computed(() => {
      if (props.matches.length === 0) return 65
      const avgGoals = totalGoals.value / props.matches.length
      const avgShotsOnTarget = props.matches.reduce((sum, match) => {
        // Calculate shots on target from match data if available
        return sum + (match.shots_on_target || 0)
      }, 0) / props.matches.length
      
      let rating = 50 + (avgGoals * 15) + (avgShotsOnTarget * 5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const passingStat = computed(() => {
      if (props.matches.length === 0) return 65
      const accuracy = passAccuracy.value
      const avgPasses = (totalSuccessfulPasses.value + totalUnsuccessfulPasses.value) / props.matches.length
      
      let rating = 40 + (accuracy * 0.4) + (avgPasses * 0.5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const defendingStat = computed(() => {
      if (props.matches.length === 0) return 65
      const avgTackles = totalTackles.value / props.matches.length
      const avgInterceptions = totalInterceptions.value / props.matches.length
      const avgClearances = totalClearances.value / props.matches.length
      
      let rating = 45 + (avgTackles * 8) + (avgInterceptions * 6) + (avgClearances * 4)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const dribblingStat = computed(() => {
      if (props.matches.length === 0) return 65
      const avgDribbles = props.matches.reduce((sum, match) => sum + (match.dribbles || 0), 0) / props.matches.length
      const avgGoals = totalGoals.value / props.matches.length
      
      let rating = 50 + (avgDribbles * 6) + (avgGoals * 5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const paceStat = computed(() => {
      if (props.matches.length === 0) return 70
      // Base pace on overall performance and assists (indicating quick play)
      const avgAssists = totalAssists.value / props.matches.length
      const winRateBonus = winRate.value * 0.2
      
      let rating = 60 + (avgAssists * 8) + winRateBonus
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const physicalStat = computed(() => {
      if (props.matches.length === 0) return 65
      const avgFouls = totalFouls.value / props.matches.length
      const avgTackles = totalTackles.value / props.matches.length
      const matchesPlayed = props.matches.length
      
      // Higher fouls might indicate physicality, but too many is bad
      let rating = 55 + (avgTackles * 6) + (avgFouls * 2) + (matchesPlayed * 0.5)
      return Math.min(99, Math.max(30, Math.round(rating)))
    })

    const formStat = computed(() => {
      if (props.matches.length === 0) return 65
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

        newMatch.value = {
          opponent: '',
          match_date: new Date().toISOString().split('T')[0]
        }
        showAddMatch.value = false
        emit('match-updated')
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
      if (selectedEvent.value && selectedEvent.value.id === event.id && selectedEvent.value.type === event.type) {
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
      if (selectedEvent.value && selectedEvent.value.id === eventToRemove.id && selectedEvent.value.type === eventToRemove.type) {
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
      if (!event.currentTarget) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert to percentages (0-100)
      const xPct = Math.round((x / rect.width) * 100);
      const yPct = Math.round((y / rect.height) * 100);
      
      const position = `${xPct},${yPct}`;
      
      if (fieldPositionContext.value === 'shot') {
        pendingShotFieldPosition.value = position;
        showFieldPositionModal.value = false;
        showShotModal.value = true;
      } else if (fieldPositionContext.value === 'goal') {
        pendingGoalFieldPosition.value = position;
        showFieldPositionModal.value = false;
        quadrantSelectionContext.value = 'goal';
        showQuadrantModal.value = true;
      }
    }

    const skipFieldPosition = () => {
      if (fieldPositionContext.value === 'shot') {
        pendingShotFieldPosition.value = null;
        showFieldPositionModal.value = false;
        showShotModal.value = true;
      } else if (fieldPositionContext.value === 'goal') {
        pendingGoalFieldPosition.value = null;
        showFieldPositionModal.value = false;
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

    const handleBackToMatches = () => {
      activeMatch.value = null;
      emit('match-updated');
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
        activeMatch.value = null
        showDeleteConfirm.value = false
        emit('match-updated')
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
        // Auto-toggle goalkeeper mode based on position
        if (activeMatch.value.position_played && activeMatch.value.position_played.toLowerCase().includes('goalkeeper')) {
          isGoalkeeperMode.value = true
          await loadGoalkeeperStats(activeMatch.value.id)
        } else {
          isGoalkeeperMode.value = false
          goalkeeperStats.value = null
        }
        emit('match-updated')
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
        showEditMatch.value = false
        emit('match-updated')
      }
    }

    const openShareModal = () => {
      showShareModal.value = true;
    }

    const shareLink = computed(() => {
      return 'https://mysoccerlab.com'
    })

    const shareText = computed(() => {
      if (!activeMatch.value) return ''
      return `Match Result vs ${activeMatch.value.opponent}
${getMatchResult(activeMatch.value).toUpperCase()} (${activeMatch.value.score_for}-${activeMatch.value.score_against})

Rating: ${calculateMatchRating(activeMatch.value)}
Goals: ${myGoalsForMatch.value}
Assists: ${activeMatch.value.assists || 0}
Pass Accuracy: ${getMatchPassAccuracy(activeMatch.value)}%
Chances Created: ${activeMatch.value.created_chances || 0}

Tracked with ${shareLink.value}`
    })

    const shareViaWhatsApp = () => {
      const url = `https://wa.me/?text=${encodeURIComponent(shareText.value)}`
      window.open(url, '_blank')
    }

    const shareNative = async () => {
      const element = document.getElementById('share-card')
      if (!element) return
      
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#101418', 
          scale: 2 
        })
        
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `match-vs-${activeMatch.value.opponent}.png`, { type: 'image/png' })
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Match vs ${activeMatch.value.opponent}`,
              text: shareText.value
            })
          } else {
            alert('Image sharing is not supported on this device. Please use the Download button.')
          }
        }, 'image/png')
      } catch (error) {
        console.error('Error sharing image:', error)
      }
    }

    const downloadShareImage = async () => {
      const element = document.getElementById('share-card');
      if (!element) return;
      
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#101418', 
          scale: 2 
        });
        
        const link = document.createElement('a');
        link.download = `match-vs-${activeMatch.value.opponent}-${activeMatch.value.match_date}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showShareModal.value = false;
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }

    const getMatchResult = (match) => {
      if (match.score_for > match.score_against) return 'Win'
      if (match.score_for < match.score_against) return 'Loss'
      return 'Draw'
    }

    const getMatchPassAccuracy = (match) => {
      const successful = match.successful_passes || 0;
      const unsuccessful = match.unsuccessful_passes || 0;
      const total = successful + unsuccessful;
      if (total === 0) return 0;
      return Math.round((successful / total) * 100);
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      // Add a day to the date to correct for timezone issues
      const date = new Date(dateString)
      date.setDate(date.getDate() + 1)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
</script>

<style scoped>
/* --- Shared Design Tokens --- */
:root {
  --md-sys-color-primary: #4cda9c;
  --md-sys-color-on-primary: #003822;
  --md-sys-color-primary-container: #005233;
  --md-sys-color-on-primary-container: #89f8c1;
  --md-sys-color-secondary: #b3ccbf;
  --md-sys-color-surface: #101418;
  --md-sys-color-surface-variant: #2d3135;
  --md-sys-color-on-surface: #e1e2e6;
  --md-sys-color-outline: #89938d;
}

/* --- Stat Color Classes --- */
.stat-excellent { color: #4cda9c !important; }
.stat-good { color: #81c784 !important; }
.stat-mid { color: #ffb74d !important; }
.stat-bad { color: #e57373 !important; }
.stat-horrible { color: #ef5350 !important; }

.matches-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
  padding-bottom: 40px;
}

/* --- Header --- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 10px;
}

.card-header h2 {
  font-size: 2rem; /* Increased from 1.8rem */
  font-weight: 800;
  margin: 0;
  background: #fff;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sort-dropdown {
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
}

/* --- Match List --- */
.matches-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.match-item {
  background: rgba(15, 18, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.match-item:hover {
  transform: translateY(-4px);
  background: rgba(25, 30, 35, 0.9);
  border-color: rgba(76, 218, 156, 0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.match-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.match-opponent h4 {
  margin: 0;
  font-size: 1.25rem; /* Increased from 1.1rem */
  color: #fff;
  font-weight: 700;
}

.match-opponent p {
  margin: 4px 0 0;
  font-size: 0.9rem; /* Increased from 0.8rem */
  color: #89938d;
}

.match-score-result {
  text-align: right;
}

.score {
  font-size: 1.4rem; /* Increased from 1.2rem */
  font-weight: 700;
  margin: 0;
  letter-spacing: 1px;
}

.match-result {
  font-size: 0.75rem; /* Increased from 0.7rem */
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.win { color: #4cda9c; background: rgba(76, 218, 156, 0.1); }
.loss { color: #ef5350; background: rgba(239, 83, 80, 0.1); }
.draw { color: #bdbdbd; background: rgba(189, 189, 189, 0.1); }

.match-stats-summary {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item span {
  font-size: 1.25rem; /* Increased from 1.1rem */
  font-weight: 700;
  color: #fff;
}

.stat-item label {
  font-size: 0.75rem; /* Increased from 0.65rem */
  color: #89938d;
  text-transform: uppercase;
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #89938d;
  font-style: italic;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

/* --- Live Match View --- */
.live-match-view {
  background: rgba(15, 18, 20, 0.9);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.match-header-redesign {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #89938d;
  cursor: pointer;
  font-size: 0.9rem;
  width: fit-content;
  transition: color 0.2s;
}

.back-button:hover {
  color: #fff;
}

.match-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 30px;
}

.match-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.opponent-name {
  font-size: 2rem;
  margin: 0;
  font-weight: 800;
  color: #fff;
}

.match-date {
  color: #89938d;
  font-size: 0.9rem;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.team-label {
  font-size: 0.7rem;
  color: #89938d;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.score-number {
  color: #fff;
}

.score-divider {
  color: rgba(255, 255, 255, 0.2);
  margin-top: 12px; /* Align with numbers */
}

.result-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.match-view-controls {
  margin-bottom: 24px;
  background: rgba(0,0,0,0.2);
  padding: 16px;
  border-radius: 12px;
}

.position-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.position-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.position-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
}

.goalkeeper-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255,255,255,0.1);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4cda9c;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Live Stats Grid */
.live-view-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.live-stats-panel, .shot-log-panel, .live-controls-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
}

.live-view-content.single-column {
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .live-view-content.single-column {
    grid-template-columns: 300px 1fr 300px;
  }
}

h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #89938d;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.rating-display span {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
}

/* Controls */
.stat-control-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  padding: 12px 24px; /* Increased padding for bigger buttons */
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.2rem; /* Increased font size */
  transition: all 0.2s;
  min-width: 48px; /* Ensure minimum width */
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-primary { background: #4cda9c; color: #003822; }
.btn-primary:hover { background: #3cb885; }

.btn-danger { background: rgba(239, 83, 80, 0.2); color: #ef5350; }
.btn-danger:hover { background: rgba(239, 83, 80, 0.4); }

.btn-success { background: rgba(76, 218, 156, 0.2); color: #4cda9c; }
.btn-success:hover { background: rgba(76, 218, 156, 0.4); }

.stat-value-display {
  font-weight: 700;
  width: 24px;
  text-align: center;
}

/* Event Log */
.event-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.event-item:hover {
  background: rgba(255,255,255,0.1);
}

.event-icon {
  font-size: 1.2rem;
}

.event-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-type {
  font-size: 0.9rem;
  font-weight: 600;
}

.event-subtype {
  font-size: 0.75rem;
  color: #89938d;
}

.event-count {
  font-size: 0.8rem;
  color: #4cda9c;
  margin-left: 4px;
}

.remove-event-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
}

.remove-event-btn:hover { color: #ef5350; }

/* Viz Grid */
.shot-visualization {
  margin-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 16px;
}

.viz-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.viz-toggle-btn {
  background: transparent;
  border: none;
  color: #89938d;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.viz-toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.viz-toggle-btn:hover:not(.active) {
  color: #ccc;
}

.viz-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.viz-placeholder {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  color: #89938d;
  font-size: 0.9rem;
}

.viz-placeholder-text {
  text-align: center;
  margin-top: 8px;
  color: #89938d;
  font-size: 0.85rem;
}

.viz-grid .goal-grid {
  width: 100%;
  height: 180px; /* Bigger visualization height */
  border-width: 2px;
}

.viz-grid .goal-quadrant {
  font-size: 1.2rem;
  font-weight: 700;
}

.viz-field {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #1a1d21;
  border: 1px solid rgba(255,255,255,0.1);
}

.shot-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3b82f6; /* Blue for on-target/goal */
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  transform: translate(-50%, -50%);
}

.shot-marker.off-target {
  background: #ef5350; /* Red for off-target */
  box-shadow: 0 0 5px rgba(239, 83, 80, 0.5);
}

.shot-marker.goal {
  background: #4caf50; /* Green for goals */
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: rgba(255,255,255,0.1);
  border: 4px solid #fff;
  width: 120px;
  height: 80px;
  margin: 0 auto;
}

/* Larger goal grid for modals */
.modal .goal-grid {
  width: 100%;
  height: 220px;
  max-width: 330px;
}

.modal .goal-quadrant {
  font-size: 1.5rem;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.1);
}

.goal-quadrant {
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.goal-quadrant:hover { background: rgba(255,255,255,0.1); }
.goal-quadrant.highlight { background: rgba(76, 218, 156, 0.5); }

/* Actions */
.match-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.action-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}

.delete-btn:hover {
  border-color: #ef5350;
  color: #ef5350;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #1a1d21;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  border: 1px solid rgba(255,255,255,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 { margin: 0; }

.close-btn {
  background: transparent;
  border: none;
  color: #89938d;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-option-btn {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.modal-option-btn:hover {
  background: rgba(76, 218, 156, 0.1);
  border-color: #4cda9c;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #89938d;
  font-size: 0.9rem;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Field Modal */
.field-modal { max-width: 500px; }
.field-grid-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #1a1d21; /* Dark gray background */
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.4);
  cursor: crosshair;
}

.field-markings-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
  .match-card-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .score-display { align-items: center; }
  
  .live-view-content.single-column {
    grid-template-columns: 1fr;
  }
  
  .matches-list {
    grid-template-columns: 1fr;
  }
}

/* Share Modal & Card */
.share-modal {
  max-width: 500px;
}

.share-card-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.share-card {
  width: 100%;
  max-width: 400px;
  background: linear-gradient(135deg, #1a1d21 0%, #101418 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.share-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.share-date {
  color: #89938d;
  font-size: 0.9rem;
}

.share-result {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.share-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.share-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.share-team-name {
  font-size: 0.8rem;
  color: #89938d;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.share-score-num {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.share-divider {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 10px;
}

.share-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
}

.share-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.share-stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #89938d;
}

.share-footer {
  text-align: center;
  font-size: 0.8rem;
  color: #4cda9c;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 8px;
}

.center-btn {
  justify-content: center;
}

.btn-full {
  width: 100%;
  justify-content: center;
}

.share-btn:hover {
  border-color: #4cda9c;
  color: #4cda9c;
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.share-option-btn {
  flex: 1;
  min-width: 120px;
  white-space: nowrap;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.share-option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #4cda9c;
  color: #fff;
}

.btn-icon {
  margin-right: 6px;
}
</style>
