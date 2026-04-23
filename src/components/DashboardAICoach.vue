<template>
  <div class="dashboard-ai-coach">
    <div class="chat-container">
      <div class="chat-toolbar" v-if="messages.length > 0">
        <span class="chat-toolbar-label">AI Coach Session</span>
        <button class="new-chat-btn" @click="startNewChat" title="New Chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.51"></path></svg>
          New Chat
        </button>
      </div>
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="suggestions-container">
          <h1 class="welcome-text">Hi, {{ userName || 'Player' }}</h1>
          <div class="chips-wrapper">
            <button class="suggestion-chip" @click="sendSuggestion('Analyze my last game')">📊 Analyze my last game</button>
            <button class="suggestion-chip" @click="sendSuggestion('How can I improve my passing?')">🎯 Improve my passing</button>
            <button class="suggestion-chip" @click="sendSuggestion('Create a training plan')">📅 Create training plan</button>
            <button class="suggestion-chip" @click="sendSuggestion('Review my stats')">📈 Review my stats</button>
          </div>
        </div>
        
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
          <!-- Inline Match Card (appears after AI text) -->
          <div v-if="msg.role === 'ai' && msg.content" class="message-content ai-markdown" v-html="marked.parse(msg.content)"></div>
          <div v-else-if="msg.role === 'user'" class="message-content">
            {{ msg.content }}
          </div>
          <div v-if="msg.matchCard" class="match-card">
            <div class="match-card-header">
              <div class="match-card-title">vs {{ msg.matchCard.opponent }}</div>
              <div class="match-card-date">{{ new Date(msg.matchCard.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
            </div>
            <div class="match-card-score">
              <span class="score-num">{{ msg.matchCard.score_for }}</span>
              <span class="score-sep">–</span>
              <span class="score-num">{{ msg.matchCard.score_against }}</span>
            </div>
            <div class="match-card-result" :class="getResultClass(msg.matchCard)">{{ getResult(msg.matchCard) }}</div>
            <div class="match-card-rating">
              <span class="rating-label">Rating</span>
              <span class="rating-value" :class="getRatingClass(msg.matchCard.rating)">{{ msg.matchCard.rating }}</span>
            </div>
            <div class="match-card-stats">
              <div class="mc-stat">
                <span class="mc-stat-val">{{ msg.matchCard.my_goals }}</span>
                <span class="mc-stat-label">Goals</span>
              </div>
              <div class="mc-stat">
                <span class="mc-stat-val">{{ msg.matchCard.assists || 0 }}</span>
                <span class="mc-stat-label">Assists</span>
              </div>
              <div class="mc-stat">
                <span class="mc-stat-val">{{ msg.matchCard.created_chances || 0 }}</span>
                <span class="mc-stat-label">Chances</span>
              </div>
              <div class="mc-stat">
                <span class="mc-stat-val">{{ getPassAcc(msg.matchCard) }}%</span>
                <span class="mc-stat-label">Pass Acc</span>
              </div>
            </div>
          </div>
          <TrainingPlanCard v-if="msg.calendarDays && msg.calendarDays.length" :TrainingSessions="msg.calendarDays" />
          <span class="message-time">{{ msg.time || 'Just now' }}</span>
        </div>

        <div v-if="isTyping" class="message ai-message typing-indicator">
          <div class="message-content">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div v-if="attachmentPreview" class="attachment-preview">
          <img v-if="attachmentType.startsWith('image/')" :src="attachmentPreview" alt="Attachment" />
          <video v-else-if="attachmentType.startsWith('video/')" :src="attachmentPreview" controls></video>
          <div v-else class="file-icon">📄 {{ attachmentName }}</div>
          <button @click="clearAttachment" class="clear-attachment">×</button>
        </div>
        <form @submit.prevent="sendMessage">
          <label class="attach-btn" :class="{ disabled: isTyping }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            <input type="file" @change="handleFileUpload" accept="image/*,video/*,.pdf" style="display: none;" :disabled="isTyping" />
          </label>
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="Ask or attach photos/videos to analyze..." 
            :disabled="isTyping"
          />
          <button type="submit" class="send-btn" :disabled="(!newMessage.trim() && !attachedBase64) || isTyping">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { generateCoachResponse, fileToGenerativePart } from '../lib/gemini'
import { marked } from 'marked'
import TrainingPlanCard from './TrainingPlanCard.vue'
import { supabase } from '../lib/supabase'
import { calculateMatchRating, getRatingColor } from '../lib/rating'

const props = defineProps({
  matches: { type: Array, required: true },
  userName: { type: String, required: true },
  userPosition: { type: String, default: '' },
  userPreferredFoot: { type: String, default: '' },
  userClubTeam: { type: String, default: '' },
})

const newMessage = ref('')
const isTyping = ref(false)
const messages = ref([])
const messagesContainer = ref(null)
const isLoadingHistory = ref(true)

// --- Chat Persistence ---
const saveMessage = async (msg) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('ai_chat_messages').insert({
      user_id: user.id,
      role: msg.role,
      content: msg.content || '',
      match_card: msg.matchCard || null,
      calendar_days: msg.calendarDays?.length ? msg.calendarDays : null,
      time_label: msg.time || ''
    })
  } catch (e) {
    console.error('Failed to save message:', e)
  }
}

const loadHistory = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(60)
    if (error) throw error
    if (data && data.length > 0) {
      messages.value = data.map(row => ({
        role: row.role,
        content: row.content,
        matchCard: row.match_card || null,
        calendarDays: row.calendar_days || [],
        time: row.time_label || ''
      }))
      await scrollToBottom()
    }
  } catch (e) {
    console.error('Failed to load chat history:', e)
  } finally {
    isLoadingHistory.value = false
  }
}

const startNewChat = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('ai_chat_messages').delete().eq('user_id', user.id)
    messages.value = []
  } catch (e) {
    console.error('Failed to clear chat:', e)
  }
}

onMounted(() => {
  loadHistory()
})

const attachmentPreview = ref(null)
const attachmentType = ref('')
const attachmentName = ref('')
const attachedBase64 = ref('')

const sendSuggestion = (text) => {
  newMessage.value = text
  sendMessage()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  attachmentType.value = file.type
  attachmentName.value = file.name
  attachmentPreview.value = URL.createObjectURL(file)

  const reader = new FileReader()
  reader.onloadend = () => {
    attachedBase64.value = reader.result
  }
  reader.readAsDataURL(file)
}

const clearAttachment = () => {
  attachmentPreview.value = null
  attachmentType.value = ''
  attachmentName.value = ''
  attachedBase64.value = ''
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// --- Match Card Helpers ---
const getPassAcc = (match) => {
  const total = (match.successful_passes || 0) + (match.unsuccessful_passes || 0)
  return total > 0 ? Math.round(((match.successful_passes || 0) / total) * 100) : 0
}

const getResult = (match) => {
  if (match.score_for > match.score_against) return 'WIN'
  if (match.score_for < match.score_against) return 'LOSS'
  return 'DRAW'
}

const getResultClass = (match) => {
  const r = getResult(match)
  return r === 'WIN' ? 'result-win' : r === 'LOSS' ? 'result-loss' : 'result-draw'
}

const getRatingClass = (rating) => getRatingColor(rating)

const calculateRating = (match) => calculateMatchRating(match)

// --- Calendar Parsing ---
const parseCalendar = (Text) => {
  const DayPattern = /^((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day\s*\d+|Session\s*\d+)\b[^\n]*)/im
  const AllDayPattern = /^((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day\s*\d+|Session\s*\d+)\b.*?)(?=\n(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day\s*\d+|Session\s*\d+)\b|$)/gims

  const Results = []
  let Match

  const CleanText = Text.replace(/\r\n/g, '\n')

  AllDayPattern.lastIndex = 0
  while ((Match = AllDayPattern.exec(CleanText)) !== null) {
    const Block = Match[1].trim()
    const Lines = Block.split('\n').map(L => L.trim()).filter(Boolean)
    if (Lines.length === 0) continue

    const HeaderLine = Lines[0]
    const SepMatch = HeaderLine.match(/^(.*?)(?:\s*[:\u2013\u2014-]\s*)(.+)$/)
    let DayTitle, FocusTheme

    if (SepMatch) {
      DayTitle = SepMatch[1].replace(/^[#*]+\s*/, '').trim()
      FocusTheme = SepMatch[2].replace(/\*\*/g, '').trim()
    } else {
      DayTitle = HeaderLine.replace(/^[#*]+\s*/, '').trim()
      FocusTheme = 'Training'
    }

    const Drills = Lines.slice(1)
      .map(L => L.replace(/^[-*•\d.]+\s*/, '').replace(/\*\*/g, '').trim())
      .filter(L => L.length > 0)

    Results.push({ DayTitle, FocusTheme, Drills })
  }

  return Results
}

const ExpandDay = (Abbr) => {
  const Map = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }
  return Map[Abbr] || Abbr
}

// --- Send / receive ---
const sendMessage = async () => {
  if ((!newMessage.value.trim() && !attachedBase64.value) || isTyping.value) return

  const userText = newMessage.value.trim()
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  const displayContent = userText || (attachmentName.value ? `[Attached: ${attachmentName.value}]` : '')
  const userMsg = { role: 'user', content: displayContent, time: currentTime }
  messages.value.push(userMsg)
  saveMessage(userMsg)
  
  const parts = []
  if (userText) parts.push({ text: userText })
  if (attachedBase64.value) {
    parts.push(fileToGenerativePart(attachedBase64.value, attachmentType.value))
  }

  newMessage.value = ''
  clearAttachment()
  isTyping.value = true
  scrollToBottom()

  try {
    const playerProfile = {
      position: props.userPosition,
      preferredFoot: props.userPreferredFoot,
      clubTeam: props.userClubTeam,
    }

    // Build conversation history for Gemini context (last 10 exchanges)
    const recentHistory = messages.value.slice(-20)
    const geminiHistory = []
    for (const m of recentHistory) {
      if (!m.content) continue
      geminiHistory.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })
    }

    const aiResponseText = await generateCoachResponse(
      parts, props.matches, props.userName, playerProfile, geminiHistory
    )

    // Detect if the AI is talking about a specific match — attach the match card
    const lowerText = userText.toLowerCase()
    const isGameQuery = lowerText.includes('last game') || lowerText.includes('last match') ||
      lowerText.includes('analyze my game') || lowerText.includes('analyze my last') ||
      lowerText.includes('recent game') || lowerText.includes('recent match')

    let matchCard = null
    if (isGameQuery && props.matches && props.matches.length > 0) {
      const m = props.matches[0]
      matchCard = { ...m, rating: calculateRating(m) }
    }

    const IsCalendar = lowerText.includes('training plan') || lowerText.includes('calendar') ||
      lowerText.includes('training schedule') || lowerText.includes('practice') ||
      lowerText.includes('week') || lowerText.includes('session')
    const ParsedCalendar = IsCalendar ? parseCalendar(aiResponseText) : []

    // If we have a parsed plan, strip the day-by-day block from the text content
    // so it doesn't render twice (once as markdown, once as TrainingPlanCard)
    let displayContent = aiResponseText
    if (ParsedCalendar.length >= 1) {
      // Find the position of the first day heading in the raw text and cut there
      const DayHeadingPattern = /\n?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s*\d+|session\s*\d+)\s*[–—:-]/i
      const FirstDayIndex = displayContent.search(DayHeadingPattern)
      if (FirstDayIndex > 0) {
        // Keep the intro text before the calendar starts, trim trailing whitespace/newlines
        displayContent = displayContent.slice(0, FirstDayIndex).trimEnd()
      } else if (FirstDayIndex === 0) {
        // The entire response is a calendar with no intro — clear the text
        displayContent = ''
      }
    }

    isTyping.value = false
    const ResponseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const aiMsg = {
      role: 'ai',
      content: displayContent,
      matchCard,
      calendarDays: ParsedCalendar.length >= 1 ? ParsedCalendar : [],
      time: ResponseTime
    }
    messages.value.push(aiMsg)
    await saveMessage(aiMsg)
  } catch (error) {
    isTyping.value = false
    messages.value.push({ 
      role: 'ai', 
      content: "I'm having trouble connecting right now. Please try again.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  }
  
  scrollToBottom()
}
</script>

<style scoped>
.dashboard-ai-coach {
  width: 100%;
  height: 700px;
  background: rgba(15, 18, 20, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(10, 12, 14, 0.4);
}

.chat-toolbar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #888;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: rgba(255, 82, 82, 0.1);
  border-color: rgba(255, 82, 82, 0.3);
  color: #ff5252;
}

/* Removed Header and Status CSS */

/* Messages Area */
.chat-messages {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  gap: 4px;
}

.suggestions-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 24px;
}

.welcome-text {
  font-size: 2.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  background: linear-gradient(135deg, #fff 30%, #4cda9c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
}

.chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 600px;
}

.suggestion-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 10px 16px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-chip:hover {
  background: rgba(76, 218, 156, 0.15);
  border-color: #4cda9c;
  transform: translateY(-2px);
}

.message-time {
  font-size: 0.75rem;
  color: #666;
  margin: 0 4px;
}

.message-content {
  padding: 14px 18px;
  border-radius: 18px;
  font-size: 1.05rem;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  white-space: pre-wrap;
}

/* --- Match Card --- */
.match-card {
  background: rgba(15, 18, 20, 0.9);
  border: 1px solid rgba(76, 218, 156, 0.25);
  border-radius: 16px;
  padding: 20px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.match-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.match-card-date {
  font-size: 0.75rem;
  color: #666;
}

.match-card-score {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.score-num {
  font-size: 2.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.score-sep {
  font-size: 2rem;
  color: #444;
  font-weight: 300;
}

.match-card-result {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
}
.result-win  { background: rgba(76,218,156,0.15); color: #4cda9c; border: 1px solid rgba(76,218,156,0.4); }
.result-loss { background: rgba(255,82,82,0.15);  color: #ff5252; border: 1px solid rgba(255,82,82,0.4); }
.result-draw { background: rgba(255,200,0,0.12);  color: #ffc800; border: 1px solid rgba(255,200,0,0.4); }

.match-card-rating {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 10px;
}

.rating-label {
  font-size: 0.85rem;
  color: #888;
}

.rating-value {
  font-size: 1.6rem;
  font-weight: 800;
}
.rating-excellent { color: #4cda9c; }
.rating-good     { color: #81c784; }
.rating-mid      { color: #ffb74d; }
.rating-bad      { color: #e57373; }
.rating-horrible { color: #ef5350; }

/* Training Calendar */
.training-calendar {
  background: rgba(15, 18, 20, 0.9);
  border: 1px solid rgba(76, 218, 156, 0.2);
  border-radius: 16px;
  padding: 20px;
  max-width: 100%;
  margin-top: 10px;
}

.cal-header {
  font-size: 0.9rem;
  font-weight: 700;
  color: #4cda9c;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.cal-day {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-day-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #4cda9c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cal-focus {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.cal-drills {
  list-style: disc;
  padding-left: 14px;
  margin: 0;
}

.cal-drills li {
  font-size: 0.78rem;
  color: #aaa;
  line-height: 1.4;
}

.match-card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mc-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  padding: 8px 4px;
}

.mc-stat-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.mc-stat-label {
  font-size: 0.65rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ai-message {
  align-self: flex-start;
}

.ai-message .message-time {
  align-self: flex-start;
}

.ai-message .message-content {
  background: rgba(30, 32, 36, 0.95);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 4px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.ai-markdown :deep(p) {
  margin-top: 0;
  margin-bottom: 10px;
}

.ai-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-markdown :deep(ul), .ai-markdown :deep(ol) {
  margin-top: 0;
  margin-bottom: 12px;
  padding-left: 20px;
}

.ai-markdown :deep(li) {
  margin-bottom: 6px;
  line-height: 1.5;
}

.ai-markdown :deep(strong) {
  color: #4cda9c;
  font-weight: 700;
}

.ai-markdown :deep(h1), .ai-markdown :deep(h2), .ai-markdown :deep(h3) {
  color: #fff;
  font-weight: 700;
  margin-top: 12px;
  margin-bottom: 8px;
}

.ai-markdown :deep(h3) {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #4cda9c;
}

.ai-markdown :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.08);
  margin: 12px 0;
}

.ai-markdown :deep(blockquote) {
  border-left: 3px solid #4cda9c;
  padding-left: 12px;
  color: #aaa;
  margin: 8px 0;
  font-style: italic;
}

.ai-markdown :deep(code) {
  background: rgba(76,218,156,0.1);
  color: #4cda9c;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
}

.ai-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.ai-markdown :deep(th) {
  background: rgba(76,218,156,0.1);
  color: #4cda9c;
  padding: 8px 12px;
  text-align: left;
  font-weight: 700;
  border-bottom: 1px solid rgba(76,218,156,0.2);
}

.ai-markdown :deep(td) {
  padding: 7px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: #ccc;
}

.user-message {
  align-self: flex-end;
}

.user-message .message-time {
  align-self: flex-end;
}

.user-message .message-content {
  background: #4cda9c;
  color: #003822;
  border-bottom-right-radius: 4px;
  font-weight: 500;
}

/* Typing Indicator */
.typing-indicator .message-content {
  display: flex;
  gap: 6px;
  padding: 20px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #888;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Input Area */
.chat-input-area {
  padding: 24px 30px;
  background: rgba(10, 12, 14, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1e1e1e;
  padding: 8px 12px;
  border-radius: 8px;
  width: fit-content;
  position: relative;
}

.attachment-preview img, .attachment-preview video {
  max-height: 60px;
  max-width: 100px;
  border-radius: 4px;
}

.file-icon {
  font-size: 0.9rem;
  color: #aaa;
}

.clear-attachment {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
}

.clear-attachment:hover {
  color: #ff5252;
}

.chat-input-area form {
  display: flex;
  gap: 12px;
  background: #050608;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 8px 8px 8px 16px;
  transition: border-color 0.3s;
  align-items: center;
}

.attach-btn {
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.attach-btn:hover {
  color: #4cda9c;
}

.attach-btn.disabled {
  pointer-events: none;
  opacity: 0.5;
}

.chat-input-area form:focus-within {
  border-color: #4cda9c;
}

.chat-input-area input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.05rem;
  outline: none;
}

.chat-input-area input::placeholder {
  color: #666;
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: #4cda9c;
  color: #003822;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #3ab882;
}

.send-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}
</style>
