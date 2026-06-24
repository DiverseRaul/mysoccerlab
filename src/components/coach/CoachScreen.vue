<template>
  <div class="coach">
    <!-- Top bar: conversation picker (dropdown) + new chat -->
    <header class="coach__topbar">
      <div class="coach__picker">
        <button type="button" class="coach__picker-btn" :class="{ 'is-open': menuOpen }" @click="menuOpen = !menuOpen">
          <span class="coach__dot"></span>
          <span class="coach__picker-title">{{ currentTitle }}</span>
          <i class="coach__chevron ph ph-caret-down" aria-hidden="true" style="font-size:16px"></i>
        </button>

        <transition name="coach-dd">
          <div v-if="menuOpen" class="coach__dropdown">
            <button type="button" class="coach__new" @click="newConversation">
              <i class="ph ph-plus" aria-hidden="true" style="font-size:15px"></i>
              New chat
            </button>
            <div class="coach__search">
              <i class="ph ph-magnifying-glass" aria-hidden="true" style="font-size:15px"></i>
              <input v-model="search" type="text" placeholder="Search chats" @click.stop />
            </div>
            <div class="coach__dd-list">
              <div
                v-for="c in filteredConversations"
                :key="c.id"
                class="coach__chat"
                :class="{ 'is-active': c.id === activeId }"
                role="button"
                tabindex="0"
                @click="selectChat(c.id)"
                @keyup.enter="selectChat(c.id)"
              >
                <input
                  v-if="editingId === c.id"
                  v-model="editTitle"
                  class="coach__rename"
                  @click.stop
                  @keyup.enter="commitRename(c)"
                  @keyup.esc="editingId = null"
                  @blur="commitRename(c)"
                />
                <span v-else class="coach__chat-title">{{ c.title }}</span>
                <span v-if="editingId !== c.id" class="coach__chat-actions">
                  <button type="button" class="coach__chat-act" aria-label="Rename chat" @click.stop="startRename(c)">
                    <i class="ph ph-pencil-simple" aria-hidden="true" style="font-size:13px"></i>
                  </button>
                  <button type="button" class="coach__chat-act coach__chat-act--del" aria-label="Delete chat" @click.stop="removeConversation(c.id)">
                    <i class="ph ph-x" aria-hidden="true" style="font-size:13px"></i>
                  </button>
                </span>
              </div>
              <p v-if="!filteredConversations.length" class="coach__empty-list">{{ search ? 'No matches' : 'No conversations yet.' }}</p>
            </div>
            <div class="coach__dd-sep"></div>
            <button type="button" class="coach__advanced" :class="{ 'is-on': advancedMode }" @click="onAdvanced">
              <i class="ph ph-lightning" aria-hidden="true" style="font-size:15px"></i>
              Advanced
              <span v-if="!isPro" class="coach__lock">Premium</span>
              <span v-else class="coach__lock coach__lock--on">{{ advancedMode ? 'On' : 'Off' }}</span>
            </button>
          </div>
        </transition>
      </div>

      <button class="coach__icon-btn" type="button" aria-label="New chat" @click="newConversation">
        <i class="ph ph-plus" aria-hidden="true" style="font-size:20px"></i>
      </button>
    </header>

    <div v-if="menuOpen" class="coach__menu-backdrop" @click="menuOpen = false"></div>

    <!-- Messages -->
    <div class="coach__messages" ref="messagesEl">
      <div v-if="!messages.length" class="coach__welcome">
        <h2 class="coach__greeting">{{ coachContent.greeting }}{{ userName ? `, ${userName}` : '' }}?</h2>
        <div class="coach__suggestions">
          <button v-for="s in suggestions" :key="s" type="button" @click="sendSuggestion(s)">{{ s }}</button>
        </div>
      </div>

      <template v-else>
        <div v-for="(m, i) in messages" :key="i" class="coach__row" :class="m.role">
          <div v-if="m.role === 'ai'" class="coach__ai coach__markdown" v-html="render(m.content)"></div>
          <div v-else class="coach__user">{{ m.content }}</div>
          <TrainingPlanCard v-if="m.calendarDays && m.calendarDays.length" :TrainingSessions="m.calendarDays" />

          <div v-if="m.role === 'ai' && m.content" class="coach__actions">
            <button type="button" class="coach__act" :class="{ 'is-done': m.copied }" aria-label="Copy" @click="copyMessage(m)">
              <i v-if="m.copied" class="ph ph-check" aria-hidden="true" style="font-size:15px"></i>
              <i v-else class="ph ph-copy" aria-hidden="true" style="font-size:15px"></i>
            </button>
            <button v-if="i === lastAiIndex && !isTyping" type="button" class="coach__act" aria-label="Regenerate" @click="regenerate">
              <i class="ph ph-arrow-clockwise" aria-hidden="true" style="font-size:15px"></i>
            </button>
            <button type="button" class="coach__act" :class="{ 'is-on': m.feedback === 1 }" aria-label="Good response" @click="setFeedback(m, 1)">
              <i class="ph ph-thumbs-up" aria-hidden="true" style="font-size:15px"></i>
            </button>
            <button type="button" class="coach__act coach__act--down" :class="{ 'is-on': m.feedback === -1 }" aria-label="Bad response" @click="setFeedback(m, -1)">
              <i class="ph ph-thumbs-down" aria-hidden="true" style="font-size:15px"></i>
            </button>
          </div>
        </div>
        <div v-if="isTyping" class="coach__row ai">
          <div class="coach__ai coach__typing"><span></span><span></span><span></span></div>
        </div>
      </template>
    </div>

    <!-- Floating glassy composer -->
    <div class="coach__composer">
      <!-- Pro Vision: at-limit notice -->
      <p v-if="visionUnlocked && atLimit" class="coach__vision-note">
        You’ve used all {{ MONTHLY_LIMIT }} Pro Vision uploads this month. They reset on the 1st.
      </p>
      <div v-if="attachmentPreview" class="coach__attach-preview">
        <img v-if="attachmentType.startsWith('image/')" :src="attachmentPreview" alt="Attachment" />
        <video v-else-if="attachmentType.startsWith('video/')" :src="attachmentPreview" controls></video>
        <span v-else class="coach__attach-file">📄 {{ attachmentName }}</span>
        <button type="button" class="coach__attach-clear" @click="clearAttachment">×</button>
      </div>
      <form class="coach__form" @submit.prevent="sendMessage">
        <!-- Free: attach is a Pro upsell. Pro: real file picker, metered & capped. -->
        <button
          v-if="!visionUnlocked"
          type="button"
          class="coach__attach-btn coach__attach-btn--locked"
          aria-label="Attach media with Lab Pro"
          @click="goPremium"
        >
          <i class="ph ph-paperclip" aria-hidden="true" style="font-size:20px"></i>
          <span class="coach__attach-pro">PRO</span>
        </button>
        <button
          v-else-if="atLimit"
          type="button"
          class="coach__attach-btn is-disabled"
          aria-label="Monthly upload limit reached"
          disabled
        >
          <i class="ph ph-paperclip" aria-hidden="true" style="font-size:20px"></i>
        </button>
        <label v-else class="coach__attach-btn" :class="{ 'is-disabled': isTyping }" aria-label="Attach a photo or video" :title="`${mediaUsed}/${MONTHLY_LIMIT} Pro Vision uploads this month`">
          <i class="ph ph-paperclip" aria-hidden="true" style="font-size:20px"></i>
          <input type="file" accept="image/*,video/*,.pdf" :disabled="isTyping" style="display:none" @change="handleFileUpload" />
        </label>
        <span v-if="visionUnlocked && !atLimit && mediaUsed > 0" class="coach__vision-meter">{{ mediaUsed }}/{{ MONTHLY_LIMIT }}</span>
        <textarea
          ref="inputEl"
          v-model="newMessage"
          class="coach__input"
          rows="1"
          placeholder="Message your coach…"
          :disabled="isTyping"
          @input="autoGrow"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button v-if="!isTyping" type="submit" class="coach__send" :disabled="!newMessage.trim() && !attachedBase64" aria-label="Send">
          <i class="ph ph-paper-plane-right" aria-hidden="true" style="font-size:20px"></i>
        </button>
        <button v-else type="button" class="coach__send coach__send--stop" aria-label="Stop generating" @click="stop">
          <i class="ph-fill ph-stop" aria-hidden="true" style="font-size:16px"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { isPro } from '../../lib/premium'
import { content, loadKey } from '../../lib/siteContent'
import { getUsage, incrementUsage, MONTHLY_LIMIT } from '../../lib/proVision'
import { ResolveSession } from '../../lib/authSession'
import { marked } from 'marked'
import { supabase } from '../../lib/supabase'
import { selectByIds } from '../../lib/queryBatch'
import { generateCoachResponse, fileToGenerativePart } from '../../lib/gemini'
import { practiceCoachSummary } from '../../lib/practiceFormat'
import { parseCalendar } from '../../lib/trainingPlan'
import {
  fetchConversations, createConversation, renameConversation, touchConversation,
  deleteConversation, fetchMessages, insertMessage, deleteMessage, setMessageFeedback, deriveTitle
} from '../../lib/coachChats'

// Sent (not displayed) with every turn. Free/standard keeps replies tight;
// Lab Pro "Advanced" mode swaps in a depth directive.
const BREVITY_HINT = 'Keep it focused but useful: up to ~5-6 short bullets or two short paragraphs, and end with one concrete, specific tip I can act on. Skip preamble and sign-offs. Only produce a full training plan/calendar if I explicitly asked for one in this message.'
const DEPTH_HINT = 'Go in depth: give a thorough, well-structured tactical breakdown with concrete specifics and reasoning. If I attached an image or video, analyze it in detail. If I asked about training, build a full multi-week periodized plan.'
import TrainingPlanCard from '../TrainingPlanCard.vue'

const props = defineProps({
  // Lets a harness render the screen without an auth redirect / server loads.
  previewMode: { type: Boolean, default: false }
})

const router = useRouter()

const userId = ref(null)
const userName = ref('')
const userProfile = ref({ position: '', preferredFoot: '', clubTeam: '' })
const matches = ref([])
const practice = ref([])

const conversations = ref([])
const activeId = ref(null)
const messages = ref([])
const menuOpen = ref(false)
const advancedMode = ref(false)

// Pro Vision — gated media uploads with a soft monthly cap.
const mediaUsed = ref(0)
const visionUnlocked = computed(() => props.previewMode || isPro.value)
const atLimit = computed(() => mediaUsed.value >= MONTHLY_LIMIT)
const goPremium = () => { router.push('/premium') }
const search = ref('')
const editingId = ref(null)
const editTitle = ref('')
let abortCtrl = null

const currentTitle = computed(() => {
  const c = conversations.value.find((x) => x.id === activeId.value)
  return c ? c.title : 'AI Coach'
})

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter((c) => (c.title || '').toLowerCase().includes(q))
})

// Index of the last message, but only when it's an AI reply (regen target).
const lastAiIndex = computed(() => {
  const arr = messages.value
  return arr.length && arr[arr.length - 1].role === 'ai' ? arr.length - 1 : -1
})

// Lab Pro: real Advanced (deep) mode. Free users get routed to the upsell.
const onAdvanced = () => {
  menuOpen.value = false
  if (!isPro.value) { router.push('/premium'); return }
  advancedMode.value = !advancedMode.value
}

// ── Rename ─────────────────────────────────────────────────────────
const startRename = async (c) => {
  editingId.value = c.id
  editTitle.value = c.title
  await nextTick()
  const el = document.querySelector('.coach__rename')
  if (el) { el.focus(); el.select() }
}

const commitRename = async (c) => {
  if (editingId.value !== c.id) return
  const title = editTitle.value.trim()
  editingId.value = null
  if (!title || title === c.title) return
  c.title = title
  if (!props.previewMode) await renameConversation(c.id, title)
}

// ── Message actions ────────────────────────────────────────────────
const copyMessage = async (m) => {
  try {
    await navigator.clipboard.writeText(m.content || '')
    m.copied = true
    setTimeout(() => { m.copied = false }, 1500)
  } catch { /* clipboard unavailable */ }
}

const setFeedback = (m, val) => {
  m.feedback = m.feedback === val ? 0 : val
  if (!props.previewMode && m.id != null) setMessageFeedback(m.id, m.feedback)
}

const stop = () => { if (abortCtrl) abortCtrl.abort() }

const regenerate = async () => {
  const idx = lastAiIndex.value
  if (idx < 1 || isTyping.value) return
  const aiMsg = messages.value[idx]
  const userMsg = messages.value[idx - 1]
  if (!userMsg || userMsg.role !== 'user') return
  if (!props.previewMode && aiMsg.id != null) await deleteMessage(aiMsg.id)
  messages.value.splice(idx, 1)
  scrollToBottom()
  await runAssistant([{ text: userMsg.content || '' }], userMsg.content || '')
}

const newMessage = ref('')
const isTyping = ref(false)
const messagesEl = ref(null)
const inputEl = ref(null)

// Grow the composer textarea with its content (capped), Gemini-style.
const autoGrow = () => {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}
const resetInputHeight = () => { if (inputEl.value) inputEl.value.style.height = 'auto' }

const attachmentPreview = ref(null)
const attachmentType = ref('')
const attachmentName = ref('')
const attachedBase64 = ref('')

// Editable copy (admin → site_content 'coach'); falls back to baked-in defaults.
const coachContent = computed(() => content.value.coach)
const suggestions = computed(() => coachContent.value.suggestions)

const render = (text) => marked.parse(text || '')

// ── Conversation management ────────────────────────────────────────
const newConversation = async () => {
  menuOpen.value = false
  if (props.previewMode) {
    const c = { id: 'p' + Date.now(), title: 'New chat' }
    conversations.value.unshift(c)
    activeId.value = c.id
    messages.value = []
    return
  }
  const c = await createConversation(userId.value)
  if (!c) return
  conversations.value.unshift(c)
  activeId.value = c.id
  messages.value = []
}

const selectChat = async (id) => {
  activeId.value = id
  menuOpen.value = false
  messages.value = props.previewMode ? (previewMessages[id] || []) : await fetchMessages(id)
  scrollToBottom()
}

const removeConversation = async (id) => {
  if (!props.previewMode) await deleteConversation(id)
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (activeId.value === id) {
    if (!conversations.value.length) await newConversation()
    else await selectChat(conversations.value[0].id)
  }
}

// Move the active conversation to the top of the list (most-recent first).
const bumpActiveToTop = () => {
  const idx = conversations.value.findIndex((c) => c.id === activeId.value)
  if (idx > 0) conversations.value.unshift(conversations.value.splice(idx, 1)[0])
}

// ── Attachments ────────────────────────────────────────────────────
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  attachmentType.value = file.type
  attachmentName.value = file.name
  attachmentPreview.value = URL.createObjectURL(file)
  const reader = new FileReader()
  reader.onloadend = () => { attachedBase64.value = reader.result }
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
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

const sendSuggestion = (text) => {
  newMessage.value = text
  sendMessage()
}

// Training-plan parsing lives in src/lib/trainingPlan.js (shared with the
// Weekly Plan tab); see `import { parseCalendar }` above.

// ── Send / receive ─────────────────────────────────────────────────
// Shared assistant call. `parts` is the new turn; `promptText` is used only to
// detect training-plan requests. History is everything BEFORE the latest turn.
const runAssistant = async (parts, promptText) => {
  isTyping.value = true
  abortCtrl = new AbortController()
  scrollToBottom()
  try {
    const history = messages.value
      .slice(0, messages.value.length - 1)
      .slice(-20)
      .filter((m) => m.content)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))

    const sendParts = [...parts, { text: advancedMode.value && isPro.value ? DEPTH_HINT : BREVITY_HINT }]
    const responseText = await generateCoachResponse(
      sendParts, matches.value, userName.value, userProfile.value, history, abortCtrl.signal, practice.value
    )

    const lower = (promptText || '').toLowerCase()
    const isPlan = /training plan|calendar|schedule|week|session|practice/.test(lower)
    const plan = isPlan ? parseCalendar(responseText) : []

    let content = responseText
    if (plan.length >= 1) {
      const idx = content.search(/\n?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s*\d+|session\s*\d+)\s*[–—:-]/i)
      if (idx > 0) content = content.slice(0, idx).trimEnd()
      else if (idx === 0) content = ''
    }

    isTyping.value = false
    const aiMsg = {
      role: 'ai',
      content,
      calendarDays: plan.length >= 1 ? plan : [],
      feedback: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    messages.value.push(aiMsg)
    if (!props.previewMode) {
      aiMsg.id = await insertMessage(activeId.value, userId.value, aiMsg)
      await touchConversation(activeId.value)
    }
  } catch (e) {
    isTyping.value = false
    if (e && e.name === 'AbortError') return // user pressed Stop — leave the chat as-is
    const errMsg = {
      role: 'ai',
      content: "I'm having trouble connecting right now. Please try again.",
      feedback: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    messages.value.push(errMsg)
    if (!props.previewMode) errMsg.id = await insertMessage(activeId.value, userId.value, errMsg)
  } finally {
    abortCtrl = null
    scrollToBottom()
  }
}

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !attachedBase64.value) || isTyping.value) return
  if (!activeId.value) await newConversation()

  const userText = newMessage.value.trim()
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const display = userText || (attachmentName.value ? `[Attached: ${attachmentName.value}]` : '')

  const userMsg = { role: 'user', content: display, time }
  messages.value.push(userMsg)

  const convo = conversations.value.find((c) => c.id === activeId.value)
  const isFirst = convo && convo.title === 'New chat'

  const parts = []
  if (userText) parts.push({ text: userText })
  const hadMedia = !!attachedBase64.value
  if (hadMedia) parts.push(fileToGenerativePart(attachedBase64.value, attachmentType.value))

  newMessage.value = ''
  clearAttachment()
  resetInputHeight()

  // Pro Vision: count this upload against the monthly cap.
  if (hadMedia) {
    mediaUsed.value += 1
    if (!props.previewMode && userId.value) incrementUsage(userId.value)
  }

  if (!props.previewMode) {
    userMsg.id = await insertMessage(activeId.value, userId.value, userMsg)
    if (isFirst) {
      const title = deriveTitle(messages.value)
      if (convo) convo.title = title
      await renameConversation(activeId.value, title)
    } else {
      await touchConversation(activeId.value)
    }
  } else if (isFirst && convo) {
    convo.title = deriveTitle(messages.value)
  }
  bumpActiveToTop()

  await runAssistant(parts, userText)
}

// ── Data load ──────────────────────────────────────────────────────
const loadMatches = async (uid) => {
  const { data: rows } = await supabase
    .from('matches').select('*').eq('user_id', uid).order('match_date', { ascending: false })
  if (!rows || !rows.length) { matches.value = []; return }
  const ids = rows.map((m) => m.id)
  const [goalsRes, shotsRes] = await Promise.all([
    selectByIds('goals', 'match_id', ids),
    selectByIds('shots', 'match_id, on_target', ids)
  ])
  const goalCount = {}
  for (const g of goalsRes.data || []) goalCount[g.match_id] = (goalCount[g.match_id] || 0) + 1
  const onCount = {}, offCount = {}
  for (const s of shotsRes.data || []) {
    if (s.on_target) onCount[s.match_id] = (onCount[s.match_id] || 0) + 1
    else offCount[s.match_id] = (offCount[s.match_id] || 0) + 1
  }
  matches.value = rows.map((m) => ({
    ...m,
    my_goals: goalCount[m.id] || 0,
    shots_on_target: onCount[m.id] || 0,
    shots_off_target: offCount[m.id] || 0
  }))
}

// Practice drills + sessions, summarised so the coach can advise on training
// even for a player with zero matches.
const loadPractice = async (uid) => {
  const { data: drills } = await supabase
    .from('practice_drills').select('*').eq('user_id', uid).eq('archived', false)
  if (!drills || !drills.length) { practice.value = []; return }
  const drillIds = drills.map((d) => d.id)
  const { data: sessions } = await supabase
    .from('practice_sessions').select('*').in('drill_id', drillIds)
    .order('session_date', { ascending: true })
  practice.value = practiceCoachSummary(drills, sessions || [])
}

// Mock data for the preview harness (no auth / no Supabase).
const previewMessages = {
  p1: [
    { role: 'user', content: 'Analyze my last match', time: '10:02' },
    { role: 'ai', content: 'Strong outing. **Two goals** and a 0.84 xG overperformance — clinical finishing.\n\n- Your **pass accuracy (88%)** held up under pressure\n- Defensively quiet (1 tackle) — expected for a striker\n\nNext focus: dropping deeper to link play.', time: '10:02' }
  ],
  p2: [{ role: 'user', content: 'How can I improve my passing?', time: '09:30' }]
}

onMounted(async () => {
  loadKey('coach')
  if (props.previewMode) {
    conversations.value = [
      { id: 'p1', title: 'Analyze my last match' },
      { id: 'p2', title: 'How can I improve my passing?' }
    ]
    activeId.value = 'p1'
    messages.value = previewMessages.p1
    userName.value = 'Player'
    mediaUsed.value = 4
    return
  }

  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  const user = session.user
  userId.value = user.id

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('player_name, position, preferred_foot, club_team')
    .eq('user_id', user.id)
    .single()
  if (profile) {
    userName.value = profile.player_name || (user.email ? user.email.split('@')[0] : 'Player')
    userProfile.value = {
      position: profile.position || '',
      preferredFoot: profile.preferred_foot || '',
      clubTeam: profile.club_team || ''
    }
  }

  conversations.value = await fetchConversations(user.id)
  if (!conversations.value.length) await newConversation()
  else await selectChat(conversations.value[0].id)

  await Promise.all([loadMatches(user.id), loadPractice(user.id)])
  if (isPro.value) mediaUsed.value = await getUsage(user.id)
  scrollToBottom()
})
</script>

<style scoped>
.coach {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--app-page-bg);
  color: var(--color-text-primary);
  overflow: hidden;
}

/* ── Top bar + conversation dropdown ──────────────────────────── */
.coach__topbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
}

.coach__picker { position: relative; }

.coach__picker-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.coach__picker-btn:hover { background: var(--color-bg-surface-2); }

.coach__dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.coach__picker-title {
  max-width: 48vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coach__chevron { color: var(--color-text-muted); transition: transform 0.2s ease; }
.coach__picker-btn.is-open .coach__chevron { transform: rotate(180deg); }

.coach__icon-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.coach__icon-btn:hover { background: var(--color-bg-surface-2); color: var(--color-text-primary); }

.coach__menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
}

.coach__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 60;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
  background: rgba(16, 19, 23, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.coach-dd-enter-active, .coach-dd-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.coach-dd-enter-from, .coach-dd-leave-to { opacity: 0; transform: translateY(-6px); }

.coach__new {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-accent-border);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.coach__new:hover { background: var(--color-accent-border); }

.coach__dd-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
  margin-top: var(--space-2);
}

.coach__dd-sep { height: 1px; background: var(--color-border-subtle); margin: var(--space-2) 0; }

.coach__chat {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.coach__chat:hover { background: var(--color-bg-surface-2); color: var(--color-text-secondary); }
.coach__chat.is-active { background: var(--color-bg-surface-3); color: var(--color-text-primary); }

.coach__chat-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coach__chat-actions {
  flex: 0 0 auto;
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.coach__chat:hover .coach__chat-actions,
.coach__chat.is-active .coach__chat-actions { opacity: 1; }

.coach__chat-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-faint);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.coach__chat-act:hover { background: var(--color-bg-surface-3); color: var(--color-text-secondary); }
.coach__chat-act--del:hover { color: var(--color-danger); }

.coach__rename {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  outline: none;
}

.coach__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: var(--space-2);
  padding: 7px 10px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}
.coach__search input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
}
.coach__search input::placeholder { color: var(--color-text-faint); }

@media (hover: none) {
  .coach__chat-actions { opacity: 1; }
}

.coach__empty-list {
  margin: var(--space-2) 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}

.coach__advanced {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.coach__advanced:hover { background: var(--color-warning-bg); color: var(--color-warning); }
.coach__advanced.is-on { color: var(--color-accent); }
.coach__advanced.is-on:hover { background: var(--color-accent-soft); color: var(--color-accent); }

.coach__lock--on {
  background: var(--color-accent-soft) !important;
  color: var(--color-accent) !important;
}

.coach__lock {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 0.62rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Messages ─────────────────────────────────────────────────── */
.coach__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-6) var(--space-5) 130px; /* room for the floating composer */
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Clean, minimal empty state — greeting + a few suggestions, nothing else. */
.coach__welcome {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-5);
  max-width: 560px;
}
.coach__greeting {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
}
.coach__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.coach__suggestions button {
  padding: 10px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-soft);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.coach__suggestions button:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

/* Clean chat: user in a subtle pill (right), AI as plain text (left). */
.coach__row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}
.coach__row.user { align-items: flex-end; }

.coach__user {
  max-width: 80%;
  padding: 13px 18px;
  border-radius: var(--radius-xl);
  background: #2a2c2f;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.5;
  white-space: pre-wrap;
}

.coach__ai {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.7;
}

/* AI message action row (copy / regenerate / feedback) */
.coach__actions {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}
.coach__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-faint);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.coach__act:hover { background: var(--color-bg-surface-2); color: var(--color-text-secondary); }
.coach__act.is-done,
.coach__act.is-on { color: var(--color-accent); }
.coach__act--down.is-on { color: var(--color-danger); }

.coach__typing { display: inline-flex; gap: 6px; align-items: center; padding: 4px 0; }
.coach__typing span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-text-faint);
  animation: coach-bounce 1.4s infinite ease-in-out both;
}
.coach__typing span:nth-child(1) { animation-delay: -0.32s; }
.coach__typing span:nth-child(2) { animation-delay: -0.16s; }
@keyframes coach-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

/* Markdown */
.coach__markdown :deep(p) { margin: 0 0 10px; }
.coach__markdown :deep(p:last-child) { margin-bottom: 0; }
.coach__markdown :deep(ul) { list-style: none; margin: 0 0 12px; padding-left: 4px; }
.coach__markdown :deep(ol) { margin: 0 0 12px; padding-left: 22px; }
.coach__markdown :deep(ul li) { position: relative; padding-left: 22px; margin-bottom: 8px; }
.coach__markdown :deep(ul li::before) {
  content: '';
  position: absolute;
  left: 4px;
  top: 0.62em;
  width: 5px;
  height: 5px;
  border: 1.5px solid var(--color-text-faint);
  border-radius: 50%;
}
.coach__markdown :deep(ol li) { margin-bottom: 8px; }
.coach__markdown :deep(strong) { color: var(--color-text-primary); font-weight: var(--font-weight-bold); }
.coach__markdown :deep(h1), .coach__markdown :deep(h2), .coach__markdown :deep(h3) {
  color: var(--color-text-primary); font-size: var(--font-size-md); margin: 14px 0 8px;
}
.coach__markdown :deep(code) {
  background: var(--color-accent-soft); color: var(--color-accent);
  border-radius: 4px; padding: 2px 6px; font-size: 0.9em;
}
.coach__markdown :deep(a) { color: var(--color-accent); }

/* ── Floating glassy composer ─────────────────────────────────── */
.coach__composer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 28px var(--space-5) 20px;
  /* Fade messages out behind the floating bar. */
  background: linear-gradient(to top, var(--color-bg-page) 35%, transparent);
  pointer-events: none;
}
.coach__composer > * { pointer-events: auto; }

.coach__attach-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(20, 24, 28, 0.85);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  width: fit-content;
}
.coach__attach-preview img, .coach__attach-preview video { max-height: 56px; max-width: 96px; border-radius: var(--radius-sm); }
.coach__attach-file { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.coach__attach-clear { background: none; border: none; color: var(--color-text-muted); font-size: 1.2rem; cursor: pointer; }
.coach__attach-clear:hover { color: var(--color-danger); }

.coach__form {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  max-width: 720px;
  padding: 8px 8px 8px 16px;
  background: rgba(22, 26, 30, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-lg);
  transition: border-color 0.2s ease;
}
.coach__form:focus-within { border-color: var(--color-accent-border); }

.coach__attach-btn {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}
.coach__attach-btn:hover { color: var(--color-accent); }
.coach__attach-btn.is-disabled { opacity: 0.5; pointer-events: none; }

/* Button variants share the icon-only look of the label. */
button.coach__attach-btn {
  position: relative;
  border: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
}
.coach__attach-btn--locked { color: var(--color-text-faint); }
.coach__attach-btn--locked:hover { color: var(--color-warning); }
.coach__attach-pro {
  position: absolute;
  top: -7px;
  right: -10px;
  padding: 1px 4px;
  border-radius: var(--radius-pill);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 0.5rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: 0.04em;
  line-height: 1.4;
}

.coach__vision-meter {
  flex: 0 0 auto;
  align-self: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-faint);
  font-variant-numeric: tabular-nums;
}

.coach__vision-note {
  margin: 0;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: var(--font-size-xs);
  text-align: center;
  max-width: 720px;
}

.coach__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  /* textarea specifics */
  resize: none;
  line-height: 1.5;
  max-height: 160px;
  padding: 6px 0;
  overflow-y: auto;
}
.coach__input::placeholder { color: var(--color-text-faint); }

.coach__send {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: var(--color-accent);
  color: var(--color-on-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
}
.coach__send:hover:not(:disabled) { background: var(--color-brand-fg); }
.coach__send:disabled { background: var(--color-bg-surface-3); color: var(--color-text-faint); cursor: not-allowed; }

.coach__send--stop { background: var(--color-bg-surface-3); color: var(--color-text-primary); }
.coach__send--stop:hover { background: var(--color-bg-surface-2); }

/* ── Premium modal ────────────────────────────────────────────── */
.coach__modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.coach__modal {
  width: 100%;
  max-width: 380px;
  padding: var(--space-7) var(--space-6);
  text-align: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
.coach__modal-icon { font-size: 2rem; }
.coach__modal h3 { margin: var(--space-3) 0 var(--space-2); font-size: var(--font-size-lg); }
.coach__modal p { margin: 0 0 var(--space-5); color: var(--color-text-muted); line-height: 1.6; }
.coach__modal-btn {
  padding: 10px 24px;
  border-radius: var(--radius-pill);
  border: none;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--font-weight-bold);
  font-family: inherit;
  cursor: pointer;
}

/* ── Mobile ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .coach__messages { padding: var(--space-4) var(--space-4) 120px; }
  .coach__composer { padding: 24px var(--space-4) 16px; }
  .coach__dropdown { width: min(300px, 86vw); }
  .coach__picker-title { max-width: 56vw; }
}
</style>
