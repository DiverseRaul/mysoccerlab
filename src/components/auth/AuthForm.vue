<template>
  <div class="auth">
    <!-- Faint, static brand backdrop — a soft aurora wash + dot veil that echoes
         the home hero without the heavy WebGL shader. Drifts very slowly so it's
         alive but never competes with the form. -->
    <div class="auth__bg" aria-hidden="true">
      <span class="auth__aurora"></span>
      <span class="auth__dots"></span>
    </div>

    <div class="auth__inner">
      <!-- Editorial brand side — carries the home page's bold display headline
           with an outlined accent line. Collapses to a compact header on mobile. -->
      <section class="auth__brand">
        <p class="auth__kicker">My Soccer Lab</p>
        <h1 class="auth__display">
          <span class="auth__display-line">{{ headline.top }}</span>
          <span class="auth__display-line auth__display-line--outline">{{ headline.accent }}</span>
        </h1>
        <ul class="auth__points">
          <li v-for="point in points" :key="point">
            <i class="ph ph-check-circle" aria-hidden="true"></i>{{ point }}
          </li>
        </ul>
      </section>

      <!-- Form side -->
      <section class="auth__panel">
        <div class="auth-card" data-testid="auth-card">
          <h2 class="auth-card__title">{{ IsLogin ? 'Sign in' : 'Create account' }}</h2>
          <p class="auth-card__sub">{{ IsLogin ? 'Enter your details to continue.' : 'Set up your free account in seconds.' }}</p>

          <!-- Google OAuth is wired up but paused while the provider config is
               finished — disabled with a clear note rather than failing on click. -->
          <button type="button" class="auth-google" data-testid="auth-google" disabled aria-disabled="true">
            <svg class="auth-google__logo" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
            <span class="auth-google__badge">Soon</span>
          </button>
          <p class="auth-google-note">Google sign-in is temporarily unavailable — use your email below.</p>

          <div class="auth-divider"><span>or with email</span></div>

          <form class="auth-form" @submit.prevent="Submit">
            <div class="auth-field">
              <label class="auth-label" for="auth-email">Email</label>
              <input
                id="auth-email"
                v-model.trim="Email"
                class="auth-input"
                type="email"
                name="email"
                autocomplete="email"
                required
                placeholder="you@email.com"
              />
            </div>

            <div class="auth-field">
              <label class="auth-label" for="auth-password">Password</label>
              <div class="auth-password">
                <input
                  id="auth-password"
                  v-model="Password"
                  class="auth-input"
                  :type="ShowPassword ? 'text' : 'password'"
                  name="password"
                  :autocomplete="IsLogin ? 'current-password' : 'new-password'"
                  required
                  :minlength="IsLogin ? undefined : 6"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="auth-password__toggle"
                  :aria-label="ShowPassword ? 'Hide password' : 'Show password'"
                  data-testid="auth-toggle-password"
                  @click="ShowPassword = !ShowPassword"
                >
                  <i v-if="!ShowPassword" class="ph ph-eye" aria-hidden="true"></i>
                  <i v-else class="ph ph-eye-slash" aria-hidden="true"></i>
                </button>
              </div>
              <p v-if="!IsLogin" class="auth-field-hint">At least 6 characters.</p>
            </div>

            <button type="submit" class="auth-submit" :disabled="Loading" data-testid="auth-submit">
              <span v-if="Loading" class="auth-spinner" aria-hidden="true"></span>
              {{ Loading ? (IsLogin ? 'Signing in…' : 'Creating account…') : (IsLogin ? 'Sign in' : 'Create account') }}
            </button>
          </form>

          <p v-if="ErrorMessage" class="auth-notice auth-notice--error" role="alert" data-testid="auth-error">{{ ErrorMessage }}</p>
          <p v-if="SuccessMessage" class="auth-notice auth-notice--success" role="status" data-testid="auth-success">{{ SuccessMessage }}</p>

          <p class="auth-switch">
            {{ IsLogin ? "Don't have an account?" : 'Already have an account?' }}
            <router-link :to="IsLogin ? '/signup' : '/login'" class="auth-switch__link">
              {{ IsLogin ? 'Sign up' : 'Sign in' }}
            </router-link>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const Props = defineProps({
  Mode: {
    type: String,
    default: 'login',
    validator: (Value) => ['login', 'signup'].includes(Value)
  }
})

const Router = useRouter()
const IsLogin = computed(() => Props.Mode === 'login')

// Display headline mirrors the home hero's two-line, outlined-accent treatment.
// The accessible name resolves to "Welcome back." / "Create your account." so it
// reads as one heading.
const headline = computed(() => IsLogin.value
  ? { top: 'Welcome', accent: 'back.' }
  : { top: 'Create your', accent: 'account.' })

// Value points echo the home feature copy — kept short and scannable.
const points = [
  'Honest match ratings on a 1-10 scale',
  'Shot maps, xG and position heatmaps',
  'An AI coach built around your game'
]

const Email = ref('')
const Password = ref('')
const ShowPassword = ref(false)
const Loading = ref(false)
const ErrorMessage = ref('')
const SuccessMessage = ref('')

const Submit = async () => {
  Loading.value = true
  ErrorMessage.value = ''
  SuccessMessage.value = ''
  try {
    if (IsLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({
        email: Email.value,
        password: Password.value
      })
      if (error) throw error
      Router.push('/dashboard')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: Email.value,
        password: Password.value
      })
      if (error) throw error
      if (data.session) {
        Router.push('/dashboard')
      } else {
        SuccessMessage.value = 'Check your email for the confirmation link!'
      }
    }
  } catch (Err) {
    ErrorMessage.value = Err.message
  } finally {
    Loading.value = false
  }
}

const SignInWithGoogle = async () => {
  Loading.value = true
  ErrorMessage.value = ''
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (error) throw error
    // On success the browser navigates away to Google; leave Loading on.
  } catch (Err) {
    ErrorMessage.value = Err.message
    Loading.value = false
  }
}
</script>

<style scoped>
/* ── Shell ──────────────────────────────────────────────────────────
   Editorial split: a bold brand column + the form card, over the shared
   app backdrop with only a faint aurora hint of the home hero. */
.auth {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
}

.auth__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--app-page-bg);
}

/* Soft coloured wash — the home palette (green → teal → violet) at low opacity,
   heavily blurred and drifting slowly. Faint by design. */
.auth__aurora {
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(38% 48% at 16% 22%, color-mix(in srgb, var(--color-accent) 26%, transparent), transparent 70%),
    radial-gradient(44% 52% at 84% 26%, color-mix(in srgb, #7c5cff 18%, transparent), transparent 72%),
    radial-gradient(50% 55% at 60% 104%, color-mix(in srgb, #19c6c0 16%, transparent), transparent 70%);
  filter: blur(34px);
  opacity: 0.55;
  animation: auth-drift 26s ease-in-out infinite alternate;
}

@keyframes auth-drift {
  from { transform: translate3d(-1.5%, -1%, 0) scale(1.02); }
  to   { transform: translate3d(1.5%, 1%, 0) scale(1.06); }
}

/* Fine dot grid, faded from the top — the home "falling" texture, stilled. */
.auth__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(125% 80% at 50% 0%, #000 0%, transparent 72%);
  mask-image: radial-gradient(125% 80% at 50% 0%, #000 0%, transparent 72%);
  opacity: 0.6;
}

.auth__inner {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  max-width: 1140px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
  gap: clamp(26px, 5vw, 40px);
  padding: 104px 20px calc(96px + env(safe-area-inset-bottom));
}

/* ── Brand / editorial column ─────────────────────────────────────── */
.auth__brand {
  max-width: 560px;
  animation: auth-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.auth__kicker {
  margin: 0 0 14px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.auth__display {
  margin: 0;
  font-family: var(--font-family-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.96;
  font-size: clamp(2.3rem, 6vw, 4.4rem);
  color: var(--color-text-primary);
}

.auth__display-line { display: block; }

/* Outlined second line — hollow letters stroked in the brand green, matching
   the home hero's headline treatment. */
.auth__display-line--outline {
  color: transparent;
  -webkit-text-stroke: 2px var(--color-accent);
  text-stroke: 2px var(--color-accent);
}

.auth__points {
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.auth__points li {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.auth__points i {
  flex: 0 0 auto;
  font-size: 20px;
  color: var(--color-accent);
}

/* ── Form column ──────────────────────────────────────────────────── */
.auth__panel {
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: clamp(26px, 4vw, 34px) clamp(22px, 3vw, 30px) clamp(24px, 3vw, 28px);
  background: var(--color-bg-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  animation: auth-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}

@keyframes auth-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-card__title {
  margin: 0 0 6px;
  font-family: var(--font-family-display);
  font-size: 1.55rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.auth-card__sub {
  margin: 0 0 22px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.auth-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.auth-google:hover:not(:disabled) {
  border-color: var(--color-accent-border);
  background: var(--color-accent-soft);
  transform: translateY(-1px);
}

.auth-google:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-google:disabled:hover {
  border-color: var(--color-border-soft);
  background: var(--color-bg-surface-2);
  transform: none;
}

.auth-google__logo {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

/* "Soon" pill on the paused Google button. */
.auth-google__badge {
  margin-left: 2px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-surface-3);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-google-note {
  margin: 8px 0 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  line-height: 1.4;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.auth-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.auth-input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-input::placeholder {
  color: var(--color-text-faint);
}

.auth-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.auth-password {
  position: relative;
}

.auth-password .auth-input {
  padding-right: 52px;
}

.auth-password__toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease;
}

.auth-password__toggle:hover {
  color: var(--color-text-primary);
}

.auth-password__toggle i {
  font-size: 20px;
}

.auth-field-hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}

.auth-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 50px;
  margin-top: 4px;
  padding: 13px 16px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-pill);
  color: var(--color-on-accent);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.auth-submit:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 88%, white);
  transform: translateY(-1px);
}

.auth-submit:active:not(:disabled) {
  transform: translateY(0);
  background: var(--color-accent-strong);
}

.auth-submit:disabled {
  opacity: 0.7;
  cursor: default;
}

.auth-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, var(--color-on-accent) 30%, transparent);
  border-top-color: var(--color-on-accent);
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}

.auth-notice {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  text-align: center;
  line-height: 1.45;
}

.auth-notice--error {
  background: var(--color-danger-bg);
  border: 1px solid rgba(239, 83, 80, 0.3);
  color: var(--color-danger);
}

.auth-notice--success {
  background: var(--color-success-bg);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
}

.auth-switch {
  margin: 22px 0 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.auth-switch__link {
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.auth-switch__link:hover {
  text-decoration: underline;
}

/* ── Desktop split ────────────────────────────────────────────────── */
@media (min-width: 900px) {
  .auth__inner {
    grid-template-columns: 1.05fr 0.95fr;
    align-items: center;
    align-content: center;
    gap: clamp(48px, 7vw, 104px);
    padding: 120px clamp(32px, 6vw, 72px) 72px;
  }
}

/* ── Mobile: compact brand header above the form ──────────────────── */
@media (max-width: 899px) {
  .auth__display {
    font-size: clamp(2rem, 9vw, 2.9rem);
  }
  /* Bullets are nice-to-have context; drop them so the form stays the focus. */
  .auth__points {
    display: none;
  }
}

@media (max-width: 480px) {
  .auth__inner {
    padding-top: 92px;
    gap: 22px;
  }
  .auth-card {
    padding: 24px 20px 22px;
  }
}
</style>
