<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <h2 class="login-title">Create Account</h2>
        <p class="login-subtitle">Join the Lab</p>
        
        <form @submit.prevent="handleSignUp">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" required placeholder="you@email.com" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>

        <div class="login-divider"><span>or</span></div>

        <button @click="signInWithGoogle" class="btn btn-google" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="google-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 1 0 12 2z"></path><path d="M4 12.5c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.29-.31 2.52-.86 3.64M12 12h0"></path></svg>
          Continue with Google
        </button>

        <div class="login-switch">
          <p>
            Already have an account? 
            <router-link to="/login" class="link-btn">Sign in</router-link>
          </p>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="message" class="success-message">{{ message }}</div>
      </div>
    </div>
    <div class="hero-glow"></div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export default {
  name: 'SignUp',
  setup() {
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const error = ref('')
    const message = ref('')

    const handleSignUp = async () => {
      try {
        loading.value = true
        error.value = ''
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        })
        if (signUpError) throw signUpError
        message.value = 'Check your email for the confirmation link!'
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const signInWithGoogle = async () => {
      try {
        loading.value = true
        error.value = ''
        const { error: googleError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/mysoccerlab/dashboard'
          }
        })
        if (googleError) throw googleError
      } catch (err) {
        error.value = err.message
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      error,
      message,
      handleSignUp,
      signInWithGoogle
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #050505;
  position: relative;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0) 60%);
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  animation: pulse 8s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.login-container {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 2;
}

.login-card {
  background: #111;
  padding: 2.5rem;
  border-radius: 16px;
  border: 1px solid #222;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #aaa;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #f0f0f0;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.btn {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-google {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
}

.btn-google:hover {
  background: #1a1a1a;
  border-color: #555;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.login-divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #555;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.login-divider::before, .login-divider::after {
  content: '';
  flex-grow: 1;
  height: 1px;
  background: #333;
}

.login-switch {
  text-align: center;
  margin-top: 1.5rem;
  color: #888;
}

.link-btn {
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.link-btn:hover {
  text-decoration: underline;
}

.error-message, .success-message {
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1.5rem;
  text-align: center;
}

.error-message {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.2);
}

.success-message {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.2);
}
</style>
