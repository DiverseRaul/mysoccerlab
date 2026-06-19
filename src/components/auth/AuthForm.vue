<template>
  <div class="auth-page">
    <div class="auth-card" data-testid="auth-card">
      <p class="auth-eyebrow">My Soccer Lab</p>
      <h1 class="auth-title">{{ IsLogin ? 'Welcome back' : 'Create your account' }}</h1>
      <p class="auth-sub">{{ IsLogin ? 'Pick up your season where you left it.' : 'Your matches deserve better than memory.' }}</p>

      <button type="button" class="auth-google" data-testid="auth-google" :disabled="Loading" @click="SignInWithGoogle">
        <svg class="auth-google__logo" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

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
              <svg v-if="!ShowPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
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
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 16px 48px;
  background: var(--app-page-bg);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 28px 28px;
  background: var(--color-bg-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  animation: auth-card-in 0.45s ease-out;
}

@keyframes auth-card-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-eyebrow {
  margin: 0 0 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.auth-title {
  margin: 0 0 6px;
  font-size: 1.75rem;
  font-weight: var(--font-weight-heavy);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.auth-sub {
  margin: 0 0 24px;
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
  opacity: 0.6;
  cursor: default;
}

.auth-google__logo {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
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

.auth-password__toggle svg {
  width: 20px;
  height: 20px;
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
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent-deep) 40%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--color-accent-deep) 50%, transparent);
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

@media (max-width: 480px) {
  .auth-page {
    padding-top: 100px;
    align-items: flex-start;
  }

  .auth-card {
    padding: 28px 20px 22px;
  }
}
</style>
