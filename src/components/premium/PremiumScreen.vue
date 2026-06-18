<template>
  <div class="premium">
    <div class="premium__glow" aria-hidden="true"></div>

    <div class="premium__wrap">
      <!-- Hero -->
      <RevealOnScroll>
        <header class="premium__hero">
          <span class="premium__badge">{{ c.hero.badge }}</span>
          <h1 class="premium__title">{{ c.hero.title }}<br /><span class="premium__title-grad">{{ c.hero.titleAccent }}</span></h1>
          <p class="premium__sub">{{ c.hero.sub }}</p>
        </header>
      </RevealOnScroll>

      <!-- One section per feature, each with its own demo -->
      <section class="premium__rows">
        <RevealOnScroll v-for="(f, i) in c.features" :key="f.id">
          <div class="premium__row" :class="{ 'premium__row--rev': i % 2 === 1 }">
            <div class="premium__row-copy">
              <span class="premium__row-tag">{{ tagFor(f.id) }}</span>
              <h2>{{ f.title }}</h2>
              <p>{{ f.text }}</p>
            </div>
            <div class="premium__row-demo">
              <!-- Advanced AI Coach: free vs pro -->
              <div v-if="f.id === 'coach'" class="demo-compare">
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

              <!-- Clip analysis: mock upload → annotated frame -->
              <div v-else-if="f.id === 'clip'" class="demo-clip">
                <div class="demo-clip__frame">
                  <div class="demo-clip__pitch"></div>
                  <span class="demo-clip__pin demo-clip__pin--a" style="left:30%;top:60%">YOU</span>
                  <span class="demo-clip__pin demo-clip__pin--b" style="left:64%;top:34%">SPACE</span>
                  <svg class="demo-clip__run" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="30" y1="60" x2="64" y2="34" /></svg>
                </div>
                <div class="demo-bubble demo-bubble--pro demo-clip__note">
                  <p>You held your run a beat too long — start the bend earlier and you arrive onside into the space.</p>
                </div>
              </div>

              <!-- Pro badge: mock feed card row -->
              <div v-else-if="f.id === 'badge'" class="demo-badge">
                <div class="demo-badge__avatar">MR</div>
                <div class="demo-badge__id">
                  <span class="demo-badge__namerow"><span class="demo-badge__name">Marco R.</span><ProBadge small /></span>
                  <span class="demo-badge__meta">Striker · Today</span>
                </div>
                <span class="demo-badge__result">W</span>
              </div>

              <!-- Make it yours: live colour customizer -->
              <div v-else-if="f.id === 'accent'" class="demo-accent" :style="demoStyle">
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

              <!-- Early access: what's new teaser -->
              <div v-else class="demo-early">
                <div v-for="item in earlyItems" :key="item.t" class="demo-early__item">
                  <span class="demo-early__dot" :class="`is-${item.s}`"></span>
                  <div><strong>{{ item.t }}</strong><span>{{ item.s === 'live' ? 'Shipped to Pro first' : 'Coming soon' }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <!-- Pricing with months slider -->
      <RevealOnScroll>
        <section class="premium__pricing">
          <h2 class="premium__pricing-title">Pick your plan</h2>
          <p class="premium__pricing-sub">{{ c.pricing.note }}</p>

          <div class="premium__price">
            <span class="premium__price-amount">{{ cur }}{{ perMonthDisplay }}</span>
            <span class="premium__price-per">/month</span>
            <span v-if="savePct > 0" class="premium__price-save">Save {{ savePct }}%</span>
          </div>
          <p class="premium__price-total">{{ months }} {{ months === 1 ? 'month' : 'months' }} · <strong>{{ cur }}{{ totalDisplay }}</strong> total</p>

          <input type="range" class="premium__slider" min="1" max="24" step="1" v-model.number="months" :style="{ '--fill': fillPct + '%' }" aria-label="Number of months" />
          <div class="premium__slider-scale"><span>1 mo</span><span>12 mo</span><span>24 mo</span></div>

          <button type="button" class="premium__cta" :class="{ 'is-done': notified }" @click="notify">
            {{ notified ? "You're on the list ✓" : c.cta.label }}
          </button>
          <p class="premium__fineprint">{{ c.cta.fineprint }}</p>
        </section>
      </RevealOnScroll>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { content, loadKey } from '../../lib/siteContent'
import { ResolveSession } from '../../lib/authSession'
import RevealOnScroll from '../home/RevealOnScroll.vue'
import ProBadge from '../ui/ProBadge.vue'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const router = useRouter()

const c = computed(() => content.value.premium)

const tags = { coach: 'AI Coach', clip: 'Video', badge: 'Status', accent: 'Personalize', early: 'Early access' }
const tagFor = (id) => tags[id] || 'Pro'

const earlyItems = [
  { t: 'Clip analysis', s: 'live' },
  { t: 'Opponent scouting reports', s: 'soon' },
  { t: 'Season percentile benchmarks', s: 'soon' }
]

// ── Colour demo ────────────────────────────────────────────────────
const swatches = ['#4cda9c', '#4f9dff', '#a855f7', '#ff7a45', '#f5c451', '#ff5470']
const demoColor = ref('#4cda9c')
const demoStyle = computed(() => ({
  '--demo-accent': demoColor.value,
  '--demo-soft': `color-mix(in srgb, ${demoColor.value} 16%, transparent)`,
  '--demo-border': `color-mix(in srgb, ${demoColor.value} 36%, transparent)`
}))

// ── Pricing (from editable content) ────────────────────────────────
const cur = computed(() => c.value.pricing.currency || '$')
const months = ref(12)
const perMonthRaw = computed(() => {
  const p = c.value.pricing
  const A1 = p.base, A12 = p.year / 12, A24 = p.floor
  const m = months.value
  if (m <= 12) return A1 + (A12 - A1) * (m - 1) / 11
  return A12 + (A24 - A12) * (m - 12) / 12
})
const perMonthDisplay = computed(() => perMonthRaw.value.toFixed(2))
const totalDisplay = computed(() => (perMonthRaw.value * months.value).toFixed(2))
const savePct = computed(() => Math.round((1 - perMonthRaw.value / c.value.pricing.base) * 100))
const fillPct = computed(() => ((months.value - 1) / 23) * 100)

// ── Waitlist (no real purchase) ────────────────────────────────────
const notified = ref(false)
const notify = async () => {
  if (props.previewMode) { notified.value = true; return }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }
  // Idempotent: don't stack a new row every click — only add if not already on
  // the list. Mark as notified only after the write actually succeeds.
  const { data: existing } = await supabase
    .from('waitlist').select('id').eq('user_id', user.id).limit(1)
  if (!existing || existing.length === 0) {
    const { error } = await supabase.from('waitlist').insert({ user_id: user.id, email: user.email })
    if (error) { console.error('Waitlist insert failed:', error); return }
  }
  notified.value = true
}

onMounted(async () => {
  if (props.previewMode) { loadKey('premium'); return }
  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  loadKey('premium')
})
</script>

<style scoped>
.premium {
  position: relative;
  min-height: 100vh;
  background: var(--app-page-bg);
  color: var(--color-text-primary);
  padding: 110px 20px 90px;
  overflow: hidden;
}
.premium__glow {
  position: absolute;
  top: -120px; left: 50%;
  width: 600px; height: 600px;
  transform: translateX(-50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 60%);
  pointer-events: none;
  animation: premium-pulse 6s ease-in-out infinite;
}
@keyframes premium-pulse { 0%,100% { opacity: 0.55; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.12); } }

.premium__wrap { position: relative; max-width: 900px; margin: 0 auto; }

/* Hero */
.premium__hero { text-align: center; margin-bottom: var(--space-8); }
.premium__badge {
  display: inline-block; margin-bottom: var(--space-4);
  padding: 6px 16px; border-radius: var(--radius-pill);
  background: var(--color-accent);
  background-size: 200% 100%;
  color: var(--color-on-accent); font-size: var(--font-size-xs); font-weight: var(--font-weight-heavy); letter-spacing: 0.18em;
  animation: premium-shimmer 4s linear infinite;
}
@keyframes premium-shimmer { to { background-position: 200% 0; } }
.premium__title { margin: 0 0 var(--space-4); font-size: clamp(2.4rem, 8vw, 3.6rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.03em; line-height: 1.04; }
.premium__title-grad { background: var(--color-accent); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.premium__sub { margin: 0 auto; max-width: 540px; color: var(--color-text-muted); font-size: var(--font-size-md); line-height: 1.6; }

/* Feature rows */
.premium__rows { display: flex; flex-direction: column; gap: var(--space-8); margin-bottom: var(--space-8); }
.premium__row { display: grid; grid-template-columns: 1fr; gap: var(--space-5); align-items: center; }
.premium__row-tag {
  display: inline-block; margin-bottom: 10px; padding: 4px 12px; border-radius: var(--radius-pill);
  background: var(--color-accent-soft); border: 1px solid var(--color-accent-border); color: var(--color-accent);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.08em;
}
.premium__row-copy h2 { margin: 0 0 10px; font-size: clamp(1.5rem, 4vw, 2rem); font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; }
.premium__row-copy p { margin: 0; color: var(--color-text-muted); line-height: 1.6; }
.premium__row-demo { display: flex; justify-content: center; }

/* Generic demo bubble */
.demo-bubble { padding: 13px 16px; border-radius: var(--radius-lg); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); color: var(--color-text-secondary); line-height: 1.55; font-size: var(--font-size-sm); }
.demo-bubble--pro { border-color: var(--color-accent-border); box-shadow: 0 4px 22px color-mix(in srgb, var(--color-accent) 12%, transparent); }
.demo-bubble p { margin: 0 0 8px; }
.demo-bubble p:last-child { margin-bottom: 0; }

/* Coach compare */
.demo-compare { display: grid; grid-template-columns: 1fr; gap: var(--space-3); width: 100%; max-width: 420px; }
.demo-compare__col { display: flex; flex-direction: column; gap: 6px; }
.demo-compare__tag { align-self: flex-start; padding: 3px 10px; border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.06em; }
.demo-compare__tag--free { background: var(--color-bg-surface-3); color: var(--color-text-muted); }
.demo-compare__tag--pro { background: var(--color-accent); color: var(--color-on-accent); }

/* Clip */
.demo-clip { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: var(--space-3); }
.demo-clip__frame { position: relative; aspect-ratio: 16/10; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-soft); }
.demo-clip__pitch { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(34,80,50,0.5), rgba(16,19,22,0.95)), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 40px); }
.demo-clip__pin { position: absolute; transform: translate(-50%, -50%); padding: 2px 7px; border-radius: var(--radius-pill); font-size: 0.55rem; font-weight: var(--font-weight-heavy); letter-spacing: 0.04em; z-index: 2; }
.demo-clip__pin--a { background: var(--color-accent); color: var(--color-on-accent); box-shadow: 0 0 0 4px var(--color-accent-soft); }
.demo-clip__pin--b { background: var(--color-info); color: #fff; box-shadow: 0 0 0 4px var(--color-info-bg); }
.demo-clip__run { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
.demo-clip__run line { stroke: rgba(255,255,255,0.5); stroke-width: 0.6; stroke-dasharray: 3 2; }
.demo-clip__note p { margin: 0; }

/* Badge */
.demo-badge { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 360px; padding: var(--space-4); background: linear-gradient(160deg, rgba(255,255,255,0.04), rgba(15,18,20,0.92)); border: 1px solid var(--color-accent-border); border-radius: var(--radius-lg); }
.demo-badge__avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--color-accent); color: var(--color-on-accent); font-weight: var(--font-weight-bold); }
.demo-badge__id { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.demo-badge__namerow { display: flex; align-items: center; gap: 6px; }
.demo-badge__name { font-weight: var(--font-weight-semibold); }
.demo-badge__meta { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.demo-badge__result { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--color-success-bg); color: var(--color-success); font-weight: var(--font-weight-heavy); font-size: var(--font-size-sm); }

/* Accent customizer */
.demo-accent { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: var(--space-4); }
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

/* Early access */
.demo-early { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: var(--space-3); }
.demo-early__item { display: flex; align-items: center; gap: 12px; padding: var(--space-3) var(--space-4); background: var(--color-bg-surface-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.demo-early__dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.demo-early__dot.is-live { background: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.demo-early__dot.is-soon { background: var(--color-text-faint); }
.demo-early__item div { display: flex; flex-direction: column; }
.demo-early__item strong { font-size: var(--font-size-sm); }
.demo-early__item span { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Pricing */
.premium__pricing { max-width: 560px; margin: 0 auto; text-align: center; padding: var(--space-7) var(--space-6); background: linear-gradient(160deg, color-mix(in srgb, var(--color-accent) 8%, transparent), rgba(15,18,20,0.9)); border: 1px solid var(--color-accent-border); border-radius: var(--radius-xl); }
.premium__pricing-title { margin: 0 0 4px; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.premium__pricing-sub { margin: 0 0 var(--space-6); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.premium__price { display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.premium__price-amount { font-size: 3.2rem; font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; line-height: 1; }
.premium__price-per { color: var(--color-text-muted); font-size: var(--font-size-md); }
.premium__price-save { margin-left: 6px; padding: 3px 9px; border-radius: var(--radius-pill); background: var(--color-accent); color: var(--color-on-accent); font-size: var(--font-size-xs); font-weight: var(--font-weight-heavy); }
.premium__price-total { margin: var(--space-2) 0 var(--space-5); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.premium__price-total strong { color: var(--color-text-primary); }
.premium__slider { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: var(--radius-pill); background: linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) var(--fill), var(--color-bg-surface-3) var(--fill), var(--color-bg-surface-3) 100%); cursor: pointer; outline: none; }
.premium__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid var(--color-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; }
.premium__slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid var(--color-accent); cursor: pointer; }
.premium__slider-scale { display: flex; justify-content: space-between; margin-top: 8px; font-size: var(--font-size-xs); color: var(--color-text-faint); }
.premium__cta { width: 100%; margin-top: var(--space-6); padding: 15px; border: none; border-radius: var(--radius-pill); background: var(--color-accent); color: var(--color-on-accent); font-size: var(--font-size-base); font-weight: var(--font-weight-bold); font-family: inherit; cursor: pointer; transition: background 0.2s ease, transform 0.15s ease; }
.premium__cta:hover { transform: translateY(-2px); background: var(--color-brand-fg); }
.premium__cta.is-done { background: var(--color-bg-surface-3); color: var(--color-accent); cursor: default; transform: none; }
.premium__fineprint { margin: var(--space-3) 0 0; color: var(--color-text-faint); font-size: var(--font-size-xs); }

@media (min-width: 720px) {
  .premium__row { grid-template-columns: 1fr 1fr; gap: var(--space-7); }
  .premium__row--rev .premium__row-copy { order: 2; }
  .demo-compare { grid-template-columns: 1fr 1fr; max-width: none; }
}

@media (prefers-reduced-motion: reduce) {
  .premium__glow, .premium__badge { animation: none; }
}
</style>
