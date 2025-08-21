<template>
  <div class="login">
    <div class="login-container">
      <div class="card">
        <h2 class="login-title">Welcome Back! ⚽</h2>
        <p class="login-subtitle">Sign in to your Soccer Lab account</p>
        
        <form @submit.prevent="handleLogin" v-if="!isSignUp">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="email"
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" class="btn btn-full" :disabled="loading">
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <form @submit.prevent="handleSignUp" v-else>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="email"
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              required
              placeholder="Enter your password (min. 6 characters)"
            />
          </div>
          
          <button type="submit" class="btn btn-full" :disabled="loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="login-divider">
          <span>or</span>
        </div>

        <button @click="signInWithGoogle" class="btn btn-google" :disabled="loading">
          🔍 Continue with Google
        </button>

        <div class="login-switch">
          <p v-if="!isSignUp">
            Don't have an account? 
            <button @click="isSignUp = true" class="link-btn">Create one</button>
          </p>
          <p v-else>
            Already have an account? 
            <button @click="isSignUp = false" class="link-btn">Sign in</button>
          </p>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="message" class="success-message">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const error = ref('')
    const message = ref('')
    const isSignUp = ref(false)

    const handleLogin = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        })

        if (loginError) throw loginError

        message.value = 'Successfully signed in!'
        router.push('/dashboard')
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const handleSignUp = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const { data, error: signUpError } = await supabase.auth.signUp({
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
        
        const { data, error: googleError } = await supabase.auth.signInWithOAuth({
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
      isSignUp,
      handleLogin,
      handleSignUp,
      signInWithGoogle
    }
  }
}
</script>

<style scoped>
.login {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.login-subtitle {
  text-align: center;
  color: #6c757d;
  margin-bottom: 2rem;
}

.btn-full {
  width: 100%;
  margin-bottom: 1rem;
}

.btn-google {
  width: 100%;
  background: #db4437;
  margin-bottom: 1rem;
}

.btn-google:hover {
  background: #c23321;
}

.login-divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e9ecef;
}

.login-divider span {
  background: white;
  padding: 0 1rem;
  color: #6c757d;
  font-size: 14px;
}

.login-switch {
  text-align: center;
  margin-top: 1.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.link-btn:hover {
  color: #45a049;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}
</style>
