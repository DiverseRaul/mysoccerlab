<template>
  <div v-if="modelValue && match" class="modal-overlay" @click.self="close">
    <div class="modal share-modal" @click.stop>
      <div class="modal-header">
        <h3>Share Match Result</h3>
        <button @click="close" class="close-btn" aria-label="Close">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Caption editor -->
        <div class="caption-block">
          <label for="share-caption" class="caption-label">Caption (optional)</label>
          <textarea
            id="share-caption"
            v-model="caption"
            class="caption-input"
            rows="2"
            maxlength="240"
            placeholder="Add a caption to ship with the share…"
          ></textarea>
          <span class="caption-counter">{{ caption.length }} / 240</span>
        </div>

        <!-- Layout variant toggle -->
        <div class="layout-toggle" role="tablist" aria-label="Card layout">
          <button
            v-for="opt in layoutOptions"
            :key="opt.value"
            type="button"
            class="layout-btn"
            :class="{ active: layout === opt.value }"
            :data-layout="opt.value"
            :aria-pressed="layout === opt.value"
            @click="layout = opt.value"
          >{{ opt.label }}</button>
        </div>

        <!-- Background preset picker -->
        <div class="share-bg-picker">
          <button
            v-for="preset in presets"
            :key="preset.value"
            type="button"
            class="share-bg-btn"
            :class="[{ active: shareBgPreset === preset.value }, `preset-${preset.value}`]"
            @click="preset.value === 'custom' ? triggerCustomBgUpload() : (shareBgPreset = preset.value)"
          >{{ preset.label }}</button>
        </div>
        <input
          ref="customBgFileInput"
          type="file"
          accept="image/*"
          class="share-bg-file"
          @change="handleCustomBgFile"
        />

        <!-- Card preview — single root, layout class swaps internal markup -->
        <div class="share-card-container" :class="`share-card-container--${layout}`">
          <div
            id="share-card"
            class="share-card"
            :class="[`bg-${shareBgPreset}`, `share-card--${layout}`]"
            :style="cardStyle"
          >
            <!-- STATS layout (default) -->
            <template v-if="layout === 'stats'">
              <div class="share-card-header">
                <div class="share-date">{{ formatDate(match.match_date) }}</div>
                <div class="share-result" :class="resultClass">{{ resultLabel }}</div>
              </div>
              <div class="share-score">
                <div class="share-team">
                  <span class="share-team-name">{{ myTeamLabel }}</span>
                  <span class="share-score-num">{{ match.score_for }}</span>
                </div>
                <div class="share-divider">-</div>
                <div class="share-team">
                  <span class="share-team-name">{{ match.opponent }}</span>
                  <span class="share-score-num">{{ match.score_against }}</span>
                </div>
              </div>
              <div class="share-stats">
                <div class="share-stat">
                  <span class="share-stat-val" :class="ratingClass">{{ rating }}</span>
                  <span class="share-stat-label">Rating</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ myGoals }}</span>
                  <span class="share-stat-label">Goals</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ match.assists || 0 }}</span>
                  <span class="share-stat-label">Assists</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ passAccuracy }}%</span>
                  <span class="share-stat-label">Pass Acc</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ match.created_chances || 0 }}</span>
                  <span class="share-stat-label">Chances</span>
                </div>
                <div class="share-stat">
                  <span class="share-stat-val">{{ match.tackles || 0 }}</span>
                  <span class="share-stat-label">Tackles</span>
                </div>
              </div>
              <div v-if="caption" class="share-caption">{{ caption }}</div>
              <div class="share-footer">{{ shareLink }}</div>
            </template>

            <!-- SCORE layout (huge, minimal) -->
            <template v-else-if="layout === 'score'">
              <div class="share-card-header">
                <div class="share-date">{{ formatDate(match.match_date) }}</div>
                <div class="share-result" :class="resultClass">{{ resultLabel }}</div>
              </div>
              <div class="score-block">
                <div class="score-block__teams">
                  <span class="score-block__team">{{ myTeamLabel }}</span>
                  <span class="score-block__vs">vs</span>
                  <span class="score-block__team">{{ match.opponent }}</span>
                </div>
                <div class="score-block__score">
                  <span class="score-block__num">{{ match.score_for }}</span>
                  <span class="score-block__sep">–</span>
                  <span class="score-block__num">{{ match.score_against }}</span>
                </div>
                <div class="score-block__rating" :class="ratingClass">
                  Rating {{ rating }}
                </div>
              </div>
              <div v-if="caption" class="share-caption">{{ caption }}</div>
              <div class="share-footer">{{ shareLink }}</div>
            </template>

            <!-- STORY layout (9:16 portrait) -->
            <template v-else>
              <div class="story-top">
                <div class="story-date">{{ formatDate(match.match_date) }}</div>
                <div class="story-result" :class="resultClass">{{ resultLabel }}</div>
              </div>
              <div class="story-vs">vs {{ match.opponent }}</div>
              <div class="story-score">
                <span class="story-num">{{ match.score_for }}</span>
                <span class="story-sep">–</span>
                <span class="story-num">{{ match.score_against }}</span>
              </div>
              <div class="story-rating" :class="ratingClass">
                <span class="story-rating-val">{{ rating }}</span>
                <span class="story-rating-lbl">Match Rating</span>
              </div>
              <div class="story-stats">
                <div v-for="s in topThreeStats" :key="s.label" class="story-stat">
                  <span class="story-stat-val">{{ s.value }}</span>
                  <span class="story-stat-lbl">{{ s.label }}</span>
                </div>
              </div>
              <div v-if="caption" class="share-caption story-caption">{{ caption }}</div>
              <div class="share-footer story-footer">{{ shareLink }}</div>
            </template>
          </div>
        </div>

        <div class="modal-buttons share-actions">
          <button
            type="button"
            class="btn share-option-btn share-option-btn--secondary"
            @click="copyAsText"
          >
            <span class="btn-icon">📋</span> {{ copyLabel }}
          </button>
          <button type="button" @click="shareNative" class="btn share-option-btn">
            <span class="btn-icon">🔗</span> Share Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import { calculateMatchRating, getRatingColor } from '../../../lib/rating'

const SHARE_LINK = 'https://mysoccerlab.inove.studio'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
  myTeamLabel: { type: String, default: 'You' },
  myGoals: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const presets = [
  { value: 'clean',   label: 'Clean' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'blue',    label: 'Blue' },
  { value: 'sunset',  label: 'Sunset' },
  { value: 'custom',  label: 'Custom' }
]

const layoutOptions = [
  { value: 'stats', label: 'Stats' },
  { value: 'score', label: 'Score' },
  { value: 'story', label: 'Story' }
]

const shareBgPreset = ref('clean')
const customShareBgUrl = ref('')
const customBgFileInput = ref(null)
const layout = ref('stats')
const caption = ref('')
const copyLabel = ref('Copy summary')

const close = () => emit('update:modelValue', false)

const shareLink = SHARE_LINK

const cardStyle = computed(() => {
  if (shareBgPreset.value !== 'custom' || !customShareBgUrl.value) return {}
  return {
    backgroundImage: `url(${customShareBgUrl.value})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})

const rating = computed(() => (props.match ? calculateMatchRating(props.match) : '0.00'))
const ratingClass = computed(() => getRatingColor(parseFloat(rating.value)))

const resultLabel = computed(() => {
  if (!props.match) return ''
  if (props.match.score_for > props.match.score_against) return 'Win'
  if (props.match.score_for < props.match.score_against) return 'Loss'
  return 'Draw'
})

const resultClass = computed(() => resultLabel.value.toLowerCase())

const passAccuracy = computed(() => {
  if (!props.match) return 0
  const succ = props.match.successful_passes || 0
  const fail = props.match.unsuccessful_passes || 0
  const total = succ + fail
  if (total === 0) return 0
  return Math.round((succ / total) * 100)
})

// Pick the 3 most relevant stats for the story layout (rating always first).
const topThreeStats = computed(() => {
  if (!props.match) return []
  const candidates = [
    { label: 'Goals',    value: props.myGoals || 0 },
    { label: 'Assists',  value: props.match.assists || 0 },
    { label: 'Tackles',  value: props.match.tackles || 0 },
    { label: 'Chances',  value: props.match.created_chances || 0 },
    { label: 'Pass Acc', value: `${passAccuracy.value}%`, sortBy: passAccuracy.value }
  ]
  // Rank by raw value desc; ties stable.
  return candidates
    .filter(s => (s.sortBy ?? Number(s.value) ?? 0) > 0)
    .sort((a, b) => (b.sortBy ?? Number(b.value) ?? 0) - (a.sortBy ?? Number(a.value) ?? 0))
    .slice(0, 3)
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const triggerCustomBgUpload = () => {
  shareBgPreset.value = 'custom'
  customBgFileInput.value?.click()
}

const handleCustomBgFile = (event) => {
  const file = event.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    customShareBgUrl.value = String(reader.result || '')
    shareBgPreset.value = 'custom'
  }
  reader.readAsDataURL(file)
}

// Plain-text summary used by both Copy and Share Image native message.
const summaryText = computed(() => {
  if (!props.match) return ''
  const lines = [
    `vs ${props.match.opponent} — ${resultLabel.value} ${props.match.score_for}–${props.match.score_against}`,
    `Rating ${rating.value} · ${props.myGoals}G ${props.match.assists || 0}A · ${(props.match.shots_on_target || 0) + (props.match.shots_off_target || 0)} shots · ${props.match.tackles || 0} tackles`
  ]
  if (caption.value.trim()) lines.push(caption.value.trim())
  lines.push('#mysoccerlab')
  return lines.join('\n')
})

const copyAsText = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText.value)
    } else {
      // Fallback: temporary textarea + execCommand
      const ta = document.createElement('textarea')
      ta.value = summaryText.value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copyLabel.value = 'Copied ✓'
    setTimeout(() => { copyLabel.value = 'Copy summary' }, 1500)
  } catch (error) {
    console.error('Copy failed:', error)
    copyLabel.value = 'Copy failed'
    setTimeout(() => { copyLabel.value = 'Copy summary' }, 1500)
  }
}

const shareNative = async () => {
  const element = document.getElementById('share-card')
  if (!element) return

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      useCORS: true,
      scale: 2
    })

    canvas.toBlob(async (blob) => {
      if (!blob || !props.match) return
      const file = new File([blob], `match-vs-${props.match.opponent}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Match vs ${props.match.opponent}`,
          text: summaryText.value
        })
      } else {
        alert('Image sharing is not supported on this device.')
      }
    }, 'image/png')
  } catch (error) {
    console.error('Error sharing image:', error)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-field);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-lg);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.share-modal { max-width: 540px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover { color: var(--color-text-primary); }

/* ── Caption editor ─────────────────────────────────────────── */
.caption-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-4);
}

.caption-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.caption-input {
  width: 100%;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: 10px 12px;
  font-family: inherit;
  font-size: var(--font-size-sm);
  resize: vertical;
  min-height: 56px;
  box-sizing: border-box;
}

.caption-input:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.caption-counter {
  font-size: 0.7rem;
  color: var(--color-text-faint);
  align-self: flex-end;
}

/* ── Layout toggle (Stats / Score / Story) ─────────────────── */
.layout-toggle {
  display: inline-flex;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 2px;
  margin-bottom: var(--space-4);
  align-self: center;
}

.layout-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;
}

.layout-btn:hover:not(.active) { color: var(--color-text-secondary); }

.layout-btn.active {
  background: var(--color-bg-surface-3);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}

.modal-body {
  display: flex;
  flex-direction: column;
}

/* ── Background preset picker ───────────────────────────────── */
.share-bg-picker {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

.share-bg-btn {
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-secondary);
  padding: 8px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  font-family: inherit;
}

.share-bg-btn:hover {
  transform: translateY(-1px);
  background: var(--color-bg-surface-3);
  border-color: var(--color-border-strong);
}

.share-bg-btn.active {
  border-color: var(--color-accent-border);
  color: var(--color-text-primary);
  box-shadow: 0 0 0 3px rgba(76, 218, 156, 0.14);
}

.share-bg-btn.preset-clean   { background-image: linear-gradient(180deg, rgba(17, 24, 39, 0.95), rgba(11, 18, 32, 0.95)); }
.share-bg-btn.preset-emerald { background-image: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(11, 18, 32, 0.75)); }
.share-bg-btn.preset-blue    { background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(11, 18, 32, 0.75)); }
.share-bg-btn.preset-sunset  { background-image: linear-gradient(135deg, rgba(244, 63, 94, 0.20), rgba(249, 115, 22, 0.16), rgba(11, 18, 32, 0.75)); }
.share-bg-btn.preset-custom  { background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.10), rgba(11, 18, 32, 0.75)); }

.share-bg-file { display: none; }

/* ── Card preview ────────────────────────────────────────────── */
.share-card-container {
  display: flex;
  justify-content: center;
  margin: var(--space-4) 0;
}

.share-card {
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

/* Story layout overrides — taller, narrower preview, 9:16 export ratio */
.share-card-container--story .share-card {
  max-width: 270px;
  aspect-ratio: 9 / 16;
  padding: 28px 22px;
  gap: var(--space-4);
}

.share-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.55;
  pointer-events: none;
}

.share-card.bg-clean {
  background:
    radial-gradient(900px 520px at 30% -20%, rgba(76, 218, 156, 0.14) 0%, rgba(76, 218, 156, 0) 62%),
    radial-gradient(820px 460px at 115% 5%, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0) 60%),
    linear-gradient(180deg, #111827 0%, #0b1220 100%);
}
.share-card.bg-clean::before {
  background:
    radial-gradient(800px 420px at 50% 15%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 65%),
    radial-gradient(900px 520px at 50% 120%, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.03) 100%);
}

.share-card.bg-emerald {
  background:
    radial-gradient(880px 540px at 25% -25%, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 60%),
    radial-gradient(740px 420px at 110% 10%, rgba(76, 218, 156, 0.12) 0%, rgba(76, 218, 156, 0) 58%),
    linear-gradient(180deg, #0b1f1a 0%, #081017 100%);
}
.share-card.bg-emerald::before {
  background:
    radial-gradient(760px 380px at 50% 12%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 68%),
    radial-gradient(900px 520px at 50% 120%, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0) 62%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.03) 100%);
}

.share-card.bg-blue {
  background:
    radial-gradient(900px 520px at 30% -20%, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 62%),
    radial-gradient(720px 420px at 115% 15%, rgba(147, 197, 253, 0.12) 0%, rgba(147, 197, 253, 0) 58%),
    linear-gradient(180deg, #0b1630 0%, #070c16 100%);
}
.share-card.bg-blue::before {
  background:
    radial-gradient(760px 380px at 50% 12%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 68%),
    radial-gradient(900px 520px at 50% 120%, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0) 62%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.03) 100%);
}

.share-card.bg-sunset {
  background:
    radial-gradient(900px 520px at 20% -25%, rgba(244, 63, 94, 0.22) 0%, rgba(244, 63, 94, 0) 62%),
    radial-gradient(820px 500px at 120% 0%, rgba(249, 115, 22, 0.20) 0%, rgba(249, 115, 22, 0) 60%),
    linear-gradient(180deg, #1f1121 0%, #080b14 100%);
}
.share-card.bg-sunset::before {
  background:
    radial-gradient(760px 380px at 50% 12%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 68%),
    radial-gradient(900px 520px at 50% 120%, rgba(0, 0, 0, 0.60) 0%, rgba(0, 0, 0, 0) 62%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.03) 100%);
}

.share-card.bg-custom { background-color: #0b1220; }
.share-card.bg-custom::before {
  opacity: 0.9;
  background:
    radial-gradient(760px 380px at 50% 12%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 58%),
    radial-gradient(1100px 760px at 50% 120%, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0) 56%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.86) 0%, rgba(0, 0, 0, 0.78) 45%, rgba(0, 0, 0, 0.86) 100%);
}
.share-card.bg-custom .share-stats {
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.share-card > * { position: relative; z-index: 1; }

/* ── Stats layout ───────────────────────────────────────────── */
.share-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.share-date {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.share-result {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-heavy);
  text-transform: uppercase;
}

.share-result.win  { color: var(--color-success); background: var(--color-success-bg); }
.share-result.loss { color: var(--color-danger);  background: var(--color-danger-bg); }
.share-result.draw { color: var(--color-neutral); background: var(--color-neutral-bg); }

.share-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-5);
}

.share-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.share-team-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.share-score-num {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.share-divider {
  font-size: var(--font-size-xl);
  color: var(--color-text-disabled);
  margin-top: 10px;
}

.share-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  background: var(--color-bg-surface-2);
  border-radius: var(--radius-md);
  padding: var(--space-5);
}

.share-stat { display: flex; flex-direction: column; align-items: center; }

.share-stat-val {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.share-stat-val.rating-world-class { color: var(--color-rating-world-class); }
.share-stat-val.rating-elite       { color: var(--color-rating-elite); }
.share-stat-val.rating-excellent   { color: var(--color-rating-excellent); }
.share-stat-val.rating-good        { color: var(--color-rating-good); }
.share-stat-val.rating-average     { color: var(--color-rating-average); }
.share-stat-val.rating-poor        { color: var(--color-rating-poor); }
.share-stat-val.rating-bad         { color: var(--color-rating-bad); }

.share-stat-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.share-caption {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-style: italic;
  text-align: center;
  line-height: 1.4;
  padding: 0 var(--space-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.share-footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 1px;
  margin-top: var(--space-2);
}

/* ── Score layout ───────────────────────────────────────────── */
.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.score-block__teams {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-block__team { font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); }
.score-block__vs   { color: var(--color-text-faint); }

.score-block__score {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  font-size: 4.5rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.score-block__sep {
  font-size: 3.2rem;
  color: var(--color-text-disabled);
  font-weight: 300;
}

.score-block__rating {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
  margin-top: var(--space-2);
}

.score-block__rating.rating-world-class { color: var(--color-rating-world-class); }
.score-block__rating.rating-elite       { color: var(--color-rating-elite); }
.score-block__rating.rating-excellent   { color: var(--color-rating-excellent); }
.score-block__rating.rating-good        { color: var(--color-rating-good); }
.score-block__rating.rating-average     { color: var(--color-rating-average); }
.score-block__rating.rating-poor        { color: var(--color-rating-poor); }
.score-block__rating.rating-bad         { color: var(--color-rating-bad); }

/* ── Story layout (9:16 portrait) ──────────────────────────── */
.share-card--story {
  justify-content: space-between;
}

.story-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.story-date {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.story-result {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.65rem;
  font-weight: var(--font-weight-heavy);
  text-transform: uppercase;
}

.story-result.win  { color: var(--color-success); background: var(--color-success-bg); }
.story-result.loss { color: var(--color-danger);  background: var(--color-danger-bg); }
.story-result.draw { color: var(--color-neutral); background: var(--color-neutral-bg); }

.story-vs {
  font-size: 1.3rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  text-align: center;
  letter-spacing: 0.3px;
}

.story-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-3);
  font-size: 3.2rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
  line-height: 1;
}

.story-sep { color: var(--color-text-disabled); font-weight: 300; font-size: 2.4rem; }

.story-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
}

.story-rating-val {
  font-size: 2.4rem;
  font-weight: var(--font-weight-heavy);
  line-height: 1;
}

.story-rating-lbl {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-muted);
}

.story-rating.rating-world-class .story-rating-val { color: var(--color-rating-world-class); }
.story-rating.rating-elite       .story-rating-val { color: var(--color-rating-elite); }
.story-rating.rating-excellent   .story-rating-val { color: var(--color-rating-excellent); }
.story-rating.rating-good        .story-rating-val { color: var(--color-rating-good); }
.story-rating.rating-average     .story-rating-val { color: var(--color-rating-average); }
.story-rating.rating-poor        .story-rating-val { color: var(--color-rating-poor); }
.story-rating.rating-bad         .story-rating-val { color: var(--color-rating-bad); }

.story-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.story-stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.story-stat-val {
  font-size: 1.1rem;
  font-weight: var(--font-weight-heavy);
  color: var(--color-text-primary);
}

.story-stat-lbl {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.story-caption {
  font-size: 0.75rem;
}

.story-footer {
  font-size: 0.7rem;
  margin-top: 0;
}

/* ── Actions ─────────────────────────────────────────────────── */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  width: 100%;
}

.btn {
  padding: 10px var(--space-5);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  background: var(--color-bg-surface-2);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.share-option-btn {
  flex: 1;
  max-width: 220px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-option-btn:hover {
  background: var(--color-bg-surface-3);
  border-color: var(--color-accent-border);
  color: var(--color-text-primary);
}

.share-option-btn--secondary {
  background: transparent;
}

.btn-icon { margin-right: 6px; }
</style>
