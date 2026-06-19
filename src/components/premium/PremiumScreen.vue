<template>
  <div class="prem" ref="rootEl">
    <!-- ───────────────────────── HERO ───────────────────────── -->
    <section class="prem-hero">
      <div class="prem-hero__grid" aria-hidden="true"></div>
      <div class="prem-hero__glow" aria-hidden="true"></div>
      <div class="prem-hero__inner zoom-on-scroll">
        <span class="prem-badge" :class="{ 'prem-badge--active': isPro }">{{ heroBadge }}</span>
        <h1 class="prem-hero__title">
          <span class="prem-hero__line">{{ heroTitle }}</span>
          <span class="prem-hero__line prem-hero__line--outline">{{ heroAccent }}</span>
        </h1>
        <p class="prem-hero__sub">{{ heroSub }}</p>
        <router-link v-if="isPro" to="/dashboard" class="cta-box cta-box--solid">
          Back to dashboard<span class="cta-box__arrow">→</span>
        </router-link>
        <button v-else type="button" class="cta-box cta-box--solid" @click="scrollToPricing">
          See plans<span class="cta-box__arrow">→</span>
        </button>
      </div>
    </section>

    <!-- ──────────────────── FEATURE BENTO ──────────────────── -->
    <section class="section">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">{{ isPro ? 'Your Pro perks' : 'What Lab Pro adds' }}</span>
        <h2 class="section-title">{{ isPro ? "Everything you've unlocked." : 'Everything free. Pro goes deeper.' }}</h2>
      </div>

      <div class="bento" data-testid="premium-bento">
        <div
          v-for="(f, i) in features"
          :key="f.id"
          class="bento__tile zoom-on-scroll"
          :class="{ 'bento__tile--wide': i === 0 }"
        >
          <span class="bento__icon" v-html="featureIcon(f.id)"></span>
          <h3 class="bento__title">{{ f.title }}<span v-if="f.id === 'clip' || f.soon" class="soon-chip">Coming soon</span></h3>
          <p class="bento__text">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- ──────────────────── SHOWCASE (live demos) ──────────────────── -->
    <section class="section">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">{{ isPro ? 'In your kit' : 'See it in action' }}</span>
        <h2 class="section-title">{{ isPro ? 'Pro, in action.' : 'Pro, made tangible.' }}</h2>
      </div>

      <div class="showcase">
        <!-- AI Coach: free vs pro -->
        <article class="show-card zoom-on-scroll">
          <div class="show-card__copy">
            <span class="feature__tag">AI Coach</span>
            <h3 class="show-card__title">From a tip to a plan.</h3>
            <p class="show-card__text">Free gives you a read. Pro gives you the why, the xG, and the week ahead.</p>
          </div>
          <div class="show-card__demo">
            <div class="demo-compare">
              <div class="demo-compare__col">
                <span class="demo-compare__tag demo-compare__tag--free">Free</span>
                <div class="demo-bubble">{{ c.examples.free }}</div>
              </div>
              <div class="demo-compare__col">
                <span class="demo-compare__tag demo-compare__tag--pro">Lab Pro</span>
                <div class="demo-bubble demo-bubble--pro">
                  <p v-for="(line, li) in c.examples.pro" :key="li">{{ line }}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- Make it yours: live colour customizer -->
        <article class="show-card show-card--rev zoom-on-scroll">
          <div class="show-card__copy">
            <span class="feature__tag">Personalize</span>
            <h3 class="show-card__title">Make it yours.</h3>
            <p class="show-card__text">Pick any accent and the whole app follows. Try it right here.</p>
          </div>
          <div class="show-card__demo">
            <div class="demo-accent" :style="demoStyle">
              <div class="demo-accent__card">
                <div class="demo-accent__head"><span class="demo-accent__num">8.4</span><span class="demo-accent__lbl">Rating</span></div>
                <div class="demo-accent__bar"><span style="width:84%"></span></div>
                <button type="button" class="demo-accent__cta">View shot map</button>
              </div>
              <div class="demo-accent__swatches">
                <button v-for="cSw in swatches" :key="cSw" type="button" class="demo-accent__swatch" :class="{ 'is-active': demoColor === cSw }" :style="{ background: cSw }" :aria-label="`Use ${cSw}`" @click="demoColor = cSw"></button>
                <label class="demo-accent__swatch demo-accent__swatch--custom" title="Custom colour"><input type="color" v-model="demoColor" /></label>
              </div>
            </div>
          </div>
        </article>

        <!-- Clip analysis: annotated frame -->
        <article class="show-card show-card--soon zoom-on-scroll">
          <div class="show-card__copy">
            <span class="feature__tag feature__tag--soon">Video · Coming soon</span>
            <h3 class="show-card__title">It reads the clip.</h3>
            <p class="show-card__text">Upload a moment and Pro breaks down your run, your timing, your space.</p>
          </div>
          <div class="show-card__demo">
            <div class="demo-clip">
              <div class="demo-clip__frame">
                <div class="demo-clip__pitch"></div>
                <span class="demo-clip__pin demo-clip__pin--a" style="left:30%;top:60%">YOU</span>
                <span class="demo-clip__pin demo-clip__pin--b" style="left:64%;top:34%">SPACE</span>
                <svg class="demo-clip__run" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="30" y1="60" x2="64" y2="34" /></svg>
              </div>
              <div class="demo-bubble demo-bubble--pro">
                <p>Held your run a beat too long. Start the bend earlier and you arrive onside into the space.</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- ──────────────────── PRO: you're all set ──────────────────── -->
    <section v-if="isPro" class="section">
      <div class="prem-active zoom-on-scroll">
        <span class="prem-active__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 13 10 18 19 6" /></svg>
        </span>
        <h2 class="prem-active__title">You're on Lab Pro.</h2>
        <p class="prem-active__text">Every feature above is unlocked and yours to use. Thanks for backing the Lab.</p>
        <div class="prem-active__cta">
          <router-link to="/coach" class="cta-box cta-box--solid">Open AI Coach<span class="cta-box__arrow">→</span></router-link>
          <router-link to="/profile" class="cta-box cta-box--ghost">Manage in Profile</router-link>
        </div>
      </div>
    </section>

    <!-- ──────────────────── PRICING (free users) ──────────────────── -->
    <section v-else class="section" ref="pricingEl">
      <div class="section-head zoom-on-scroll">
        <span class="kicker">Pick your plan</span>
        <h2 class="section-title">{{ c.pricing.note }}</h2>
      </div>

      <div class="prem-pricing zoom-on-scroll">
        <div class="prem-plans" role="tablist" aria-label="Billing plan">
          <button
            v-for="p in plans"
            :key="p.id"
            type="button"
            class="prem-plan"
            :class="{ 'is-active': p.id === planId }"
            role="tab"
            :aria-selected="p.id === planId"
            @click="planId = p.id"
          >
            <span class="prem-plan__label">{{ p.label }}</span>
            <span v-if="p.save > 0" class="prem-plan__save">-{{ p.save }}%</span>
          </button>
        </div>

        <div class="prem-price">
          <span class="prem-price__amount">{{ cur }}{{ perMonthDisplay }}</span>
          <span class="prem-price__per">/month</span>
        </div>
        <p class="prem-price__total">{{ billingLine }}</p>

        <button type="button" class="cta-box cta-box--solid prem-cta" :class="{ 'is-done': notified }" @click="notify">
          {{ notified ? "You're on the list ✓" : c.cta.label }}
        </button>
        <p class="prem-fineprint">{{ c.cta.fineprint }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { content, loadKey } from '../../lib/siteContent'
import { ResolveSession } from '../../lib/authSession'
import { isPro, loadEntitlements } from '../../lib/premium'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const router = useRouter()

const rootEl = ref(null)
const pricingEl = ref(null)

// Strip em/en dashes from copy (they read as AI-written) — same cleaner as Home.
const clean = (t) => typeof t === 'string'
  ? t.replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ', ')
  : t
const cleanObj = (o) => { const r = {}; for (const k in o) r[k] = clean(o[k]); return r }

const c = computed(() => {
  const p = content.value.premium
  return { ...p, hero: cleanObj(p.hero || {}) }
})
const features = computed(() => (content.value.premium.features || []).map(cleanObj))

// Pro members see a "you already have this" framing instead of the sales pitch.
const heroBadge = computed(() => isPro.value ? 'LAB PRO · ACTIVE' : c.value.hero.badge)
const heroTitle = computed(() => isPro.value ? "You're" : c.value.hero.title)
const heroAccent = computed(() => isPro.value ? 'Lab Pro.' : c.value.hero.titleAccent)
const heroSub = computed(() => isPro.value
  ? "Every Pro feature is unlocked, this is everything you've got."
  : c.value.hero.sub)

// Inline icons per Pro feature (v-html, trusted static SVG) — mirrors Home's bento.
const FEATURE_ICONS = {
  coach: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><circle cx="8.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/></svg>',
  clip: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><polygon points="10 9 15.5 12 10 15" fill="currentColor" stroke="none"/></svg>',
  badge: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><polyline points="9 12 11.5 14.5 15.5 9.5"/></svg>',
  accent: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 5.6 6 10a6 6 0 0 1-12 0c0-4.4 6-10 6-10z"/></svg>',
  early: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 9 12 9 13 2"/></svg>'
}
const featureIcon = (id) => FEATURE_ICONS[id] || FEATURE_ICONS.early

const scrollToPricing = () => pricingEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// ── Colour demo ────────────────────────────────────────────────────
const swatches = ['#4cda9c', '#4f9dff', '#a855f7', '#ff7a45', '#f5c451', '#ff5470']
const demoColor = ref('#4cda9c')
const demoStyle = computed(() => ({
  '--demo-accent': demoColor.value,
  '--demo-soft': `color-mix(in srgb, ${demoColor.value} 16%, transparent)`,
  '--demo-border': `color-mix(in srgb, ${demoColor.value} 36%, transparent)`
}))

// ── Pricing (three fixed plans: monthly / quarterly / yearly) ───────
const cur = computed(() => c.value.pricing.currency || '$')
const monthlyTotal = computed(() => {
  const m = (c.value.pricing.plans || []).find((p) => p.months === 1)
  return m ? m.total : 0
})
// Plans decorated with derived per-month price and % saved vs monthly.
const plans = computed(() => (c.value.pricing.plans || []).map((p) => {
  const perMonth = p.total / p.months
  const save = monthlyTotal.value ? Math.round((1 - perMonth / monthlyTotal.value) * 100) : 0
  return { ...p, perMonth, save: save > 0 ? save : 0 }
}))
const planId = ref('yearly')
const plan = computed(() => plans.value.find((p) => p.id === planId.value) || plans.value[0] || { total: 0, months: 1, perMonth: 0 })
const perMonthDisplay = computed(() => plan.value.perMonth.toFixed(2))
const billingLine = computed(() => {
  const p = plan.value
  if (p.months === 1) return `Billed monthly · ${cur.value}${p.total.toFixed(2)}`
  const period = p.months === 12 ? 'year' : `${p.months} months`
  return `Billed every ${period} · ${cur.value}${p.total.toFixed(2)}`
})

// ── Waitlist (no real purchase) ────────────────────────────────────
const notified = ref(false)
const notify = async () => {
  if (props.previewMode) { notified.value = true; return }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }
  const { data: existing } = await supabase
    .from('waitlist').select('id').eq('user_id', user.id).limit(1)
  if (!existing || existing.length === 0) {
    const { error } = await supabase.from('waitlist').insert({ user_id: user.id, email: user.email })
    if (error) { console.error('Waitlist insert failed:', error); return }
  }
  notified.value = true
}

// ── Scroll-driven motion (same engine as Home) ─────────────────────
// Each .zoom-on-scroll block scales up as it nears the viewport centre and back
// down as it leaves (reversing on scroll-up), and the page background shifts
// colour with scroll progress. JS + rAF so it works everywhere; always on.
let ticking = false
let zoomEls = []

const BG_STOPS = [
  { p: 0,    rgb: [5, 6, 8] },
  { p: 0.4,  rgb: [10, 26, 20] },
  { p: 0.75, rgb: [13, 18, 44] },
  { p: 1,    rgb: [5, 6, 8] }
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
    const d = Math.min(Math.abs(center - vh / 2) / (vh * 0.7), 1)
    el.style.transform = `scale(${(1 - d * 0.2).toFixed(3)})`
    el.style.opacity = (1 - d * 0.58).toFixed(3)
  }
  const max = (document.documentElement.scrollHeight - vh) || 1
  const p = Math.min(Math.max(window.scrollY / max, 0), 1)
  rootEl.value?.style.setProperty('--prem-bg', mixBg(p))
}

const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(applyScroll) } }

const initScroll = () => {
  if (!rootEl.value) return
  zoomEls = Array.from(rootEl.value.querySelectorAll('.zoom-on-scroll'))
  applyScroll()
}

onMounted(async () => {
  initScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  if (props.previewMode) { loadKey('premium').then(() => nextTick(initScroll)); return }
  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  // Resolve Pro status so the screen can switch into its "already Pro" state
  // even on a direct page load (App.vue normally loads this, but not always
  // before this view mounts).
  loadEntitlements(session.user.id)
  loadKey('premium').then(() => nextTick(initScroll))
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
.prem {
  /* --prem-bg is updated on scroll (JS); falls back to the app gradient. */
  background: var(--prem-bg, var(--app-page-bg));
  color: var(--color-text-primary);
  overflow-x: clip;
}

/* ───────────────────────── HERO ───────────────────────── */
.prem-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 78svh;
  padding: clamp(72px, 12vh, 120px) 20px clamp(40px, 8vh, 80px);
  overflow: hidden;
  isolation: isolate;
}

.prem-hero__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 78%);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 78%);
  pointer-events: none;
}

.prem-hero__glow {
  position: absolute;
  top: -120px; left: 50%;
  width: 620px; height: 620px;
  max-width: 120vw;
  transform: translateX(-50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 60%);
  pointer-events: none;
  z-index: 0;
  animation: prem-pulse 6s ease-in-out infinite;
}
@keyframes prem-pulse { 0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.12); } }

.prem-hero__inner { position: relative; z-index: 1; max-width: 720px; }

.prem-badge {
  display: inline-block; margin-bottom: var(--space-5);
  padding: 6px 16px; border-radius: var(--radius-pill);
  background: var(--color-accent); background-size: 200% 100%;
  color: var(--color-on-accent); font-size: var(--font-size-xs);
  font-weight: var(--font-weight-heavy); letter-spacing: 0.18em;
  animation: prem-shimmer 4s linear infinite;
}
@keyframes prem-shimmer { to { background-position: 200% 0; } }
/* Active-Pro badge: no shimmer, a steady "live" dot instead. */
.prem-badge--active { animation: none; display: inline-flex; align-items: center; gap: 8px; }
.prem-badge--active::before {
  content: ''; width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-on-accent);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-on-accent) 70%, transparent);
  animation: prem-live 1.8s ease-out infinite;
}
@keyframes prem-live {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-on-accent) 60%, transparent); }
  70%, 100% { box-shadow: 0 0 0 7px transparent; }
}

.prem-hero__title {
  margin: 0;
  font-family: var(--font-family-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.98;
  font-size: clamp(2.8rem, 9vw, 5.4rem);
}
.prem-hero__line { display: block; }
.prem-hero__line + .prem-hero__line { margin-top: 0.06em; }
.prem-hero__line--outline {
  color: transparent;
  -webkit-text-stroke: 2px var(--color-accent);
  text-stroke: 2px var(--color-accent);
}

.prem-hero__sub {
  margin: 22px auto 30px;
  max-width: 520px;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--color-text-muted);
}

/* ── CTA boxes (shared, mirror Home) ── */
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
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.cta-box--solid {
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent-deep) 40%, transparent);
}
.cta-box--solid:hover { transform: translateY(-2px); box-shadow: 0 12px 30px color-mix(in srgb, var(--color-accent-deep) 50%, transparent); }
.cta-box--solid:active { transform: scale(0.96); }
.cta-box--ghost {
  background: transparent;
  color: var(--color-accent);
  border-color: var(--color-accent-border);
}
.cta-box--ghost:hover { background: var(--color-accent-soft); transform: translateY(-2px); }
.cta-box--ghost:active { transform: scale(0.96); }
.cta-box__arrow { font-size: 1.05rem; line-height: 1; }

/* ───────────────────── Shared section chrome ───────────────────── */
.section {
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(48px, 9vw, 100px) 20px;
}
.section-head { text-align: center; margin-bottom: clamp(28px, 5vw, 52px); }
.kicker {
  display: inline-block; margin-bottom: 12px;
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-accent);
}
.section-title {
  margin: 0 auto; max-width: 16ch;
  font-size: clamp(1.7rem, 5vw, 2.6rem);
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em; line-height: 1.05;
}

.zoom-on-scroll { transform-origin: center; will-change: transform, opacity; }

/* ───────────────────── Feature bento ───────────────────── */
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
  display: inline-flex; align-items: center; justify-content: center;
  width: 46px; height: 46px; border-radius: var(--radius-md);
  background: var(--color-accent-soft); border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
}
.bento__title { margin: 0; font-size: var(--font-size-md); font-weight: var(--font-weight-heavy); letter-spacing: -0.01em; }
.bento__text { margin: 0; color: var(--color-text-muted); line-height: 1.55; font-size: var(--font-size-sm); }

/* ───────────────────── Showcase cards ───────────────────── */
.showcase { display: flex; flex-direction: column; gap: clamp(20px, 4vw, 40px); }
.show-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  align-items: center;
  padding: clamp(22px, 4vw, 40px);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
}
.show-card__title { margin: 0 0 10px; font-size: clamp(1.4rem, 4vw, 1.9rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; line-height: 1.1; }
.show-card__text { margin: 0; color: var(--color-text-muted); line-height: 1.6; }
.show-card__demo { display: flex; justify-content: center; width: 100%; }

.feature__tag {
  display: inline-block; margin-bottom: 10px; padding: 4px 12px;
  border-radius: var(--radius-pill); background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border); color: var(--color-accent);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  text-transform: uppercase; letter-spacing: 0.08em;
}
/* "Coming soon" treatment — muted tag on the demo card + dimmed demo. */
.feature__tag--soon { background: var(--color-bg-surface-3); border-color: var(--color-border-soft); color: var(--color-text-muted); }
.show-card--soon .show-card__demo { opacity: 0.6; filter: saturate(0.8); }

/* "Coming soon" chip on the feature tile. */
.soon-chip {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: 0.6rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: middle;
}

/* Generic demo bubble */
.demo-bubble { padding: 13px 16px; border-radius: var(--radius-lg); background: var(--color-bg-surface-3); border: 1px solid var(--color-border-subtle); color: var(--color-text-secondary); line-height: 1.55; font-size: var(--font-size-sm); }
.demo-bubble--pro { border-color: var(--color-accent-border); box-shadow: 0 4px 22px color-mix(in srgb, var(--color-accent) 12%, transparent); }
.demo-bubble p { margin: 0 0 8px; }
.demo-bubble p:last-child { margin-bottom: 0; }

/* Coach compare */
.demo-compare { display: grid; grid-template-columns: 1fr; gap: var(--space-3); width: 100%; max-width: 440px; }
.demo-compare__col { display: flex; flex-direction: column; gap: 6px; }
.demo-compare__tag { align-self: flex-start; padding: 3px 10px; border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.06em; }
.demo-compare__tag--free { background: var(--color-bg-surface-3); color: var(--color-text-muted); }
.demo-compare__tag--pro { background: var(--color-accent); color: var(--color-on-accent); }

/* Clip */
.demo-clip { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: var(--space-3); }
.demo-clip__frame { position: relative; aspect-ratio: 16/10; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-soft); }
.demo-clip__pitch { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(34,80,50,0.5), rgba(16,19,22,0.95)), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 40px); }
.demo-clip__pin { position: absolute; transform: translate(-50%, -50%); padding: 2px 7px; border-radius: var(--radius-pill); font-size: 0.55rem; font-weight: var(--font-weight-heavy); letter-spacing: 0.04em; z-index: 2; }
.demo-clip__pin--a { background: var(--color-accent); color: var(--color-on-accent); box-shadow: 0 0 0 4px var(--color-accent-soft); }
.demo-clip__pin--b { background: var(--color-info); color: #fff; box-shadow: 0 0 0 4px var(--color-info-bg); }
.demo-clip__run { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
.demo-clip__run line { stroke: rgba(255,255,255,0.5); stroke-width: 0.6; stroke-dasharray: 3 2; }

/* Accent customizer */
.demo-accent { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: var(--space-4); }
.demo-accent__card { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-5); background: var(--color-bg-surface); border: 1px solid var(--demo-border); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--demo-soft), 0 10px 30px var(--demo-soft); transition: border-color 0.4s ease, box-shadow 0.4s ease; }
.demo-accent__head { display: flex; align-items: baseline; gap: 8px; }
.demo-accent__num { font-size: 2.2rem; font-weight: var(--font-weight-heavy); color: var(--demo-accent); line-height: 1; transition: color 0.4s ease; }
.demo-accent__lbl { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.demo-accent__bar { height: 8px; border-radius: var(--radius-pill); background: var(--color-bg-surface-3); overflow: hidden; }
.demo-accent__bar span { display: block; height: 100%; background: var(--demo-accent); transition: background 0.4s ease; }
.demo-accent__cta { padding: 11px; border: none; border-radius: var(--radius-pill); background: var(--demo-accent); color: var(--color-on-accent); font-weight: var(--font-weight-bold); font-family: inherit; cursor: pointer; transition: background 0.4s ease; }
.demo-accent__swatches { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.demo-accent__swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--color-border-soft); cursor: pointer; transition: transform 0.15s ease, border-color 0.15s ease; }
.demo-accent__swatch:hover { transform: scale(1.12); }
.demo-accent__swatch.is-active { border-color: #fff; box-shadow: 0 0 0 3px var(--demo-soft); }
.demo-accent__swatch--custom { position: relative; overflow: hidden; background: var(--color-bg-surface-3); }
.demo-accent__swatch--custom input { position: absolute; inset: -4px; opacity: 0; cursor: pointer; }

/* ───────────────────── Pricing ───────────────────── */
.prem-pricing { max-width: 560px; margin: 0 auto; text-align: center; padding: var(--space-7) var(--space-6); background: linear-gradient(160deg, color-mix(in srgb, var(--color-accent) 8%, transparent), rgba(15,18,20,0.9)); border: 1px solid var(--color-accent-border); border-radius: var(--radius-xl); }
.prem-price { display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.prem-price__amount { font-size: 3.2rem; font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; line-height: 1; }
.prem-price__per { color: var(--color-text-muted); font-size: var(--font-size-md); }
.prem-price__save { margin-left: 6px; padding: 3px 9px; border-radius: var(--radius-pill); background: var(--color-accent); color: var(--color-on-accent); font-size: var(--font-size-xs); font-weight: var(--font-weight-heavy); }
.prem-price__total { margin: var(--space-2) 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }
.prem-price__total strong { color: var(--color-text-primary); }

/* Three-plan segmented selector */
.prem-plans {
  display: flex;
  gap: 6px;
  margin-bottom: var(--space-6);
  padding: 5px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  border: 1px solid var(--color-border-subtle);
}
.prem-plan {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.prem-plan:active { transform: scale(0.95); }
.prem-plan.is-active { background: var(--color-accent); color: var(--color-on-accent); box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent-deep) 40%, transparent); }
.prem-plan__save {
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  font-size: 0.62rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: 0.02em;
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
.prem-plan.is-active .prem-plan__save { background: rgba(255, 255, 255, 0.22); color: var(--color-on-accent); }

.prem-cta { width: 100%; justify-content: center; margin-top: var(--space-6); }
.prem-cta.is-done { background: var(--color-bg-surface-3); color: var(--color-accent); cursor: default; box-shadow: none; }
.prem-cta.is-done:hover { transform: none; }
.prem-fineprint { margin: var(--space-3) 0 0; color: var(--color-text-faint); font-size: var(--font-size-xs); }

/* ───────────────────── Pro: you're all set ───────────────────── */
.prem-active {
  max-width: 560px; margin: 0 auto; text-align: center;
  padding: var(--space-7) var(--space-6);
  background: linear-gradient(160deg, color-mix(in srgb, var(--color-accent) 10%, transparent), rgba(15,18,20,0.9));
  border: 1px solid var(--color-accent-border); border-radius: var(--radius-xl);
}
.prem-active__check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 58px; height: 58px; margin-bottom: var(--space-4);
  border-radius: 50%; background: var(--color-accent); color: var(--color-on-accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent-deep) 40%, transparent);
}
.prem-active__title { margin: 0 0 10px; font-size: clamp(1.6rem, 5vw, 2.2rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; }
.prem-active__text { margin: 0 auto var(--space-6); max-width: 420px; color: var(--color-text-muted); line-height: 1.6; }
.prem-active__cta { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

/* ───────────────────── Responsive ───────────────────── */
@media (min-width: 760px) {
  .show-card { grid-template-columns: 1fr 1fr; gap: var(--space-7); }
  .show-card--rev .show-card__copy { order: 2; }
}

@media (max-width: 720px) {
  .bento { grid-template-columns: 1fr; }
  .bento__tile, .bento__tile--wide { grid-column: span 1; min-height: 0; }
}
</style>
