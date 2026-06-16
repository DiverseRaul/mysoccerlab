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
          <router-link to="/feed" class="nav-link" v-if="user">The Pitch</router-link>
          <router-link to="/coach" class="nav-link nav-link--coach" v-if="user">
            <svg class="nav-coach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>AI Coach
          </router-link>
          <router-link to="/premium" class="nav-link nav-link--pro" v-if="user">Lab Pro<span v-if="isPro" class="nav-pro-chip">PRO</span></router-link>
          
          <div class="nav-dropdown-wrapper" v-if="user" ref="profileDropdownRef">
            <button @click="isProfileDropdownOpen = !isProfileDropdownOpen" class="nav-link nav-profile-trigger" :class="{ 'is-active': isProfileDropdownOpen }">
              <img v-if="userAvatar" :src="userAvatar" class="nav-avatar" />
              <span v-else class="nav-avatar-placeholder">👤</span>
              <span>{{ userName || 'Profile' }}</span>
              <span class="nav-arrow" :class="{ 'is-open': isProfileDropdownOpen }">▼</span>
            </button>
            <div class="nav-dropdown" v-if="isProfileDropdownOpen">
              <router-link to="/profile" class="nav-dropdown-item" @click="isProfileDropdownOpen = false">My Profile</router-link>
              <router-link to="/admin" class="nav-dropdown-item" v-if="isAdmin" @click="isProfileDropdownOpen = false">Admin Portal</router-link>
              <div class="nav-dropdown-divider"></div>
              <button @click="signOut" class="nav-dropdown-item logout-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Nav Toggle -->
        <button @click="toggleMobileMenu" class="mobile-nav-toggle" :class="{ 'is-active': isMobileMenuOpen }" aria-label="Toggle menu">
          <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Mobile Nav Dropdown -->
        <Transition name="dropdown-fade">
          <div class="mobile-dropdown" v-if="isMobileMenuOpen">
            <router-link to="/" class="mobile-pill-link">Home</router-link>
            <router-link to="/login" class="mobile-pill-link" v-if="!user">Login</router-link>
            <router-link to="/signup" class="mobile-pill-link" v-if="!user">Sign Up</router-link>
            <router-link to="/dashboard" class="mobile-pill-link" v-if="user">Dashboard</router-link>
            <router-link to="/feed" class="mobile-pill-link" v-if="user">The Pitch</router-link>
            <router-link to="/coach" class="mobile-pill-link mobile-pill-link--coach" v-if="user">
              <svg class="nav-coach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>AI Coach
            </router-link>
            <router-link to="/premium" class="mobile-pill-link mobile-pill-link--pro" v-if="user">
              Lab Pro<span v-if="isPro" class="nav-pro-chip">PRO</span>
            </router-link>
            
            <!-- Profile Pill (clickable sub-menu dropdown) -->
            <div class="mobile-profile-wrapper" v-if="user">
              <button @click="isMobileProfileOpen = !isMobileProfileOpen" class="mobile-profile-card" :class="{ 'is-active': isMobileProfileOpen }">
                <img v-if="userAvatar" :src="userAvatar" class="mobile-avatar" />
                <span v-else class="mobile-avatar-placeholder">👤</span>
                <span class="mobile-profile-name">{{ userName || 'Player' }}</span>
                <span class="mobile-arrow" :class="{ 'is-open': isMobileProfileOpen }">▼</span>
              </button>
              <div class="mobile-sub-menu" v-if="isMobileProfileOpen">
                <router-link to="/profile" class="mobile-sub-button">My Profile</router-link>
                <router-link to="/admin" class="mobile-sub-button" v-if="isAdmin">Admin Portal</router-link>
                <button @click="signOutAndCloseMenu" class="mobile-sub-button logout-sub-button">
                  <svg class="logout-pill-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </Transition>

      </div>
    </nav>

    <!-- Mobile Nav Blur Overlay -->
    <Transition name="drawer-fade">
      <div class="mobile-drawer-overlay" v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false"></div>
    </Transition>

    <main class="main-content">
      <router-view />
    </main>

    <app-footer />

    <ToastHost />

  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from './lib/supabase'
import { ResolveSession } from './lib/authSession'
import AppFooter from './components/Footer.vue'
import ToastHost from './components/ui/ToastHost.vue'
import { isPro, isAdmin, loadEntitlements } from './lib/premium'

export default {
  name: 'App',
  components: {
    AppFooter,
    ToastHost
  },
  setup() {
    const user = ref(null)
    const userName = ref('')
    const userAvatar = ref('')
    const isProfileDropdownOpen = ref(false)
    const isMobileProfileOpen = ref(false)
    const profileDropdownRef = ref(null)

    const fetchUserProfile = async (uid) => {
      if (!uid) {
        userName.value = ''
        userAvatar.value = ''
        return
      }
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('player_name, avatar_url')
          .eq('user_id', uid)
          .single()
        if (data) {
          userName.value = data.player_name || user.value?.email?.split('@')[0] || 'Player'
          userAvatar.value = data.avatar_url || ''
        } else {
          userName.value = user.value?.email?.split('@')[0] || 'Player'
          userAvatar.value = ''
        }
      } catch (e) {
        userName.value = user.value?.email?.split('@')[0] || 'Player'
      }
    }

    onMounted(async () => {
      // Initial session for the navbar. Use the hardened ResolveSession (same as
      // Dashboard.vue) instead of a bare getSession(): on cold direct loads the
      // auth library can resolve null before hydrating from localStorage, which
      // made the navbar flash the logged-out links (Home/Login/Sign Up) while
      // the page itself rendered authenticated. ResolveSession retries when a
      // stored session exists, so the navbar and page agree.
      const session = await ResolveSession()
      user.value = session?.user || null
      loadEntitlements(user.value?.id || null)
      if (user.value) {
        fetchUserProfile(user.value.id)
      }

      // Listen for auth changes. IMPORTANT: this callback must NOT await (or
      // synchronously call) other supabase methods — doing so deadlocks the
      // auth library's internal lock, which makes later getSession()/queries
      // hang for many seconds or run before auth is ready (empty data). We just
      // set state here and defer any supabase work out of the callback.
      supabase.auth.onAuthStateChange((event, session) => {
        user.value = session?.user || null
        const uid = user.value?.id || null
        if (uid) {
          setTimeout(() => { loadEntitlements(uid); fetchUserProfile(uid) }, 0)
        } else {
          loadEntitlements(null)
          userName.value = ''
          userAvatar.value = ''
        }
      })
    })

    // Outside-click for the desktop profile dropdown — registered synchronously
    // (lifecycle hooks must not be set up after an await).
    const handleOutsideClick = (e) => {
      if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target)) {
        isProfileDropdownOpen.value = false
      }
    }
    onMounted(() => document.addEventListener('click', handleOutsideClick))
    onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))

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
      isProfileDropdownOpen.value = false
      isMobileProfileOpen.value = false
    })

    return {
      user,
      isPro,
      isAdmin,
      userName,
      userAvatar,
      isProfileDropdownOpen,
      isMobileProfileOpen,
      profileDropdownRef,
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
  /* 90% (capped at max-width) so the six links fit on mid-size screens; at 75%
     they overflowed until the window was very wide. */
  width: 90%;
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
  padding: 0 1rem;
  position: relative;
}

.logo {
  background: var(--color-accent);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  font-weight: bold;
  white-space: nowrap;   /* keep "my soccer lab" on one line so the bar stays short */
  flex: 0 0 auto;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  padding: 0.5rem 0.85rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;   /* labels like "The Pitch" / "Lab Pro" never wrap */
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  color: white;
  background: var(--color-accent-soft);
}

.nav-link--pro {
  gap: 6px;
}

/* AI Coach nav link — sparkle icon + label */
.nav-link--coach {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nav-coach-icon {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: var(--color-accent);
}

.nav-pro-chip {
  padding: 1px 6px;
  border-radius: 9999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1;
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

/* ── Desktop Profile Dropdown Styles ── */
.nav-dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.nav-profile-trigger {
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border-strong);
}

.nav-avatar-placeholder {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
}

.nav-arrow {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
  color: var(--color-text-muted);
}
.nav-arrow.is-open {
  transform: rotate(180deg);
}

.nav-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 8px;
  min-width: 180px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 250;
}

.nav-dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  box-sizing: border-box;
}

.nav-dropdown-item:hover {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}

.nav-dropdown-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 4px 0;
}

.logout-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger);
}
.logout-item svg { width: 15px; height: 15px; flex: 0 0 auto; }
.logout-item:hover {
  background: var(--color-danger-bg);
  color: #ff6b78;
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

/* Legacy global .btn / .btn-secondary removed — the design-system button
   classes live in src/styles/controls.css. These unscoped rules used to leak
   app-wide and override controls.css (e.g. turning .btn-danger green and
   .btn-secondary purple). Screens that need a button use controls.css variants
   or their own scoped styles (MatchManager's "+" counters, modal-shared.css). */

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
  border-color: var(--color-accent);
}

.mobile-nav-toggle {
  display: none;
  background: rgba(18, 18, 18, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  transition: all 0.25s ease;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.mobile-nav-toggle svg {
  transition: transform 0.25s ease;
}

.mobile-nav-toggle.is-active svg {
  transform: rotate(90deg);
}

.mobile-nav-toggle:hover,
.mobile-nav-toggle.is-active {
  background: var(--color-accent-soft, rgba(76, 175, 80, 0.25));
  border-color: var(--color-accent-border, rgba(76, 175, 80, 0.5));
  color: var(--color-accent, #4CAF50);
}

/* ── Mobile Nav Dropdown & Glassy Styles ── */
.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 99;
}

.mobile-dropdown {
  position: absolute;
  top: calc(100% + 30px);
  right: 0;
  width: auto;
  min-width: 220px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 150;
  transform-origin: top right;
}

/* Stagger entrance animations for dropdown items */
@keyframes staggerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mobile-dropdown > * {
  animation: staggerFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.mobile-dropdown > *:nth-child(1) { animation-delay: 0.02s; }
.mobile-dropdown > *:nth-child(2) { animation-delay: 0.06s; }
.mobile-dropdown > *:nth-child(3) { animation-delay: 0.10s; }
.mobile-dropdown > *:nth-child(4) { animation-delay: 0.14s; }
.mobile-dropdown > *:nth-child(5) { animation-delay: 0.18s; }
.mobile-dropdown > *:nth-child(6) { animation-delay: 0.22s; }

.mobile-sub-menu > * {
  animation: staggerFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.mobile-sub-menu > *:nth-child(1) { animation-delay: 0.02s; }
.mobile-sub-menu > *:nth-child(2) { animation-delay: 0.06s; }
.mobile-sub-menu > *:nth-child(3) { animation-delay: 0.10s; }

.mobile-pill-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px 20px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mobile-pill-link:hover,
.mobile-pill-link:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-1px);
}

.mobile-pill-link.router-link-active {
  background: var(--color-accent-soft, rgba(76, 175, 80, 0.25));
  border-color: var(--color-accent-border, rgba(76, 175, 80, 0.5));
  color: var(--color-accent, #4CAF50);
  box-shadow: 0 0 12px var(--color-accent-soft, rgba(76, 175, 80, 0.15));
}

.mobile-pill-link--pro {
  gap: 6px;
}

.mobile-pill-link--coach {
  gap: 6px;
}

.mobile-profile-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
}

.mobile-profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  border-radius: 9999px;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  max-width: 100%;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mobile-profile-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
}

.mobile-profile-card.is-active {
  background: rgba(18, 18, 18, 0.85);
  border-color: var(--color-accent, #4CAF50);
  box-shadow: 0 0 12px var(--color-accent-soft, rgba(76, 175, 80, 0.15));
}

.mobile-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.mobile-avatar-placeholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.mobile-profile-name {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-arrow {
  font-size: 0.6rem;
  transition: transform 0.2s ease;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 2px;
}
.mobile-arrow.is-open {
  transform: rotate(180deg);
}

.mobile-sub-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.mobile-sub-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 18px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  width: fit-content;
}

.mobile-sub-button:hover,
.mobile-sub-button:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.mobile-sub-button.router-link-active {
  background: var(--color-accent-soft, rgba(76, 175, 80, 0.25));
  border-color: var(--color-accent-border, rgba(76, 175, 80, 0.5));
  color: var(--color-accent, #4CAF50);
}

.logout-sub-button {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
  border-color: rgba(255, 71, 87, 0.2);
  gap: 6px;
  cursor: pointer;
  font-family: inherit;
}

.logout-sub-button:hover {
  background: rgba(255, 71, 87, 0.25);
  border-color: rgba(255, 71, 87, 0.35);
  color: #fff;
}

.logout-pill {
  color: #ff4757 !important;
  background: rgba(255, 71, 87, 0.1) !important;
  border-color: rgba(255, 71, 87, 0.15) !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.logout-pill:hover {
  background: rgba(255, 71, 87, 0.2) !important;
  border-color: rgba(255, 71, 87, 0.3) !important;
  color: #fff !important;
}

/* Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

@media (min-width: 1025px) and (max-width: 1100px) {
  .navbar {
    width: 94%;
  }
  .logo {
    font-size: 1.5rem;   /* slight shrink so the single-line bar fits without overflow */
  }
  .nav-links {
    gap: 0.6rem;
  }
  .nav-link {
    padding: 0.4rem 0.7rem;
    font-size: 0.88rem;
  }
}

/* Below 1024px the six desktop links cram and overflow, so collapse to the
   hamburger menu rather than shrinking them into an unreadable single line. */
@media (max-width: 1024px) {
  .nav-container {
    flex-wrap: wrap;
  }

  .desktop-links {
    display: none;
  }

  .mobile-nav-toggle {
    display: flex;
  }

  .navbar {
    width: 90%;
    top: 1rem;
    padding-bottom: 0.75rem;
  }
}
</style>
