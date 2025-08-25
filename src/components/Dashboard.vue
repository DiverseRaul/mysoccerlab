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

        <!-- Recent Form Charts -->
        <div class="trends-section">
          <h3>Recent Form</h3>
          <div class="trends-grid">
            <div class="trend-card card-glass">
              <div class="trend-header">
                <h4>Match Ratings</h4>
                <span :class="getStatColorClass('rating', highestRating)" class="highest-rating">Best: {{ highestRating }}</span>
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
                <h4>Goals Scored</h4>
                <span class="avg-stat">Avg: {{ averageGoalsPerMatch }}</span>
              </div>
              <div class="chart-wrapper">
                <div class="chart-container">
                  <div v-for="(match, index) in recentMatches" :key="match.id" class="bar-container">
                    <div class="goals-value">{{ match.my_goals || 0 }}</div>
                    <div class="goals-bar" :style="{ height: (match.my_goals || 0) === 0 ? '0%' : Math.max((match.my_goals || 0) / Math.max(maxGoalsInMatch, 1) * 100, 15) + '%' }"></div>
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
          <button class="btn btn-primary" @click="showAddMatch = true">Add Match</button>
        </div>
        <div v-if="!activeMatch">
          <div v-if="matches.length > 0" class="matches-list">
            <div v-for="match in matches" :key="match.id" class="match-item card-glass" @click="selectMatch(match)">
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
            <button @click="activeMatch = null" class="back-button">
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
          
          
          
          <div class="live-view-content single-column">
            <div class="live-stats-panel">
              <h4>Performance</h4>
              <div class="rating-display">
                <span :class="getStatColorClass('rating', calculateMatchRating(activeMatch))">{{ calculateMatchRating(activeMatch) }}</span>
                <label>Match Rating</label>
              </div>
              <div class="live-stats-grid">
                <div class="live-stat"><span>Goals</span> <strong>{{ activeMatch.my_goals || 0 }}</strong></div>
                <div class="live-stat"><span>Assists</span> <strong>{{ activeMatch.assists }}</strong></div>
                <div class="live-stat"><span>Shots on Target</span> <strong>{{ shotsOnTarget }}</strong></div>
                <div class="live-stat"><span>Shots off Target</span> <strong>{{ shotsOffTarget }}</strong></div>
                <div class="live-stat"><span>Tackles</span> <strong>{{ activeMatch.tackles }}</strong></div>
                <div class="live-stat"><span>Interceptions</span> <strong>{{ activeMatch.interceptions }}</strong></div>
                <div class="live-stat"><span>Clearances</span> <strong>{{ activeMatch.clearances || 0 }}</strong></div>
                <div class="live-stat"><span>Dribbles</span> <strong>{{ activeMatch.dribbles }}</strong></div>
                <div class="live-stat"><span>Good Passes</span> <strong>{{ activeMatch.successful_passes }}</strong></div>
                <div class="live-stat"><span>Bad Passes</span> <strong>{{ activeMatch.unsuccessful_passes }}</strong></div>
                <div class="live-stat"><span>Fouls</span> <strong>{{ activeMatch.fouls }}</strong></div>
                <div class="live-stat"><span>Own Goals</span> <strong>{{ activeMatch.own_goals }}</strong></div>
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
                <button @click="selectedEvent = null" class="close-viz-btn">&times;</button>
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
              <div class="live-match-controls">
                <div class="stat-control-group">
                  <span class="stat-label">My Goal</span>
                  <div class="button-group">
                    <button @click="handleMyGoal(1)" class="btn btn-success">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">My Assist</span>
                  <div class="button-group">
                    <button @click="incrementStat('assists', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('assists', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Shot</span>
                  <div class="button-group">
                    <button @click="handleShot()" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Tackle</span>
                  <div class="button-group">
                    <button @click="incrementStat('tackles', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('tackles', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Interception</span>
                  <div class="button-group">
                    <button @click="incrementStat('interceptions', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('interceptions', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Clearance</span>
                  <div class="button-group">
                    <button @click="incrementStat('clearances', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('clearances', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Dribble</span>
                  <div class="button-group">
                    <button @click="incrementStat('dribbles', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('dribbles', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Good Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('successful_passes', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('successful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Bad Pass</span>
                  <div class="button-group">
                    <button @click="incrementStat('unsuccessful_passes', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('unsuccessful_passes', 1)" class="btn">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Foul</span>
                  <div class="button-group">
                    <button @click="incrementStat('fouls', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('fouls', 1)" class="btn">+</button>
                  </div>
                </div>
              </div>
              <h4>Score Events</h4>
              <div class="live-match-controls">
                <div class="stat-control-group">
                  <span class="stat-label">Our Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('score_for', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('score_for', 1)" class="btn btn-primary">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Their Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('score_against', -1)" class="btn btn-danger">-</button>
                    <button @click="incrementStat('score_against', 1)" class="btn btn-danger">+</button>
                  </div>
                </div>
                <div class="stat-control-group">
                  <span class="stat-label">Own Goal</span>
                  <div class="button-group">
                    <button @click="incrementStat('own_goals', -1)" class="btn btn-danger">-</button>
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
import { ref, computed, onMounted } from 'vue'
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
    const selectedEvent = ref(null)
    const quadrantSelectionContext = ref('shot') // 'shot' or 'goal'
    const quadrantForGoal = ref(null)
    const showEditMatch = ref(false)
    const showDeleteConfirm = ref(false)
    const goalTypes = ref(['Normal', 'Freekick', 'Penalty', 'Long Shot', 'Header', 'Tap-in'])
    
    const newMatch = ref({
      opponent: '',
      match_date: new Date().toISOString().split('T')[0]
    })

    const goalSummary = computed(() => {
      return matchGoals.value.reduce((acc, goal) => {
        acc[goal.goal_type] = (acc[goal.goal_type] || 0) + 1
        return acc
      }, {})
    })

    const shotsOnTarget = computed(() => {
      return matchShots.value.filter(shot => shot.on_target).length
    })

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

    const shotsOffTarget = computed(() => {
      return matchShots.value.filter(shot => !shot.on_target).length
    })

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
      return (totalRating / matches.value.length).toFixed(1)
    })

    const highestRating = computed(() => {
      if (matches.value.length === 0) return '0.0'
      const ratings = matches.value.map(match => parseFloat(calculateMatchRating(match)))
      return Math.max(...ratings).toFixed(1)
    })

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
      return matches.value.slice(-8).reverse()
    })

    const averageGoalsPerMatch = computed(() => {
      if (matches.value.length === 0) return '0.0'
      return (totalGoals.value / matches.value.length).toFixed(1)
    })

    const maxGoalsInMatch = computed(() => {
      if (matches.value.length === 0) return 1
      return Math.max(...matches.value.map(match => match.my_goals || 0), 1)
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

    const loadData = async () => {
      try {
        // Load matches for the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', user.id)
          .order('match_date', { ascending: false })

        if (matchesError) {
          console.error('Error fetching matches:', matchesError)
          return
        }

        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('match_id')
          .eq('user_id', user.id)

        if (goalsError) {
          console.error('Error fetching goals:', goalsError)
        }

        const goalsPerMatch = (goalsData || []).reduce((acc, goal) => {
          acc[goal.match_id] = (acc[goal.match_id] || 0) + 1
          return acc
        }, {})

        matches.value = matchesData.map(match => ({
          ...match,
          my_goals: goalsPerMatch[match.id] || 0
        }))
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

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
          own_goals: 0
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
      activeMatch.value = match
      await loadMatchDetails(match.id)
    }

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

    const handleMyGoal = () => {
      quadrantSelectionContext.value = 'goal';
      showQuadrantModal.value = true;
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
        { user_id: user.id, match_id: activeMatch.value.id, goal_type: type, quadrant: quadrant }
      ]).select()

      if (error) {
        console.error('Error adding goal:', error)
        // Revert score if goal insert fails
        await incrementStat('score_for', -1)
      } else {
        matchGoals.value.push(data[0])
        activeMatch.value.my_goals = (activeMatch.value.my_goals || 0) + 1
      }
      showGoalModal.value = false
      quadrantForGoal.value = null; // Reset context
    }

    const handleShot = () => {
      quadrantSelectionContext.value = 'shot';
      showShotModal.value = true;
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
          activeMatch.value.my_goals = Math.max(0, (activeMatch.value.my_goals || 0) - 1);
        }
      }
    };

    const removeEventGroup = async (eventGroup) => {
      if (!activeMatch.value) return;

      // If any event in the group is being visualized, close the viz
      if (selectedEvent.value && eventGroup.events.some(e => e.id === selectedEvent.value.id)) {
        selectedEvent.value = null;
      }

      // Remove all events in the group
      for (const event of eventGroup.events) {
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
            // Decrement team score for each goal
            await incrementStat('score_for', -1);
            matchGoals.value = matchGoals.value.filter(g => g.id !== event.id);
            activeMatch.value.my_goals = Math.max(0, (activeMatch.value.my_goals || 0) - 1);
          }
        }
      }
    };

    const handleShotOnTarget = () => {
      showShotModal.value = false;
      // The context is already 'shot' from handleShot
      showQuadrantModal.value = true;
    }

    const saveShot = async (onTarget, quadrant) => {
      if (!activeMatch.value) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const shotData = {
        user_id: user.id,
        match_id: activeMatch.value.id,
        on_target: onTarget,
        quadrant: quadrant
      };

      const { data, error } = await supabase.from('shots').insert([shotData]).select();

      if (error) {
        console.error('Error adding shot:', error);
      } else {
        matchShots.value.push(data[0]);
      }
      showShotModal.value = false;
      showQuadrantModal.value = false;
    }



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
      }
    };

    const calculateMatchRating = (match) => {
      let rating = 6.0; // Base rating

      // Contributions
      rating += (match.my_goals || 0) * 1.7; // 1.5 per goal
      rating += match.assists * 1.0;
      rating += match.tackles * 0.2;
      rating += match.interceptions * 0.2;
      rating += match.dribbles * 0.15;
      rating += match.successful_passes * 0.05;

      // Negative contributions
      rating -= match.fouls * 0.3;
      rating -= match.unsuccessful_passes * 0.1;
      rating -= match.own_goals * 2.0;

      // Result impact
      const result = getMatchResult(match);
      if (result === 'WIN') rating += 1.0;
      else if (result === 'LOSS') rating -= 1.0;

      // Clamp between 0 and 10
      return Math.max(0, Math.min(10, rating)).toFixed(1);
    }

    const getStatColorClass = (statType, value) => {
      const numValue = parseFloat(value) || 0;
      if (statType === 'rating') {
        if (numValue >= 8.5) return 'stat-good';
        if (numValue >= 7.0) return 'stat-mid';
        if (numValue >= 3.0) return 'stat-bad';
        return 'stat-horrible';
      }
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
    }

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
      handleMyGoal,
      showGoalModal,
      showShotModal,
      showQuadrantModal,
      handleShot,
      handleShotOnTarget,
      handleQuadrantSelect,
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
      updateMatch,
      averageRating,
      highestRating,
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
      maxGoalsInMatch
    }
  }
}
</script>

<style scoped>
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
  justify-content: space-around;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #333;
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

.stat-good {
  color: #28a745; /* Green */
}

.stat-mid {
  color: #ffc107; /* Yellow */
}

.stat-bad {
  color: #dc3545; /* Red */
}

.stat-horrible {
  color: #84359a; /* Purple */
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
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
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
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.highest-rating, .avg-stat {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.chart-wrapper {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 1rem;
}

.chart-container {
  display: flex;
  align-items: end;
  gap: 0.75rem;
  height: 120px;
  padding: 0.5rem 0;
}

.bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
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
  font-size: 0.9rem;
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
  padding: 0.5rem;
  font-size: 1.2rem;
  line-height: 1;
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

.delete-btn {
  background: none; border: none; cursor: pointer; color: #888; transition: color 0.3s ease;
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
  background: #dc3545;
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
    padding: 0.75rem;
    font-size: 1.5rem;
  }
}
</style>
