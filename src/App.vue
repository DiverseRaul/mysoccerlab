<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="logo">my soccer lab</h1>

        <!-- Desktop Nav -->
        <div class="nav-links desktop-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/login" class="nav-link" v-if="!user">Login</router-link>
          <router-link to="/signup" class="nav-link" v-if="!user">Sign Up</router-link>
          <router-link to="/dashboard" class="nav-link" v-if="user">Dashboard</router-link>
          <router-link to="/profile" class="nav-link" v-if="user">Profile</router-link>
          <button @click="signOut" class="nav-link logout-btn" v-if="user">Logout</button>
        </div>

        <!-- Mobile Nav Toggle -->
        <button @click="toggleMobileMenu" class="mobile-nav-toggle" :class="{ 'is-active': isMobileMenuOpen }">
          <span class="hamburger-box">
            <span class="hamburger-inner"></span>
          </span>
        </button>

      </div>
    </nav>

    <!-- Mobile Nav Dropdown -->
    <div class="mobile-nav-dropdown" :class="{ 'is-open': isMobileMenuOpen }">
      <router-link to="/" class="nav-link">Home</router-link>
      <router-link to="/login" class="nav-link" v-if="!user">Login</router-link>
      <router-link to="/signup" class="nav-link" v-if="!user">Sign Up</router-link>
      <router-link to="/dashboard" class="nav-link" v-if="user">Dashboard</router-link>
      <router-link to="/profile" class="nav-link" v-if="user">Profile</router-link>
      <button @click="signOutAndCloseMenu" class="nav-link logout-btn" v-if="user">Logout</button>
    </div>

    <main class="main-content">
      <router-view />
    </main>

    <app-footer />
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from './lib/supabase'
import AppFooter from './components/Footer.vue'

export default {
  name: 'App',
  components: {
    AppFooter
  },
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

    const isMobileMenuOpen = ref(false)
    const route = useRoute()

    const toggleMobileMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
    }

    const signOut = async () => {
      await supabase.auth.signOut()
    }

    const signOutAndCloseMenu = async () => {
      await signOut();
      isMobileMenuOpen.value = false;
    }

    // Watch for route changes to close the mobile menu
    watch(() => route.path, () => {
      isMobileMenuOpen.value = false
    })

    return {
      user,
      signOut,
      isMobileMenuOpen,
      toggleMobileMenu,
      signOutAndCloseMenu
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
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 75%;
  max-width: 1200px;
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(20px);
  padding: 0.75rem 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
  z-index: 100;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: top 0.3s ease, width 0.3s ease;
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
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  color: white;
  background: rgba(76, 175, 80, 0.25);
}

.logout-btn {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(255, 71, 87, 0.4);
  color: white;
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

.mobile-nav-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;
}

.hamburger-box {
  width: 30px;
  height: 24px;
  display: inline-block;
  position: relative;
}

.hamburger-inner,
.hamburger-inner::before,
.hamburger-inner::after {
  width: 30px;
  height: 2px;
  background-color: white;
  border-radius: 4px;
  position: absolute;
  transition-property: transform;
  transition-duration: 0.15s;
  transition-timing-function: ease;
}

.hamburger-inner {
  top: 50%;
  transform: translateY(-50%);
}

.hamburger-inner::before,
.hamburger-inner::after {
  content: '';
  display: block;
}

.hamburger-inner::before {
  top: -10px;
}

.hamburger-inner::after {
  bottom: -10px;
}

.mobile-nav-toggle.is-active .hamburger-inner {
  transform: rotate(45deg);
}
.mobile-nav-toggle.is-active .hamburger-inner::before {
  top: 0;
  opacity: 0;
}
.mobile-nav-toggle.is-active .hamburger-inner::after {
  bottom: 0;
  transform: rotate(-90deg);
}

.mobile-nav-dropdown {
  display: none; /* Hidden by default, shown in mobile media query */
  position: fixed;
  top: calc(2rem + 60px); /* Position below the navbar (1rem top + navbar height) */
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  z-index: 99;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(15px);
  border-radius: 35px;
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out, padding 0.3s ease;
}

.mobile-nav-dropdown.is-open {
  padding: 1rem;
  max-height: 500px; /* A large enough value to show all items */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-nav-dropdown .nav-link {
  width: 100%;
  text-align: center;
}


@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
  }

  .desktop-links {
    display: none;
  }

  .mobile-nav-toggle {
    display: block;
  }

  .navbar {
    width: 90%;
    top: 1rem;
    padding-bottom: 0.75rem;
  }

  .mobile-nav-dropdown {
    display: flex;
  }
}
</style>
