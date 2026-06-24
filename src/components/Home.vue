<template>
  <div class="home" ref="homeEl">
    <!-- Cloud + dots live in ONE fixed layer: full behind the hero, then fade to
         faint and stay fixed for the rest of the page. -->
    <div class="home__fx" aria-hidden="true">
      <HeroShader class="hero__shader" :variant="shaderVariant" :fade="heroFade" />
      <FallingPattern class="hero__falling" />
    </div>

    <!-- ───── HERO — pinned; exit animation scrubs in place on scroll ───── -->
    <section class="hero-pin" ref="heroPin">
      <div class="hero">
        <div class="hero__scrim" aria-hidden="true"></div>

        <div class="hero__content" :class="{ 'hero__content--in': mounted }">
          <span class="hero__mark" aria-hidden="true"></span>
          <h1 class="hero__title">
            <span class="hero__line">{{ hero.title }}</span>
            <span class="hero__line hero__line--outline">
              <span class="hero__cycle" :class="wordFx" :key="wordIdx">
                <span v-for="(ch, ci) in chars" :key="ci" class="hero__char" :style="{ '--ci': ci }">{{ ch }}</span>
              </span>
            </span>
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
      </div>
    </section>

    <!-- ──────── HOW IT WORKS — short, scroll-scrubbed step deck ──────── -->
    <section class="steps-pin" ref="stepsPin" :style="{ height: (steps.length - 1) * 70 + 110 + 'svh' }">
      <div class="steps-stage">
        <div class="steps-head">
          <span class="kicker">How it works</span>
          <h2 class="section-title">Three steps to a sharper game.</h2>
        </div>

        <!-- Progress rail: one segment per step, fills as you scroll through. -->
        <div class="steps-rail" aria-hidden="true">
          <span
            v-for="(s, i) in steps"
            :key="s.n"
            class="steps-rail__seg"
            :class="{ 'is-done': i < stepActive, 'is-active': i === stepActive }"
          ></span>
        </div>

        <!-- Each step rises from the bottom as you scroll (transforms set in
             applyScroll); upcoming steps wait below, past steps lift away. -->
        <div class="steps-deck">
          <article
            v-for="(s, i) in steps"
            :key="s.n"
            class="hstep"
            :class="{ 'hstep--active': i === stepActive }"
          >
            <span class="hstep__glow" aria-hidden="true"></span>
            <span class="hstep__n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="hstep__icon" v-html="stepIcon(i)"></span>
            <h3 class="hstep__title">{{ s.title }}</h3>
            <p class="hstep__text">{{ s.text }}</p>
          </article>
        </div>

        <!-- Scroll cue — shows on the first step so users know to keep scrolling. -->
        <div class="steps-hint" :class="{ 'is-hidden': stepActive > 0 }" aria-hidden="true">
          <span>Scroll</span>
          <i class="ph ph-caret-down" style="font-size:18px" aria-hidden="true"></i>
        </div>
      </div>
    </section>

    <!-- ─────────── FEATURE SHOWCASE — pinned, slides on scroll ─────────── -->
    <section class="showcase-pin" ref="showcasePin" :style="{ height: features.length * 58 + 70 + 'svh' }">
      <div class="showcase-stage" data-testid="feature-carousel">
        <div class="showcase-head">
          <span class="kicker">Everything you get</span>
          <h2 class="section-title">One app, end to end.</h2>
          <p class="showcase-lead">Match logging, honest ratings, xG, heatmaps and an AI coach — every part of your game, in one place. Scroll the stack.</p>
        </div>

        <div class="fstack">
          <article
            v-for="(f, i) in features"
            :key="f.key"
            class="fcard"
            :class="{ 'fcard--active': i === active }"
          >
            <div class="fcard__visual">
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

            <div class="fcard__copy">
              <span class="feature__tag">{{ f.tag }}</span>
              <h3 class="feature__title">{{ f.title }}</h3>
              <p class="feature__text">{{ f.text }}</p>
            </div>
          </article>
        </div>

        <div class="carousel__controls">
          <button class="carousel__arrow" type="button" aria-label="Previous feature" @click="prev">
            <i class="ph ph-caret-left" style="font-size:22px" aria-hidden="true"></i>
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
            <i class="ph ph-caret-right" style="font-size:22px" aria-hidden="true"></i>
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
import HeroShader from './home/HeroShader.vue'
import FallingPattern from './home/FallingPattern.vue'
import HeatmapCanvas from './ui/HeatmapCanvas.vue'
import FeedCard from './ui/FeedCard.vue'

const user = ref(null)
const homeEl = ref(null)
const mounted = ref(false)

// The hero shader switches behaviour by device: vertical aurora curtains on
// phones, a broad diagonal drift on desktop. Tracked live so it flips on
// rotate/resize across the breakpoint.
const shaderVariant = ref('desktop')
const heroFade = ref(0)   // 0 = full clouds (hero); 1 = thinned out (scrolled away)

// Hero accent word cycles through synonyms, each switch using a fresh (random,
// non-repeating) entrance animation.
const words = ['Measured.', 'Tracked.', 'Analysed.', 'Mapped.', 'Decoded.', 'Rated.']
const WORD_FX = ['cx-rise', 'cx-fall', 'cx-flip', 'cx-zoom', 'cx-blur']
const wordIdx = ref(0)
const wordFx = ref('')
const chars = computed(() => (words[wordIdx.value] || '').split(''))
let wordTimer = null

let mql = null
const syncVariant = () => { shaderVariant.value = mql && mql.matches ? 'mobile' : 'desktop' }

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
  rating: '<i class="ph ph-star" style="font-size:26px"></i>',
  xg: '<i class="ph ph-target" style="font-size:26px"></i>',
  heatmap: '<i class="ph ph-flame" style="font-size:26px"></i>',
  training: '<i class="ph ph-chart-line-up" style="font-size:26px"></i>',
  ai: '<i class="ph ph-sparkle" style="font-size:26px"></i>',
  pitch: '<i class="ph ph-users-three" style="font-size:26px"></i>',
  free: '<i class="ph ph-shield-check" style="font-size:26px"></i>'
}
const bentoIcon = (k) => BENTO_ICONS[k] || BENTO_ICONS.rating

// Decorative icons for the "How it works" steps, by index (log → analyse → coach).
const STEP_ICONS = [
  '<i class="ph ph-check-square" style="font-size:30px"></i>',
  '<i class="ph ph-chart-bar" style="font-size:30px"></i>',
  '<i class="ph ph-chat-circle" style="font-size:30px"></i>'
]
const stepIcon = (i) => STEP_ICONS[i % STEP_ICONS.length]

// ── Feature showcase (pinned; a VERTICAL card stack advances on scroll) ──
// The section is taller than the viewport and its inner stage is sticky. Scroll
// progress drives a stacked deck: the front card is full, upcoming cards peek
// above (smaller + dimmer), and the front card drops away as the next rises in
// (transforms set per-frame in applyScroll). Arrows/dots scroll the page to the
// matching progress offset, so the controls double as a jump + progress.
const active = ref(0)
const count = computed(() => features.value.length || 1)

const showcasePin = ref(null)

const go = (i) => {
  const idx = (i % count.value + count.value) % count.value
  active.value = idx
  const pin = showcasePin.value
  if (!pin) return
  const vh = window.innerHeight || 1
  const span = pin.offsetHeight - vh
  const frac = count.value > 1 ? idx / (count.value - 1) : 0
  window.scrollTo({ top: pin.offsetTop + frac * span, behavior: 'smooth' })
}
const next = () => go(active.value + 1)
const prev = () => go(active.value - 1)

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
let heroExitEls = []      // hero copy children that peel away on scroll
let heroFxEls = []        // shader + falling layers — fade out as the hero leaves
let heroScrimEl = null    // legibility scrim — fades fully so the hero dissolves seamlessly
let heroScrolled = false  // true once the hero exit has engaged (so we don't replay the entrance)
let stepEls = []          // "How it works" cards (scroll-scrubbed deck)
let fcardEls = []         // feature showcase cards (vertical stack)

// Pinned hero + "How it works" story.
const heroPin = ref(null)
const stepsPin = ref(null)
const stepActive = ref(0)

const clamp01 = (n) => Math.min(Math.max(n, 0), 1)

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

  // Hero is PINNED (like the other sections): while it's stuck, scroll progress
  // through .hero-pin scrubs the exit in three beats, then it releases:
  //   1) the copy lines peel away first      (he 0 → ~0.55)
  //   2) THEN the smoke/cloud dissolves       (he ~0.5 → 1)
  //   3) then the hero unpins and the next section scrolls up
  let he = 0
  if (heroPin.value) {
    const hr = heroPin.value.getBoundingClientRect()
    const hspan = hr.height - vh
    he = hspan > 0 ? clamp01(-hr.top / hspan) : 0
  }

  // Beat 1 — text leaves first.
  const htext = clamp01(he / 0.55)
  for (let i = 0; i < heroExitEls.length; i++) {
    const el = heroExitEls[i]
    if (he <= 0) {
      if (heroScrolled) {
        // Back at the top after scrolling: settle to the final resting state but
        // DON'T restore the entrance animation (restoring it replays the rise-in,
        // which is the "unblurs then jumps up/down again" glitch).
        el.style.animation = 'none'
        el.style.opacity = '1'
        el.style.transform = 'none'
        el.style.filter = 'none'
      } else {
        // Initial load (never scrolled): let the CSS entrance animation play.
        el.style.animation = ''
        el.style.transform = ''
        el.style.opacity = ''
        el.style.filter = ''
      }
      continue
    }
    heroScrolled = true
    // Kill the entrance animation's forwards-fill so our inline styles win the
    // cascade (otherwise the held final keyframe overrides them and nothing moves).
    el.style.animation = 'none'
    const local = clamp01((htext - i * 0.13) / 0.5)
    el.style.opacity = (1 - local).toFixed(3)
    el.style.transform = `translateY(${(-local * 48).toFixed(1)}px)`
    el.style.filter = local > 0.001 ? `blur(${(local * 6).toFixed(1)}px)` : ''
  }

  // Beat 2 — once the text is gone, fade the cloud down to FAINT (not gone), so
  // it never cuts to a black screen and hands off to the page-wide faint texture.
  const cloud = clamp01((he - 0.5) / 0.45)
  for (const el of heroFxEls) el.style.opacity = (1 - cloud * 0.64).toFixed(3)  // keep slight clouds (~0.36)
  heroFade.value = cloud * 0.5   // thin density only moderately so it stays visible

  // Fade the legibility scrim away entirely as the text leaves, so the hero
  // dissolves into the same faint fixed cloud as the rest of the page — no edge.
  if (heroScrimEl) {
    const s = clamp01((he - 0.25) / 0.5)
    heroScrimEl.style.opacity = (1 - s).toFixed(3)
  }

  // "How it works" — scroll-scrubbed vertical deck. f is a continuous position
  // (0 → N-1): step i is centred when f === i. Each step's offset from f drives
  // its rise-from-below / lift-away motion, so it tracks scroll on every pixel.
  const sp = stepsPin.value
  if (sp) {
    const r = sp.getBoundingClientRect()
    const span = r.height - vh
    const p = span > 0 ? clamp01(-r.top / span) : 0
    const n = stepEls.length || 1
    const f = p * Math.max(n - 1, 1)
    for (let i = 0; i < stepEls.length; i++) {
      const el = stepEls[i]
      const rel = i - f                       // <0 past (above), >0 upcoming (below)
      const a = Math.min(Math.abs(rel), 1.4)
      el.style.opacity = clamp01(1 - a * 1.15).toFixed(3)
      el.style.transform = `translateY(${(rel * 118).toFixed(1)}px) scale(${(1 - Math.min(a, 1) * 0.08).toFixed(3)})`
      el.style.filter = a > 0.45 ? `blur(${((a - 0.45) * 10).toFixed(1)}px)` : ''
      el.style.pointerEvents = a < 0.5 ? 'auto' : 'none'
    }
    stepActive.value = Math.max(0, Math.min(n - 1, Math.round(f)))
  }

  // Feature showcase pin → advance the vertical card stack. f is continuous
  // (0 → N-1): the front card (rel≈0) is full; upcoming cards (rel>0) peek above,
  // smaller + dimmer; the passed card (rel<0) drops away downward and fades.
  const fp = showcasePin.value
  if (fp && fcardEls.length) {
    const r = fp.getBoundingClientRect()
    const span = r.height - vh
    const p = span > 0 ? clamp01(-r.top / span) : 0
    const n = fcardEls.length
    // Dwell-then-swap: each card holds centred for most of its band, then the
    // swap animates near the band edge. `g` is the continuous front position —
    // this gives every card (incl. the first) real time on screen, no skipping.
    const raw = p * n
    let idx = Math.min(Math.floor(raw), n - 1)
    const frac = clamp01(raw - idx)
    const ease = frac < 0.6 ? 0 : (frac - 0.6) / 0.4   // 0 while dwelling → 1 at band end
    const g = Math.min(idx + ease, n - 1)
    for (let i = 0; i < n; i++) {
      const el = fcardEls[i]
      const rel = i - g
      let ty, sc, op, z
      if (rel >= 0) {                         // front + upcoming (clearly stacked above)
        const c = Math.min(rel, 4)
        ty = -c * 40
        sc = 1 - c * 0.08
        // Front + next stay opaque (no see-through); deeper peeks fade out.
        op = clamp01(1 - Math.max(0, c - 1) * 0.34)
        z = 100 - Math.round(c * 10)
      } else {                                // exiting front card — slides down and
                                              // off (staying on top) so the exit reads
        const c = Math.min(-rel, 1.2)
        ty = c * 150
        sc = 1 + c * 0.04
        op = clamp01(1 - c * 1.05)
        z = 130 - Math.round(c * 6)
      }
      el.style.transform = `translateY(${ty.toFixed(1)}px) scale(${sc.toFixed(3)})`
      el.style.opacity = op.toFixed(3)
      el.style.zIndex = String(z)
      el.style.pointerEvents = Math.abs(rel) < 0.5 ? 'auto' : 'none'
    }
    active.value = idx
  }

}

const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(applyScroll) } }

const initScroll = () => {
  if (!homeEl.value) return
  zoomEls = Array.from(homeEl.value.querySelectorAll('.zoom-on-scroll'))
  heroExitEls = Array.from(homeEl.value.querySelectorAll('.hero__content > *'))
  heroFxEls = Array.from(homeEl.value.querySelectorAll('.hero__shader, .hero__falling'))
  heroScrimEl = homeEl.value.querySelector('.hero__scrim')
  stepEls = Array.from(homeEl.value.querySelectorAll('.hstep'))
  fcardEls = Array.from(homeEl.value.querySelectorAll('.fcard'))
  applyScroll()
}

onMounted(async () => {
  mql = window.matchMedia('(max-width: 760px)')
  syncVariant()
  mql.addEventListener('change', syncVariant)
  initScroll()

  // Cycle the hero accent word with a different animation each time.
  wordTimer = setInterval(() => {
    wordIdx.value = (wordIdx.value + 1) % words.length
    let n
    do { n = Math.floor(Math.random() * WORD_FX.length) } while (WORD_FX[n] === wordFx.value)
    wordFx.value = WORD_FX[n]
  }, 2400)
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
  clearInterval(wordTimer)
  mql?.removeEventListener('change', syncVariant)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
.home {
  /* Flat base that matches the shader's dark base + the hero scrim's end colour,
     so there's no colour seam between the hero and the next section. */
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  overflow-x: clip;
}

/* Fixed cloud + dots layer behind everything (opacity driven in applyScroll). */
.home__fx {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Sections paint above the fixed backdrop. */
.home > section { position: relative; z-index: 1; }

/* ───────────────────────── HERO ───────────────────────── */
/* Tall outer defines how long the hero stays pinned while its exit scrubs. */
.hero-pin { position: relative; height: 150svh; }

.hero {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  isolation: isolate;
}

/* WebGL aurora field — the live backdrop on every viewport. */
.hero__shader {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Fine falling-light texture layered over the shader. */
.hero__falling {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(125% 100% at 70% 36%, #000 0%, transparent 78%);
  mask-image: radial-gradient(125% 100% at 70% 36%, #000 0%, transparent 78%);
}

/* Legibility scrim: sinks the lower-left (where the copy sits) into the page so
   text keeps a comfortable contrast over the moving field. */
.hero__scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(to top, var(--color-bg-page) 2%, rgba(5, 6, 8, 0.34) 26%, transparent 58%),
    radial-gradient(120% 90% at 12% 96%, rgba(5, 6, 8, 0.6), transparent 60%);
}

.hero__content {
  position: absolute;
  left: clamp(20px, 5vw, 64px);
  bottom: clamp(84px, 13vh, 130px);
  max-width: min(680px, 88%);
  z-index: 3;
}

/* Staggered hero entrance — a one-shot animation (not a transition) so the
   scroll-driven exit (inline opacity/transform/filter set every frame in
   applyScroll) scrubs instantly instead of being rubber-banded by a transition. */
.hero__content > * {
  opacity: 0;
  transform: translateY(22px);
  will-change: transform, opacity, filter;
}
.hero__content--in > * { animation: hero-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.hero__content--in > *:nth-child(1) { animation-delay: 0.05s; }
.hero__content--in > *:nth-child(2) { animation-delay: 0.15s; }
.hero__content--in > *:nth-child(3) { animation-delay: 0.27s; }
.hero__content--in > *:nth-child(4) { animation-delay: 0.39s; }
@keyframes hero-rise { to { opacity: 1; transform: translateY(0); } }

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
  perspective: 700px;   /* gives the flip animation real depth */
}

/* Cycling accent word — each switch re-mounts it (:key) and animates PER LETTER
   with a staggered delay; the .cx-* class picks a fresh effect each time. */
.hero__cycle { display: inline-block; white-space: nowrap; will-change: transform, opacity, filter; }
.hero__char {
  display: inline-block;
  animation-duration: 0.52s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  animation-delay: calc(var(--ci, 0) * 0.04s);
}
.hero__cycle.cx-rise .hero__char { animation-name: cx-rise; }
.hero__cycle.cx-fall .hero__char { animation-name: cx-fall; }
.hero__cycle.cx-flip .hero__char { animation-name: cx-flip; }
.hero__cycle.cx-zoom .hero__char { animation-name: cx-zoom; animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
.hero__cycle.cx-blur .hero__char { animation-name: cx-blur; }

@keyframes cx-rise { from { opacity: 0; transform: translateY(0.85em) rotate(8deg); }   to { opacity: 1; transform: none; } }
@keyframes cx-fall { from { opacity: 0; transform: translateY(-0.85em) rotate(-8deg); } to { opacity: 1; transform: none; } }
@keyframes cx-flip { from { opacity: 0; transform: rotateX(-90deg); }                   to { opacity: 1; transform: none; } }
@keyframes cx-zoom { 0%   { opacity: 0; transform: scale(0); }                          100% { opacity: 1; transform: none; } }
@keyframes cx-blur { from { opacity: 0; filter: blur(14px); transform: scale(1.5); }    to { opacity: 1; filter: blur(0); transform: none; } }

.hero__sub {
  margin: 22px 0 28px;
  max-width: 460px;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--color-text-muted);
}

/* ── CTA boxes (squared, geometric) ── */
.hero__cta { display: flex; gap: 12px; flex-wrap: wrap; }

/* Clean pill CTAs — no coloured glow. The solid button is a crisp accent fill
   with a faint top highlight for tactility; the ghost is a hairline outline.
   Both lift slightly and dip on press (no layout shift). */
.cta-box {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 14px 26px;
  min-height: 48px;
  border-radius: var(--radius-pill);
  font-family: var(--font-family-display);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.01em;
  text-transform: none;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease,
              border-color 0.2s ease, box-shadow 0.2s ease;
}

.cta-box--solid {
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
}
.cta-box--solid:hover {
  background: color-mix(in srgb, var(--color-accent) 88%, white);
  transform: translateY(-1px);
}
.cta-box--solid:active { transform: translateY(0); background: var(--color-accent-strong); }

.cta-box--ghost {
  background: color-mix(in srgb, var(--color-text-primary) 4%, transparent);
  color: var(--color-text-primary);
  border-color: var(--color-border-soft);
}
.cta-box--ghost:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
  transform: translateY(-1px);
}
.cta-box--ghost:active { transform: translateY(0); }

.cta-box:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

/* Arrow nudges forward on hover — a small, meaningful motion cue. */
.cta-box__arrow { font-size: 1.05rem; line-height: 1; transition: transform 0.2s ease; }
.cta-box--solid:hover .cta-box__arrow { transform: translateX(3px); }

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

/* ───────────── How it works — pinned sticky-swap story ───────────── */
.steps-pin { position: relative; }   /* height set inline = (steps+1) * 100svh */

.steps-stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(24px, 5vh, 56px);
  padding: clamp(40px, 8vh, 96px) 20px;
}

.steps-head { text-align: center; }

/* Progress rail — one segment per step, fills as the active step advances. */
.steps-rail { display: flex; gap: 10px; }
.steps-rail__seg {
  width: 38px;
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  transition: background 0.4s ease, width 0.4s ease;
}
.steps-rail__seg.is-done { background: var(--color-accent-border); }
.steps-rail__seg.is-active { width: 64px; background: var(--color-accent); }

/* Cards are stacked; only the active one is shown. Others fade + slide away. */
.steps-deck {
  position: relative;
  width: min(620px, 92%);
  flex: 1 1 auto;
  max-height: 420px;
}
.hstep {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: clamp(24px, 4vw, 40px);
  opacity: 0;                       /* applyScroll() drives opacity/transform/blur per frame */
  will-change: transform, opacity;
  pointer-events: none;
}

/* Soft accent glow behind the active step. */
.hstep__glow {
  position: absolute;
  inset: -10% 10%;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--color-accent-glow-20), transparent 75%);
  filter: blur(20px);
  opacity: 0;
  transition: opacity 0.6s ease;
}
.hstep--active .hstep__glow { opacity: 1; }

/* Big outlined ghost step number. */
.hstep__n {
  font-family: var(--font-family-display);
  font-weight: 900;
  font-size: clamp(4rem, 16vw, 8rem);
  line-height: 0.9;
  color: transparent;
  -webkit-text-stroke: 2px var(--color-accent-border);
  text-stroke: 2px var(--color-accent-border);
}

.hstep__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
}

.hstep__title {
  margin: 0;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.hstep__text {
  margin: 0;
  max-width: 42ch;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  line-height: 1.6;
}

/* Scroll cue — only on the first step, so users know to keep scrolling. */
.steps-hint {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  transition: opacity 0.4s ease;
}
.steps-hint i { color: var(--color-accent); animation: hint-bounce 1.6s ease-in-out infinite; }
.steps-hint.is-hidden { opacity: 0; pointer-events: none; }
@keyframes hint-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(5px); }
}

/* ───────────── Feature showcase — pinned, slides on scroll ───────────── */
.showcase-pin { position: relative; }   /* height set inline = (features+1) * 90svh */

.showcase-stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;   /* head top · track middle · controls bottom */
  gap: clamp(16px, 3vh, 28px);
  /* clear the floating bottom nav (mobile); desktop navbar cleared in @media below */
  padding: clamp(40px, 7vh, 72px) 0 calc(92px + env(safe-area-inset-bottom));
}

.showcase-head { text-align: center; padding: 0 20px; }
.showcase-lead { display: none; margin: 18px 0 0; max-width: 34ch; color: var(--color-text-muted); line-height: 1.65; font-size: var(--font-size-md); }

/* Vertical card stack. The cards are absolutely stacked inside this fixed box
   that sits centred between the head and controls. */
.fstack {
  position: relative;
  width: min(82vw, 340px);
  height: min(60vh, 460px);
}

/* Each feature is a stacked card; applyScroll drives transform/opacity/z-index
   per frame (front card full, upcoming peek above, passed drops away). */
.fcard {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: clamp(20px, 4vw, 26px);
  /* Opaque surface so a front card fully hides the ones stacked behind it —
     only their peeking top edges show. */
  background: linear-gradient(165deg, #161d22, #0c1013);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  box-shadow: 0 -2px 0 rgba(255, 255, 255, 0.04) inset, 0 18px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
  overflow: hidden;
  opacity: 0;                       /* JS owns opacity/transform/z; no transition */
  transform-origin: center top;     /* scale from the top so upcoming cards peek above */
  will-change: transform, opacity;
  transition: border-color 0.3s ease;
}
.fcard--active { border-color: var(--color-accent-border); }

.fcard__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 168px;
}
.fcard__visual > :deep(*) { width: 100%; max-width: 250px; margin: 0 auto; }
/* The heatmap is a 2:3 portrait, so cap its width to keep the card height in
   check (this is the tallest visual; the others are short). */
.fcard__visual :deep(.heatmap-canvas) { max-width: 156px; }
/* The feed card is a full match card — scale it down (zoom shrinks its layout
   box too, so it fits the visual area without being clipped). */
.fcard__visual :deep(.demo-feed) { max-width: 320px; zoom: 0.72; }

.fcard__copy { display: flex; flex-direction: column; align-items: center; }

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
/* Desktop/tablet: use the horizontal space — heading on the left, the live
   element on the right — so the wide viewport doesn't read as empty. */
@media (min-width: 900px) {
  .showcase-lead { display: block; }
  .showcase-stage {
    display: grid;
    grid-template-columns: 1fr clamp(340px, 33vw, 440px);
    grid-template-rows: 1fr auto;
    align-items: center;
    justify-items: center;
    column-gap: clamp(40px, 6vw, 96px);
    max-width: 1180px;
    margin: 0 auto;
    padding-inline: clamp(40px, 6vw, 96px);
  }
  .showcase-head {
    grid-column: 1;
    grid-row: 1 / 3;
    align-self: center;
    justify-self: start;
    text-align: left;
    max-width: 32ch;
  }
  .showcase-head .section-title { font-size: clamp(2.4rem, 4vw, 3.4rem); }
  .fstack { grid-column: 2; grid-row: 1; align-self: center; width: min(100%, 430px); height: min(56vh, 440px); }
  .carousel__controls { grid-column: 2; grid-row: 2; margin-top: 20px; }

  /* "How it works" gets a bigger ghost number + wider deck so it fills too. */
  .hstep__n { font-size: clamp(6rem, 13vw, 11rem); }
  .steps-deck { width: min(680px, 84%); max-height: 480px; }
}

/* Desktop: the floating top navbar (shown ≥1025px) needs head clearance inside
   the pinned stages, and there's no bottom nav so the bottom inset shrinks. */
@media (min-width: 1025px) {
  .showcase-stage { padding-top: 104px; padding-bottom: 44px; }
  .steps-stage { padding-top: 104px; }
}

@media (max-width: 760px) {
  /* Phone hero: the WebGL aurora fills the whole hero (vertical-curtain variant),
     with a clean editorial stack (title, subtitle, single button) centred over
     it. The scrim keeps the copy readable against the moving field. */
  .hero {
    text-align: center;
    padding: 0;
  }
  .hero__falling {
    -webkit-mask-image: radial-gradient(120% 80% at 50% 28%, #000 0%, transparent 82%);
    mask-image: radial-gradient(120% 80% at 50% 28%, #000 0%, transparent 82%);
  }
  /* Centre-weighted scrim so the middle copy stays legible on phones, even when
     the smoke is dense right behind the text. */
  .hero__scrim {
    background:
      linear-gradient(to top, var(--color-bg-page) 4%, rgba(5, 6, 8, 0.58) 34%, rgba(5, 6, 8, 0.22) 60%, transparent 82%),
      radial-gradient(135% 60% at 50% 52%, rgba(5, 6, 8, 0.66), transparent 72%);
  }
  /* Soft shadow keeps the headline/subtitle readable over bright curtains. */
  .hero__title { text-shadow: 0 2px 22px rgba(0, 0, 0, 0.65); }
  .hero__sub { text-shadow: 0 1px 14px rgba(0, 0, 0, 0.7); }
  .hero__content {
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    max-width: none;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 26px calc(56px + env(safe-area-inset-bottom));
  }
  .hero__title { font-size: clamp(2.6rem, 13vw, 3.6rem); }
  .hero__sub { margin: 18px auto 28px; max-width: 32ch; font-size: var(--font-size-base); }
  .hero__cta { justify-content: center; }
  /* Editorial keeps a single primary button; login still lives in the bottom nav. */
  .hero__cta .cta-box--ghost { display: none; }

  .bento { grid-template-columns: 1fr; }
  .bento__tile,
  .bento__tile--wide { grid-column: span 1; }
  .bento__tile { min-height: 0; }
}

</style>
