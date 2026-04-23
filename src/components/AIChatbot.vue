<template>
  <div class="chatbot-wrapper">
    <!-- Chat Window -->
    <div class="chat-window" :class="{ 'is-open': isOpen }">
      <button class="close-btn-absolute" @click="toggleChat">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="suggestions-container">
          <h1 class="welcome-text">Hi there</h1>
          <div class="chips-wrapper">
            <button class="suggestion-chip" @click="sendSuggestion('Analyze my last game')">📊 Analyze my last game</button>
            <button class="suggestion-chip" @click="sendSuggestion('How can I improve my passing?')">🎯 Improve my passing</button>
          </div>
        </div>
        
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
          <div v-if="msg.role === 'ai'" class="message-content ai-markdown" v-html="marked.parse(msg.content)"></div>
          <div v-else class="message-content">
            {{ msg.content }}
          </div>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            <input type="file" @change="handleFileUpload" accept="image/*,video/*,.pdf" style="display: none;" :disabled="isTyping" />
          </label>
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="Ask or attach media..." 
            :disabled="isTyping"
          />
          <button type="submit" class="send-btn" :disabled="(!newMessage.trim() && !attachedBase64) || isTyping">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button class="chat-fab" @click="toggleChat" :class="{ 'is-hidden': isOpen }">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { generateCoachResponse, fileToGenerativePart } from '../lib/gemini'
import { marked } from 'marked'
import { supabase } from '../lib/supabase'

const isOpen = ref(false)
const newMessage = ref('')
const isTyping = ref(false)
const messages = ref([])
const messagesContainer = ref(null)

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

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

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !attachedBase64.value) || isTyping.value) return

  const userText = newMessage.value.trim()
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  const displayContent = userText || (attachmentName.value ? `[Attached: ${attachmentName.value}]` : '')
  messages.value.push({ role: 'user', content: displayContent, time: currentTime })
  
  const parts = []
  if (userText) parts.push({ text: userText })
  if (attachedBase64.value) {
    parts.push(fileToGenerativePart(attachedBase64.value, attachmentType.value))
  }
  
  newMessage.value = ''
  clearAttachment()
  isTyping.value = true
  scrollToBottom()

  // Call Gemini API
  try {
    const { data: { user } } = await supabase.auth.getUser()
    let matchesData = []
    let playerName = 'Player'
    
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('player_name').eq('id', user.id).single()
      if (profile && profile.player_name) {
        playerName = profile.player_name
      } else {
        playerName = user.email ? user.email.split('@')[0] : 'Player'
      }
      
      const { data: matches } = await supabase.from('matches').select('*').eq('user_id', user.id).order('match_date', { ascending: false }).limit(10)
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id)
        const { data: goalsData } = await supabase.from('goals').select('match_id').in('match_id', matchIds)
        const goalsByMatch = (goalsData || []).reduce((acc, goal) => {
          acc[goal.match_id] = (acc[goal.match_id] || 0) + 1
          return acc
        }, {})
        matchesData = matches.map(m => ({ ...m, my_goals: goalsByMatch[m.id] || 0 }))
      }
    }

    const aiResponseText = await generateCoachResponse(parts, matchesData, playerName);
    
    isTyping.value = false
    const responseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    messages.value.push({ 
      role: 'ai', 
      content: aiResponseText,
      time: responseTime
    })
  } catch (error) {
    isTyping.value = false
    messages.value.push({ 
      role: 'ai', 
      content: "I'm having trouble connecting to my brain right now. Please try again later.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  }
  
  scrollToBottom()
}
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Floating Action Button */
.chat-fab {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: #4cda9c;
  color: #003822;
  border: none;
  box-shadow: 0 4px 20px rgba(76, 218, 156, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chat-fab:hover {
  transform: scale(1.1);
  background: #3ab882;
}

.chat-fab.is-hidden {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

/* Chat Window */
.chat-window {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 350px;
  height: 500px;
  background: rgba(15, 18, 20, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: bottom right;
}

.chat-window.is-open {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: all;
}

.close-btn-absolute {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn-absolute:hover {
  background: rgba(255,255,255,0.1);
}

/* Messages Area */
.chat-messages {
  flex: 1;
  padding: 60px 20px 20px 20px; /* Added top padding to account for absolute close btn */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  gap: 4px;
}

.suggestions-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.welcome-text {
  font-size: 1.8rem;
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
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.suggestion-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 10px 14px;
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.suggestion-chip:hover {
  background: rgba(76, 218, 156, 0.15);
  border-color: #4cda9c;
  transform: translateX(4px);
}

.message-time {
  font-size: 0.7rem;
  color: #666;
  margin: 0 4px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.5;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  white-space: pre-wrap;
}

.ai-message {
  align-self: flex-start;
}

.ai-message .message-time {
  align-self: flex-start;
}

.ai-message .message-content {
  background: #1e1e1e;
  color: #e0e0e0;
  border: 1px solid #2a2a2a;
  border-bottom-left-radius: 4px;
}

.ai-markdown :deep(p) {
  margin-top: 0;
  margin-bottom: 8px;
}

.ai-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-markdown :deep(ul), .ai-markdown :deep(ol) {
  margin-top: 0;
  margin-bottom: 8px;
  padding-left: 20px;
}

.ai-markdown :deep(li) {
  margin-bottom: 4px;
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
  gap: 4px;
  padding: 16px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
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
  padding: 16px;
  background: rgba(10, 12, 14, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e1e1e;
  padding: 6px 10px;
  border-radius: 8px;
  width: fit-content;
  position: relative;
}

.attachment-preview img, .attachment-preview video {
  max-height: 40px;
  max-width: 80px;
  border-radius: 4px;
}

.file-icon {
  font-size: 0.8rem;
  color: #aaa;
}

.clear-attachment {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  padding: 0 4px;
}

.clear-attachment:hover {
  color: #ff5252;
}

.chat-input-area form {
  display: flex;
  gap: 8px;
  background: #050608;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 4px 4px 4px 12px;
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
  font-size: 0.9rem;
  outline: none;
}

.chat-input-area input::placeholder {
  color: #666;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
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

@media (max-width: 480px) {
  .chat-window {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    transform: translateY(100%);
  }
  .chat-window.is-open {
    transform: translateY(0);
  }
  .chat-fab {
    bottom: 20px;
    right: 20px;
  }
}
</style>
