<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="logo">My Soccer Lab</h1>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/login" class="nav-link" v-if="!user">Login</router-link>
          <router-link to="/dashboard" class="nav-link" v-if="user">Dashboard</router-link>
          <button @click="signOut" class="nav-link logout-btn" v-if="user">Logout</button>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabase'

export default {
  name: 'App',
  setup() {
    const user = ref(null)

    onMounted(async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        user.value = session?.user || null
      })
    })

    const signOut = async () => {
      await supabase.auth.signOut()
    }

    return {
      user,
      signOut
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  color: white;
  background: #0a0a0a;
}

.navbar {
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.logo {
  background: linear-gradient(45deg, #4CAF50, #81C784);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.nav-link.router-link-active {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.logout-btn {
  background: #ff4757;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #ff3742;
}

.main-content {
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c5ce7;
}

.btn-secondary:hover {
  background: #5f3dc4;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
}
</style>
