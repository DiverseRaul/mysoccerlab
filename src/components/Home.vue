<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <RevealOnScroll>
        <p class="hero__eyebrow">My Soccer Lab</p>
        <h1 class="hero__title">Your season,<br /><span class="hero__accent">measured.</span></h1>
        <p class="hero__sub">
          Log every match, map every shot, and get an honest rating, xG, heatmaps,
          and AI coaching built around your position.
        </p>
        <div class="hero__ctas">
          <router-link v-if="!user" to="/login" class="btn btn-primary">Start your season</router-link>
          <template v-else>
            <router-link to="/dashboard" class="btn btn-primary">Dashboard</router-link>
            <router-link to="/feed" class="btn btn-outline">The Pitch</router-link>
          </template>
        </div>
        <p class="hero__scroll-hint">Scroll to see how it works ↓</p>
      </RevealOnScroll>
    </section>

    <!-- Feature slideshow -->
    <section class="showcase">
      <RevealOnScroll class="showcase__head">
        <span class="showcase__eyebrow">How it works</span>
        <h2 class="showcase__title">Everything, one match at a time.</h2>
      </RevealOnScroll>

      <RevealOnScroll>
        <div
          class="slideshow"
          data-testid="feature-slideshow"
          @mouseenter="pauseAuto"
          @mouseleave="resumeAuto"
          @focusin="pauseAuto"
          @focusout="resumeAuto"
        >
          <div
            class="slideshow__viewport"
            :style="viewportH ? { height: viewportH + 'px' } : null"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
          >
            <div ref="trackEl" class="slideshow__track" :class="{ 'is-animated': !prefersReduced }" :style="{ transform: `translateX(-${active * 100}%)` }">
              <div
                v-for="(f, i) in features"
                :key="f.key"
                class="slide"
                :aria-hidden="i !== active"
              >
                <div class="slide__visual">
                  <!-- Heatmap -->
                  <HeatmapCanvas v-if="f.key === 'heatmap'" :points="sampleHeat" />

                  <!-- Rating -->
                  <div v-else-if="f.key === 'rating'" class="demo-card demo-rating">
                    <span class="demo-rating__value">8.40</span>
                    <span class="demo-rating__label">Excellent</span>
                    <div class="demo-rating__bar"><span :style="{ width: '84%' }"></span></div>
                  </div>

                  <!-- xG -->
                  <div v-else-if="f.key === 'xg'" class="demo-card demo-xg">
                    <div class="demo-xg__row"><span>Goals</span><strong>3</strong></div>
                    <div class="demo-xg__row"><span>Expected (xG)</span><strong class="demo-xg__accent">1.34</strong></div>
                    <div class="demo-xg__verdict">+1.66 over — clinical finishing</div>
                  </div>

                  <!-- AI coach -->
                  <div v-else-if="f.key === 'ai'" class="demo-card demo-ai">
                    <div class="demo-ai__bubble">
                      <span class="demo-ai__spark">✦</span>
                      <p>Your pass accuracy dips in the final third. Try a one-week pattern of give-and-go drills — here's a plan…</p>
                    </div>
                  </div>

                  <!-- The Pitch -->
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
        </div>
      </RevealOnScroll>

      <div class="slideshow__controls">
        <button class="slideshow__arrow slideshow__arrow--prev" type="button" aria-label="Previous feature" @click="prev">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div class="slideshow__dots" role="tablist" aria-label="Choose a feature">
          <button
            v-for="(f, i) in features"
            :key="f.key"
            type="button"
            class="dot"
            :class="{ 'dot--active': i === active }"
            :aria-label="f.tag"
            :aria-selected="i === active"
            role="tab"
            data-testid="slide-dot"
            @click="go(i)"
          ></button>
        </div>
        <button class="slideshow__arrow slideshow__arrow--next" type="button" aria-label="Next feature" @click="next">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="cta-band">
      <RevealOnScroll>
        <h2 class="cta-band__title">Every match deserves<br />this treatment.</h2>
        <p class="cta-band__sub">Start logging — your rating, heatmap, and AI coach are one match away.</p>
        <div class="cta-band__buttons">
          <router-link v-if="!user" to="/login" class="btn btn-primary">Start your season</router-link>
          <template v-else>
            <router-link to="/dashboard" class="btn btn-primary">Dashboard</router-link>
            <router-link to="/feed" class="btn btn-outline">The Pitch</router-link>
          </template>
        </div>
      </RevealOnScroll>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { supabase } from '../lib/supabase'
import RevealOnScroll from './home/RevealOnScroll.vue'
import HeatmapCanvas from './ui/HeatmapCanvas.vue'
import FeedCard from './ui/FeedCard.vue'

const user = ref(null)

const features = [
  { key: 'heatmap', tag: 'Heatmap', title: 'Every touch, mapped.', text: 'Tap the pitch to log where it happened. Over a season it builds a heatmap of exactly where you played, scored, and defended.' },
  { key: 'rating', tag: 'Match rating', title: 'An honest 1–10 rating.', text: 'A position-aware engine weighs your goals, passing, defending and mistakes.' },
  { key: 'xg', tag: 'Expected goals', title: 'xG on every shot.', text: 'See how likely each chance was to score, and whether you’re finishing clinically or leaving goals out.' },
  { key: 'ai', tag: 'AI coach', title: 'Coaching that reads your game.', text: 'The AI coach studies your real numbers and your position, then builds training plans around what you actually need.' },
  { key: 'feed', tag: 'The Pitch', title: 'Share it on The Pitch.', text: 'Follow other players and see their matches roll into your feed as match-report cards.' }
]

// ── Slideshow state ────────────────────────────────────────────────
const active = ref(0)
const count = features.length
const AUTO_MS = 5500
const prefersReduced = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer = null
let paused = false

const stopAuto = () => { if (timer) { clearInterval(timer); timer = null } }
const startAuto = () => {
  if (prefersReduced) return
  stopAuto()
  timer = setInterval(() => { if (!paused) active.value = (active.value + 1) % count }, AUTO_MS)
}
const pauseAuto = () => { paused = true }
const resumeAuto = () => { paused = false }

// Manual navigation resets the auto-advance clock so it doesn't jump right after.
const go = (i) => { active.value = (i % count + count) % count; startAuto() }
const next = () => go(active.value + 1)
const prev = () => go(active.value - 1)

let touchStartX = 0
const onTouchStart = (e) => { touchStartX = e.changedTouches[0].clientX; pauseAuto() }
const onTouchEnd = (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) { dx < 0 ? next() : prev() }
  resumeAuto()
}

// ── Dynamic height ─────────────────────────────────────────────────
// Slides don't stretch (align-items: flex-start), so each is its own natural
// height. The viewport height tracks the ACTIVE slide so a short slide (the
// heatmap) isn't left floating inside the tallest slide's box.
const trackEl = ref(null)
const viewportH = ref(0)
let resizeObserver = null

const measure = () => {
  const track = trackEl.value
  if (!track) return
  const slide = track.children[active.value]
  if (slide) viewportH.value = slide.offsetHeight
}

watch(active, () => nextTick(measure))

// ── Demo data ──────────────────────────────────────────────────────
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

onMounted(async () => {
  startAuto()
  await nextTick()
  measure()
  // Re-measure once async visuals (canvas/feed card) settle, and on any
  // content/viewport resize so the height never lags behind the active slide.
  setTimeout(measure, 300)
  if (typeof ResizeObserver !== 'undefined' && trackEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(trackEl.value)
  }
  window.addEventListener('resize', measure)

  const { data } = await supabase.auth.getUser()
  user.value = data.user
})

onBeforeUnmount(() => {
  stopAuto()
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<style scoped>
.home {
  background: var(--app-page-bg);
  color: var(--color-text-primary);
  overflow-x: clip;
}

/* ── Hero ─────────────────────────────────────────────────────── */
.hero {
  max-width: 760px;
  margin: 0 auto;
  padding: 150px 20px 70px;
  text-align: center;
}

.hero__eyebrow {
  margin: 0 0 14px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.hero__title {
  margin: 0 0 18px;
  font-size: clamp(2.4rem, 9vw, 4rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.hero__accent { color: var(--color-accent); }

.hero__sub {
  margin: 0 auto 28px;
  max-width: 480px;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--color-text-muted);
}

.hero__ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero__scroll-hint {
  margin: 40px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-faint);
}

/* ── Buttons ──────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
  min-height: 48px;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-accent), var(--color-brand));
  color: #04130c;
  box-shadow: 0 8px 24px rgba(0, 82, 51, 0.4);
}

.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0, 82, 51, 0.5); }

.btn-outline {
  background: var(--color-bg-surface-2);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.btn-outline:hover { background: var(--color-accent-soft); transform: translateY(-2px); }

/* ── Showcase / slideshow ─────────────────────────────────────── */
.showcase {
  max-width: 1040px;
  margin: 0 auto;
  padding: 8px 20px 24px;
}

.showcase__head {
  text-align: center;
  margin-bottom: 28px;
}

.showcase__eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.showcase__title {
  margin: 0;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
}

.slideshow {
  /* Full-width viewport; navigation lives in the control bar below so each
     slide gets the entire width (the feed card needs the room on phones). */
  width: 100%;
}

.slideshow__viewport {
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-xl);
  transition: height 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.slideshow__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: 18px;
}

.slideshow__track {
  display: flex;
  /* Slides keep their natural height (don't stretch to the tallest one) so the
     viewport can size to whichever slide is active. */
  align-items: flex-start;
}

.slideshow__track.is-animated {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: center;
  justify-items: center;
  padding: 36px 24px;
  text-align: center;
}

.slide__visual {
  display: flex;
  justify-content: center;
  width: 100%;
}

.slide__visual > :deep(*) { width: 100%; max-width: 280px; margin-left: auto; margin-right: auto; }

.slideshow__arrow {
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

.slideshow__arrow:hover {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
  transform: scale(1.06);
}

.slideshow__dots {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-bg-surface-3);
  cursor: pointer;
  transition: background 0.25s ease, width 0.25s ease, transform 0.2s ease;
}

.dot:hover { transform: scale(1.2); }

.dot--active {
  width: 26px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
}

/* ── Feature copy ─────────────────────────────────────────────── */
.feature__tag {
  display: inline-block;
  margin-bottom: 10px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.feature__title {
  margin: 0 0 12px;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.feature__text {
  margin: 0 auto;
  max-width: 440px;
  color: var(--color-text-muted);
  line-height: 1.7;
  font-size: var(--font-size-base);
}

/* ── Demo cards ───────────────────────────────────────────────── */
.demo-card {
  width: 100%;
  max-width: 320px;
  padding: var(--space-6);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(15, 18, 20, 0.92));
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.demo-rating { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.demo-rating__value { font-size: 3.4rem; font-weight: var(--font-weight-heavy); color: var(--color-rating-excellent); line-height: 1; }
.demo-rating__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-rating-excellent); }
.demo-rating__bar { width: 100%; height: 8px; margin-top: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.demo-rating__bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-brand-fg)); }

.demo-xg__row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle); font-size: var(--font-size-base); color: var(--color-text-secondary); }
.demo-xg__row strong { font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.demo-xg__accent { color: var(--color-accent); }
.demo-xg__verdict { margin-top: 14px; text-align: center; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-success); }

.demo-ai__bubble { display: flex; gap: 12px; text-align: left; }
.demo-ai__spark { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--color-accent-soft); color: var(--color-accent); font-size: 1.1rem; }
.demo-ai__bubble p { margin: 0; padding: 12px 14px; background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: 4px 16px 16px 16px; color: var(--color-text-secondary); line-height: 1.6; font-size: var(--font-size-sm); }

.demo-feed { max-width: 360px; }

/* ── Final CTA ────────────────────────────────────────────────── */
.cta-band {
  margin-top: 32px;
  padding: 72px 20px 96px;
  border-top: 1px solid var(--color-border-subtle);
  text-align: center;
}

.cta-band__title {
  margin: 0 0 14px;
  font-size: clamp(1.8rem, 6vw, 2.6rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.cta-band__sub {
  margin: 0 auto 24px;
  max-width: 460px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.cta-band__buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* ── Desktop: two-column slides ───────────────────────────────────
   Only at ≥920px, where each column is wide enough for the visual to keep
   clear margins. Below that we stay single-column (visual centered on top)
   so the pitch is never cramped against the copy. */
@media (min-width: 920px) {
  .slide {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    padding: 56px 40px;
    text-align: left;
    align-items: center;
  }
  .slide__visual { justify-content: center; }
  .feature__text { margin-left: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .slideshow__track { transition: none; }
  .slideshow__viewport { transition: none; }
}
</style>
