<template>
  <div class="home" ref="homeEl">
    <!-- ───────────────────────── HERO ───────────────────────── -->
    <section class="hero">
      <div class="hero__grid" aria-hidden="true"></div>
      <HeroDecor class="hero__decor" />
      <HeroWave class="hero__wave" />

      <div class="hero__content" :class="{ 'hero__content--in': mounted }">
        <span class="hero__mark" aria-hidden="true"></span>
        <h1 class="hero__title">
          <span class="hero__line">{{ hero.title }}</span>
          <span class="hero__line hero__line--outline">{{ hero.titleAccent }}</span>
        </h1>
        <p class="hero__sub">{{ hero.sub }}</p>
        <div class="hero__cta">
          <template v-if="!user">
            <router-link to="/signup" class="cta-box cta-box--solid">{{ hero.ctaPrimary }}<span class="cta-box__arrow">→</span></router-link>
            <router-link to="/login" class="cta-box cta-box--ghost">Log in</router-link>
          </template>
          <template v-else>
            <router-link to="/dashboard" class="cta-box cta-box--solid">Dashboard<span class="cta-box__arrow">→</span></router-link>
            <router-link to="/feed" class="cta-box cta-box--ghost">The Pitch</router-link>
          </template>
        </div>
      </div>

    </section>

    <!-- ──────────────────── HOW IT WORKS (3 steps) ──────────────────── -->
    <section class="section steps">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">How it works</span>
        <h2 class="section-title">Three steps to a sharper game.</h2>
      </div>
      <div class="steps__grid">
        <article v-for="s in steps" :key="s.n" class="step zoom-on-scroll">
          <span class="step__n">{{ s.n }}</span>
          <h3 class="step__title">{{ s.title }}</h3>
          <p class="step__text">{{ s.text }}</p>
        </article>
      </div>
    </section>

    <!-- ──────────────────── FEATURE CAROUSEL ──────────────────── -->
    <section class="section showcase">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">Everything you get</span>
        <h2 class="section-title">One app, end to end.</h2>
      </div>

      <div
        class="carousel zoom-on-scroll"
        data-testid="feature-carousel"
        @mouseenter="pauseAuto"
        @mouseleave="resumeAuto"
        @focusin="pauseAuto"
        @focusout="resumeAuto"
      >
        <div
          class="carousel__viewport"
          :class="{ 'is-dragging': dragging }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @pointerleave="onPointerUp"
        >
          <div class="carousel__track" :class="{ 'is-animated': !dragging }" :style="trackStyle">
            <div v-for="(f, i) in features" :key="f.key" class="slide" :aria-hidden="i !== active">
              <div class="slide__visual">
                <HeatmapCanvas v-if="f.key === 'heatmap'" :points="sampleHeat" />

                <div v-else-if="f.key === 'rating'" class="demo-card demo-rating">
                  <span class="demo-rating__value">8.40</span>
                  <span class="demo-rating__label">Excellent</span>
                  <div class="demo-rating__bar"><span :style="{ width: '84%' }"></span></div>
                </div>

                <div v-else-if="f.key === 'training'" class="demo-card demo-training">
                  <div class="demo-training__row"><span>🔥 Current streak</span><strong>6 days</strong></div>
                  <div class="demo-training__row"><span>🏅 Juggling PB</span><strong class="demo-xg__accent">120</strong></div>
                  <div class="demo-training__bar"><span :style="{ width: '78%' }"></span></div>
                  <div class="demo-training__caption">Shooting accuracy · trending ↑</div>
                </div>

                <div v-else-if="f.key === 'xg'" class="demo-card demo-xg">
                  <div class="demo-xg__row"><span>Goals</span><strong>3</strong></div>
                  <div class="demo-xg__row"><span>Expected (xG)</span><strong class="demo-xg__accent">1.34</strong></div>
                  <div class="demo-xg__verdict">+1.66 over — clinical finishing</div>
                </div>

                <div v-else-if="f.key === 'ai'" class="demo-card demo-ai">
                  <div class="demo-ai__bubble">
                    <span class="demo-ai__spark">✦</span>
                    <p>Your pass accuracy dips in the final third. Try a one-week pattern of give-and-go drills — here's a plan…</p>
                  </div>
                </div>

                <FeedCard v-else-if="f.key === 'feed'" :Match="mockMatch" :Index="0" :ShotData="mockShotData" class="demo-feed" />
              </div>

              <div class="slide__copy">
                <span class="feature__tag">{{ f.tag }}</span>
                <h3 class="feature__title">{{ f.title }}</h3>
                <p class="feature__text">{{ f.text }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="carousel__controls">
          <button class="carousel__arrow" type="button" aria-label="Previous feature" @click="prev">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div class="dots" role="tablist" aria-label="Choose a feature">
            <button
              v-for="(f, i) in features"
              :key="f.key"
              type="button"
              class="dot"
              :class="{ 'dot--active': i === active }"
              :aria-label="f.tag"
              :aria-selected="i === active"
              role="tab"
              data-testid="carousel-dot"
              @click="go(i)"
            ></button>
          </div>
          <button class="carousel__arrow" type="button" aria-label="Next feature" @click="next">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ──────────────────── BENTO GRID ──────────────────── -->
    <section class="section bento-sec">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">The whole picture</span>
        <h2 class="section-title">Your game, broken down.</h2>
      </div>

      <div class="bento" data-testid="bento-grid">
        <div
          v-for="b in bento"
          :key="b.key"
          class="bento__tile zoom-on-scroll"
          :class="{ 'bento__tile--wide': b.wide }"
        >
          <span class="bento__icon" v-html="bentoIcon(b.key)"></span>
          <h3 class="bento__title">{{ b.title }}</h3>
          <p class="bento__text">{{ b.text }}</p>
        </div>
      </div>
    </section>

    <!-- ──────────────────── CLOSING ──────────────────── -->
    <section class="section closing zoom-on-scroll">
      <h2 class="closing__title">{{ closing.title }}</h2>
      <p class="closing__sub">{{ closing.sub }}</p>
      <p class="closing__body">{{ closing.body }}</p>
      <div class="hero__cta closing__cta">
        <template v-if="!user">
          <router-link to="/signup" class="cta-box cta-box--solid">{{ hero.ctaPrimary }}<span class="cta-box__arrow">→</span></router-link>
          <router-link to="/login" class="cta-box cta-box--ghost">Log in</router-link>
        </template>
        <template v-else>
          <router-link to="/dashboard" class="cta-box cta-box--solid">Dashboard<span class="cta-box__arrow">→</span></router-link>
          <router-link to="/feed" class="cta-box cta-box--ghost">The Pitch</router-link>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import { content, loadKey } from '../lib/siteContent'
import HeroDecor from './home/HeroDecor.vue'
import HeroWave from './home/HeroWave.vue'
import HeatmapCanvas from './ui/HeatmapCanvas.vue'
import FeedCard from './ui/FeedCard.vue'

const user = ref(null)
const homeEl = ref(null)
const mounted = ref(false)

// Strip em/en dashes from copy (they read as AI-written). Numeric ranges like
// "1–10" become "1-10"; dash separators become commas. Applied to all displayed
// strings so it cleans both the defaults and any admin-saved content.
const clean = (t) => typeof t === 'string'
  ? t.replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ', ')
  : t
const cleanObj = (o) => {
  const r = {}
  for (const k in o) r[k] = clean(o[k])
  return r
}

// Editable copy (admin → site_content 'home'); falls back to baked-in defaults.
const hero = computed(() => cleanObj(content.value.home.hero || {}))
const steps = computed(() => (content.value.home.steps || []).map(cleanObj))
const features = computed(() => (content.value.home.features || []).map(cleanObj))
const bento = computed(() => (content.value.home.bento || []).map(cleanObj))
const closing = computed(() => cleanObj(content.value.home.closing || {}))

// Inline icons for the bento tiles, keyed by item.key (v-html, trusted static SVG).
const BENTO_ICONS = {
  rating: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 14.7 8.6 21 9.3 16.5 13.7 17.6 20 12 17 6.4 20 7.5 13.7 3 9.3 9.3 8.6 12 3"/></svg>',
  xg: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>',
  heatmap: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 3-1.5 4.5 0 7.5C13.8 8 14 5.6 13 4c2.4 1.3 4 4 4 7a5 5 0 1 1-10 0c0-1.6.6-3 1.6-4.2C8.8 9 9 10.5 10 11c-.8-2.5 0-6 2-9z"/></svg>',
  training: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg>',
  ai: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 5L19 9.5l-5.4 1.5L12 16l-1.6-5L5 9.5 10.4 8 12 3z"/></svg>',
  pitch: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M21 20a6 6 0 0 0-4.5-5.8"/></svg>',
  free: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><polyline points="9 12 11.5 14.5 15.5 9.5"/></svg>'
}
const bentoIcon = (k) => BENTO_ICONS[k] || BENTO_ICONS.rating

// ── Carousel ───────────────────────────────────────────────────────
const active = ref(0)
const count = computed(() => features.value.length || 1)
const AUTO_MS = 5500

let timer = null
let paused = false

const stopAuto = () => { if (timer) { clearInterval(timer); timer = null } }
const startAuto = () => {
  stopAuto()
  timer = setInterval(() => { if (!paused) active.value = (active.value + 1) % count.value }, AUTO_MS)
}
const pauseAuto = () => { paused = true }
const resumeAuto = () => { paused = false }

const go = (i) => { active.value = (i % count.value + count.value) % count.value; startAuto() }
const next = () => go(active.value + 1)
const prev = () => go(active.value - 1)

// Live drag (pointer covers mouse + touch): the track follows the cursor/finger
// in real time, then snaps to the nearest slide on release.
const dragging = ref(false)
const dragPx = ref(0)
let dragStartX = 0
let dragStartY = 0
let dragLock = false   // true once we've decided this is a horizontal drag

const trackStyle = computed(() => ({
  transform: `translateX(calc(${-active.value * 100}% + ${dragPx.value}px))`
}))

const onPointerDown = (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dragging.value = true
  dragLock = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragPx.value = 0
  pauseAuto()
}
const onPointerMove = (e) => {
  if (!dragging.value) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  // Let vertical scrolling through; only hijack once the gesture is clearly horizontal.
  if (!dragLock) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    if (Math.abs(dy) > Math.abs(dx)) { dragging.value = false; resumeAuto(); return }
    dragLock = true
  }
  dragPx.value = dx
}
const onPointerUp = () => {
  if (!dragging.value) return
  const dx = dragPx.value
  dragging.value = false
  dragLock = false
  dragPx.value = 0
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev() }
  else startAuto()   // restart autoplay clock after a tap/short drag
  resumeAuto()
}

// ── Demo data (carousel + bento visuals) ───────────────────────────
const sampleHeat = []
const cluster = (cx, cy, n, s) => { for (let i = 0; i < n; i++) sampleHeat.push({ x_pct: cx + Math.sin(i * 12.9) * s, y_pct: cy + Math.cos(i * 7.7) * s }) }
cluster(50, 52, 20, 15); cluster(46, 26, 12, 11); cluster(64, 38, 8, 9); cluster(34, 70, 8, 12)

const mockMatch = {
  id: 1, user_id: 'demo', profile: { player_name: 'Pablo Ricardo', position: 'Striker' },
  match_date: new Date().toISOString(), opponent: 'Rivals FC',
  position_played: 'Striker', score_for: 3, score_against: 1,
  my_goals: 2, assists: 1, created_chances: 2, tackles: 1,
  successful_passes: 28, unsuccessful_passes: 4, shots_on_target: 4, shots_off_target: 1
}
const mockShotData = {
  goals: [{ quadrant: 3, field_position: '78,18' }, { quadrant: 5, field_position: '52,26' }],
  shots: [{ on_target: true, quadrant: 2, field_position: '46,30' }, { on_target: false, quadrant: null, field_position: '30,42' }],
  heatmap: sampleHeat.slice(0, 12).map((p, i) => ({ x_pct: p.x_pct, y_pct: p.y_pct, event_type: i % 3 === 0 ? 'tackles' : 'successful_passes' }))
}

// ── Scroll-driven motion ───────────────────────────────────────────
// Real scroll animation (not a fade): each .zoom-on-scroll block scales up as it
// nears the viewport centre and back down as it leaves (reversing on scroll-up),
// and the whole page background shifts colour with scroll progress. Driven by JS
// + requestAnimationFrame so it works in every browser; skipped for reduced motion.
let ticking = false
let zoomEls = []
let waveEl = null              // mobile hero wave (parallax target)

// Dark background colour stops interpolated across scroll progress (0 → 1).
const BG_STOPS = [
  { p: 0,    rgb: [5, 6, 8] },      // app dark (top)
  { p: 0.35, rgb: [10, 26, 20] },   // green-black
  { p: 0.7,  rgb: [13, 18, 44] },   // navy-black
  { p: 1,    rgb: [5, 6, 8] }       // back to black (bottom)
]
const mixBg = (p) => {
  let a = BG_STOPS[0], b = BG_STOPS[BG_STOPS.length - 1]
  for (let i = 0; i < BG_STOPS.length - 1; i++) {
    if (p >= BG_STOPS[i].p && p <= BG_STOPS[i + 1].p) { a = BG_STOPS[i]; b = BG_STOPS[i + 1]; break }
  }
  const t = (p - a.p) / ((b.p - a.p) || 1)
  const ch = (i) => Math.round(a.rgb[i] + (b.rgb[i] - a.rgb[i]) * t)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

const applyScroll = () => {
  ticking = false
  const vh = window.innerHeight || 1
  for (const el of zoomEls) {
    const r = el.getBoundingClientRect()
    const center = r.top + r.height / 2
    // ramp a bit faster than viewport height so the size change is obvious
    const d = Math.min(Math.abs(center - vh / 2) / (vh * 0.7), 1)   // 0 centred → 1 far
    el.style.transform = `scale(${(1 - d * 0.24).toFixed(3)})`
    el.style.opacity = (1 - d * 0.62).toFixed(3)
  }
  const max = (document.documentElement.scrollHeight - vh) || 1
  const p = Math.min(Math.max(window.scrollY / max, 0), 1)
  homeEl.value?.style.setProperty('--home-bg', mixBg(p))

  // Mobile aurora reacts to scroll with a heavy, reversible motion (redriven
  // every frame, so it unwinds smoothly on scroll-up like the zoom sections):
  // parallax drift, zoom-in, a roll/tilt, and colour intensify (saturation +
  // brightness climb). No opacity fade — that caused a visible vanish glitch;
  // the banner scrolls out of view on its own.
  if (waveEl) {
    const y = window.scrollY
    const t = Math.min(y / 520, 1)                  // 0 at top → 1 once hero's gone
    waveEl.style.setProperty('--wave-y', (y * 0.45).toFixed(1) + 'px')
    waveEl.style.setProperty('--wave-scale', (1 + t * 0.5).toFixed(3))
    waveEl.style.setProperty('--wave-tilt', (t * -6).toFixed(2) + 'deg')
    waveEl.style.setProperty('--wave-sat', (1 + t * 0.9).toFixed(3))
    waveEl.style.setProperty('--wave-boost', (1 + t * 0.55).toFixed(3))
  }
}

const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(applyScroll) } }

const initScroll = () => {
  if (!homeEl.value) return
  zoomEls = Array.from(homeEl.value.querySelectorAll('.zoom-on-scroll'))
  waveEl = homeEl.value.querySelector('.hero__wave')
  applyScroll()
}

onMounted(async () => {
  startAuto()
  initScroll()
  // Trigger the staggered hero entrance (CSS handles the rise-in).
  requestAnimationFrame(() => { mounted.value = true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  // Re-bind after admin content loads (lists may re-render).
  loadKey('home').then(() => nextTick(initScroll))
  const { data } = await supabase.auth.getUser()
  user.value = data.user
})

onBeforeUnmount(() => {
  stopAuto()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
.home {
  /* --home-bg is updated on scroll (JS); falls back to the app gradient. */
  background: var(--home-bg, var(--app-page-bg));
  color: var(--color-text-primary);
  overflow-x: clip;
}

/* ───────────────────────── HERO ───────────────────────── */
.hero {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
}

.hero__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 70% 40%, #000 0%, transparent 80%);
  mask-image: radial-gradient(ellipse 80% 70% at 70% 40%, #000 0%, transparent 80%);
  pointer-events: none;
}

.hero__decor {
  position: absolute;
  right: 2%;
  top: 50%;
  transform: translateY(-50%);
  width: min(52vw, 560px);
  height: min(74vw, 800px);
  z-index: 1;
}

/* The animated colour wave is the mobile-only hero backdrop (top banner). */
.hero__wave { display: none; }

.hero__content {
  position: absolute;
  left: clamp(20px, 5vw, 64px);
  bottom: clamp(84px, 13vh, 130px);
  max-width: min(680px, 88%);
  z-index: 2;
}

/* Staggered hero entrance: each direct child rises + fades in once mounted.
   Default (pre-mount) state is the "from" frame; --in flips them to final. */
.hero__content > * {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.hero__content > *:nth-child(1) { transition-delay: 0.05s; }
.hero__content > *:nth-child(2) { transition-delay: 0.15s; }
.hero__content > *:nth-child(3) { transition-delay: 0.27s; }
.hero__content > *:nth-child(4) { transition-delay: 0.39s; }
.hero__content--in > * { opacity: 1; transform: translateY(0); }

/* Small editorial accent mark (ring + dot) — mobile only. */
.hero__mark { display: none; }

.hero__title {
  margin: 0;
  font-family: var(--font-family-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.98;
  font-size: clamp(2.8rem, 11vw, 7.6rem);
}

.hero__line + .hero__line { margin-top: 0.06em; }

.hero__line { display: block; }

/* Outlined second line — hollow letters stroked in the brand green */
.hero__line--outline {
  color: transparent;
  -webkit-text-stroke: 2px var(--color-accent);
  text-stroke: 2px var(--color-accent);
}

.hero__sub {
  margin: 22px 0 28px;
  max-width: 460px;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--color-text-muted);
}

/* ── CTA boxes (squared, geometric) ── */
.hero__cta { display: flex; gap: 12px; flex-wrap: wrap; }

.cta-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  min-height: 48px;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-display);
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  border: 2px solid transparent;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.cta-box--solid {
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent-deep) 40%, transparent);
}
.cta-box--solid:hover { transform: translateY(-2px); box-shadow: 0 12px 30px color-mix(in srgb, var(--color-accent-deep) 50%, transparent); }

.cta-box--ghost {
  background: transparent;
  color: var(--color-accent);
  border-color: var(--color-accent-border);
}
.cta-box--ghost:hover { background: var(--color-accent-soft); transform: translateY(-2px); }

.cta-box__arrow { font-size: 1.05rem; line-height: 1; }

/* ───────────────────── Shared section chrome ───────────────────── */
.section {
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(48px, 9vw, 110px) 20px;
}

.section-head { text-align: center; margin-bottom: clamp(28px, 5vw, 52px); }

.kicker {
  display: inline-block;
  margin-bottom: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.section-title {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.6rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  line-height: 1.05;
}

/* Scroll-driven scale + fade is applied in JS (see initScroll/applyScroll); the
   transform-origin keeps the scaling centred and will-change hints the compositor.
   Reduced-motion users get no inline styles, so blocks stay at full size. */
.zoom-on-scroll {
  transform-origin: center;
  will-change: transform, opacity;
}

/* ───────────────────── How it works ───────────────────── */
.steps__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(14px, 2.5vw, 24px);
}

.step {
  padding: clamp(20px, 3vw, 32px);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.step__n {
  display: block;
  font-family: var(--font-family-display);
  font-weight: 900;
  font-size: 2.4rem;
  line-height: 1;
  color: var(--color-accent);
  margin-bottom: 14px;
}

.step__title { margin: 0 0 10px; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.step__text { margin: 0; color: var(--color-text-muted); line-height: 1.6; }

/* ───────────────────── Carousel ───────────────────── */
.carousel { width: 100%; }

.carousel__viewport {
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface-2);
  cursor: grab;
  touch-action: pan-y;   /* allow vertical page scroll; we handle horizontal drag */
  user-select: none;
}
.carousel__viewport.is-dragging { cursor: grabbing; }

.carousel__track { display: flex; align-items: stretch; }
.carousel__track.is-animated { transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1); }

.slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: center;
  justify-items: center;
  padding: clamp(28px, 4vw, 48px) clamp(20px, 3vw, 40px);
  text-align: center;
}

.slide__visual { display: flex; justify-content: center; width: 100%; }
.slide__visual > :deep(*) { width: 100%; max-width: 300px; margin: 0 auto; }

.carousel__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: 18px;
}

.carousel__arrow {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.carousel__arrow:hover { background: var(--color-accent-soft); border-color: var(--color-accent-border); color: var(--color-accent); transform: scale(1.06); }

.dots { display: flex; justify-content: center; gap: 10px; }
.dot {
  width: 9px; height: 9px; padding: 0; border: none; border-radius: 50%;
  background: var(--color-bg-surface-3); cursor: pointer;
  transition: background 0.25s ease, width 0.25s ease, transform 0.2s ease;
}
.dot:hover { transform: scale(1.2); }
.dot--active { width: 26px; border-radius: var(--radius-pill); background: var(--color-accent); }

.feature__tag {
  display: inline-block; margin-bottom: 10px; padding: 4px 12px;
  border-radius: var(--radius-pill); background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border); color: var(--color-accent);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.feature__title { margin: 0 0 12px; font-size: clamp(1.5rem, 4vw, 2rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; line-height: 1.1; }
.feature__text { margin: 0 auto; max-width: 440px; color: var(--color-text-muted); line-height: 1.7; }

/* ── Demo cards (shared by carousel + bento) ── */
.demo-card {
  width: 100%; max-width: 320px; padding: var(--space-6);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(15, 18, 20, 0.92));
  border: 1px solid var(--color-border-subtle); border-radius: var(--radius-xl); box-shadow: var(--shadow-md);
}
.demo-rating { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.demo-rating__value { font-size: 3.4rem; font-weight: var(--font-weight-heavy); color: var(--color-rating-excellent); line-height: 1; }
.demo-rating__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-rating-excellent); }
.demo-rating__bar { width: 100%; height: 8px; margin-top: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.demo-rating__bar span { display: block; height: 100%; background: var(--color-accent); }

.demo-xg__row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle); font-size: var(--font-size-base); color: var(--color-text-secondary); }
.demo-xg__row strong { font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.demo-xg__accent { color: var(--color-accent); }
.demo-xg__verdict { margin-top: 14px; text-align: center; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-success); }

.demo-training__row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle); font-size: var(--font-size-base); color: var(--color-text-secondary); }
.demo-training__row strong { font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.demo-training__bar { height: 8px; border-radius: 999px; background: var(--color-bg-surface-3); overflow: hidden; margin-top: 14px; }
.demo-training__bar span { display: block; height: 100%; background: var(--color-accent); }
.demo-training__caption { margin-top: 10px; text-align: center; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-success); }

.demo-ai__bubble { display: flex; gap: 12px; text-align: left; }
.demo-ai__spark { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--color-accent-soft); color: var(--color-accent); font-size: 1.1rem; }
.demo-ai__bubble p { margin: 0; padding: 12px 14px; background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: 4px 16px 16px 16px; color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }
.demo-feed { max-width: 360px; }

/* ───────────────────── Bento grid ───────────────────── */
.bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  grid-auto-flow: row dense;
}

.bento__tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-height: 168px;
  padding: var(--space-6);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color 0.2s ease, background 0.2s ease;
}
.bento__tile:hover { border-color: var(--color-accent-border); background: var(--color-accent-soft); }

.bento__tile--wide { grid-column: span 2; }

.bento__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
}

.bento__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.01em;
}

.bento__text {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
  font-size: var(--font-size-sm);
}

/* ───────────────────── Closing ───────────────────── */
.closing { text-align: center; max-width: 720px; }
.closing__title { margin: 0 0 14px; font-size: clamp(1.8rem, 6vw, 2.8rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; line-height: 1.08; }
.closing__sub { margin: 0 auto 18px; max-width: 520px; color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-md); }
.closing__body { margin: 0 auto 28px; max-width: 560px; color: var(--color-text-muted); line-height: 1.8; }
.closing__cta { justify-content: center; }

/* ───────────────────── Responsive ───────────────────── */
@media (min-width: 860px) {
  .slide {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    padding: 56px 48px;
    text-align: left;
  }
  .feature__text { margin-left: 0; }
}

@media (max-width: 760px) {
  /* Phone hero: an animated colour wave across the top, then a clean editorial
     stack (title, subtitle, single button) centred in the space below it. */
  .hero {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 0 0 calc(128px + env(safe-area-inset-bottom));
  }
  .hero__grid { display: none; }       /* the wave is the backdrop now */
  .hero__decor { display: none; }      /* circle replaced by the wave */
  .hero__mark { display: none; }
  .hero__wave {
    display: block;
    flex: 0 0 auto;
    width: 100%;
    height: clamp(190px, 32vh, 290px);
  }
  .hero__content {
    position: relative;
    left: auto;
    right: auto;
    bottom: auto;
    max-width: none;
    width: 100%;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 26px;
  }
  .hero__title { font-size: clamp(2.6rem, 13vw, 3.6rem); }
  .hero__sub { margin: 18px auto 28px; max-width: 32ch; font-size: var(--font-size-base); }
  .hero__cta { justify-content: center; }
  /* Editorial keeps a single primary button; login still lives in the bottom nav. */
  .hero__cta .cta-box--ghost { display: none; }

  .steps__grid { grid-template-columns: 1fr; }
  .bento { grid-template-columns: 1fr; }
  .bento__tile,
  .bento__tile--wide { grid-column: span 1; }
  .bento__tile { min-height: 0; }
}

</style>
