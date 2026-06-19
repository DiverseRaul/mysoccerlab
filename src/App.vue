<template>
  <div id="app">
    <nav class="navbar" @pointerdown="recordOrigin">
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
            <svg class="nav-coach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><circle cx="8.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/></svg>AI Coach
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
              <button @click="requestLogout" class="nav-dropdown-item logout-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    </nav>

    <!-- Transparent click-catcher to dismiss the account menu -->
    <Transition name="drawer-fade">
      <div class="account-scrim" v-if="user && isAccountOpen" @click="isAccountOpen = false"></div>
    </Transition>

    <!-- ── Mobile bottom nav: main pill + a separate account bubble ── -->
    <div class="mobile-nav" @pointerdown="recordOrigin">
      <nav class="bottom-nav" data-testid="bottom-nav" aria-label="Primary">
        <template v-if="user">
          <router-link to="/dashboard" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/feed" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 0 0 18M12 3a14 14 0 0 1 0 18M3 12h18"/></svg>
            <span>The Pitch</span>
          </router-link>
          <router-link to="/coach" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><circle cx="8.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/></svg>
            <span>AI Coach</span>
          </router-link>
        </template>
        <template v-else>
          <router-link to="/" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
            <span>Home</span>
          </router-link>
          <router-link to="/login" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Login</span>
          </router-link>
          <router-link to="/signup" class="bn-tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M3 21a6 6 0 0 1 12 0"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            <span>Sign Up</span>
          </router-link>
        </template>
      </nav>

      <!-- Separate account bubble; its menu stacks upward as floating buttons -->
      <div class="account-dock" v-if="user">
        <Transition name="acct">
          <div class="account-menu" v-if="isAccountOpen">
            <router-link to="/profile" class="account-menu__item">My Profile</router-link>
            <router-link to="/premium" class="account-menu__item">Lab Pro<span v-if="isPro" class="nav-pro-chip">PRO</span></router-link>
            <router-link to="/admin" class="account-menu__item" v-if="isAdmin">Admin Portal</router-link>
            <button type="button" class="account-menu__item account-menu__item--logout" @click="requestLogout">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </Transition>
        <button type="button" class="account-bubble" :class="{ 'is-active': isAccountOpen }" @click="isAccountOpen = !isAccountOpen" aria-label="Account">
          <img v-if="userAvatar" :src="userAvatar" class="account-bubble__avatar" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
        </button>
      </div>
    </div>

    <!-- Log-out confirmation -->
    <Transition name="confirm">
      <div class="confirm-overlay" v-if="showLogoutConfirm" @click.self="cancelLogout">
        <div class="confirm-card">
          <h2 class="confirm-card__title">Log out?</h2>
          <p class="confirm-card__text">Are you sure you want to log out of My Soccer Lab?</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-btn confirm-btn--ghost" @click="cancelLogout">Cancel</button>
            <button type="button" class="confirm-btn confirm-btn--danger" @click="confirmLogout">Log out</button>
          </div>
        </div>
      </div>
    </Transition>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Animated splash shown briefly between page navigations.
         It grows from wherever the nav was tapped (clip-path circle). -->
    <Transition name="splash">
      <div v-if="routeLoading" class="route-splash" :style="splashStyle">
        <div class="route-splash__art">
          <span class="route-splash__ball"></span>
          <span class="route-splash__ring"></span>
        </div>
        <span class="route-splash__brand">my soccer lab</span>
      </div>
    </Transition>

    <app-footer />

    <ToastHost />

  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
    const isAccountOpen = ref(false)
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

    const route = useRoute()
    const router = useRouter()

    // Animated splash between page navigations. Routes are mostly synchronous,
    // so we hold the splash for a short minimum so the animation is always seen.
    const routeLoading = ref(false)
    let splashTimer = null
    const SPLASH_MIN_MS = 650

    // The splash grows from wherever the nav was last tapped. recordOrigin runs on
    // pointerdown inside either nav (fires before the router-link navigates), so the
    // clip-path circle can expand out of the exact tab the user pressed.
    const splashOrigin = ref(null)
    const recordOrigin = (e) => {
      if (typeof e.clientX === 'number' && (e.clientX || e.clientY)) {
        splashOrigin.value = { x: e.clientX, y: e.clientY }
      }
    }
    const splashStyle = computed(() => splashOrigin.value
      ? { '--sx': splashOrigin.value.x + 'px', '--sy': splashOrigin.value.y + 'px' }
      : {})

    router.beforeEach((to, from, next) => {
      // Skip the very first resolve and same-page navigations.
      if (from.matched.length && to.path !== from.path) {
        routeLoading.value = true
      }
      next()
    })
    router.afterEach(() => {
      if (!routeLoading.value) return
      clearTimeout(splashTimer)
      splashTimer = setTimeout(() => {
        routeLoading.value = false
        // Reset so a navigation that didn't come from the nav (CTA, redirect)
        // falls back to the default bottom-centre origin.
        splashOrigin.value = null
      }, SPLASH_MIN_MS)
    })
    onBeforeUnmount(() => clearTimeout(splashTimer))

    const signOut = async () => {
      await supabase.auth.signOut()
    }

    // Logout is gated behind a confirm step.
    const showLogoutConfirm = ref(false)
    const requestLogout = () => {
      isAccountOpen.value = false
      isProfileDropdownOpen.value = false
      showLogoutConfirm.value = true
    }
    const cancelLogout = () => { showLogoutConfirm.value = false }
    const confirmLogout = async () => {
      showLogoutConfirm.value = false
      await signOut()
    }

    // Watch for route changes to close any open nav menus
    watch(() => route.path, () => {
      isAccountOpen.value = false
      isProfileDropdownOpen.value = false
    })

    return {
      user,
      isPro,
      isAdmin,
      userName,
      userAvatar,
      isProfileDropdownOpen,
      isAccountOpen,
      profileDropdownRef,
      routeLoading,
      splashStyle,
      recordOrigin,
      signOut,
      showLogoutConfirm,
      requestLogout,
      cancelLogout,
      confirmLogout
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
  background: #050608;
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
  transition: color 0.3s ease, background 0.3s ease, transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  white-space: nowrap;   /* labels like "The Pitch" / "Lab Pro" never wrap */
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Tap pop — snappy press-in, spring back out. */
.nav-link:active { transform: scale(0.93); }

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

/* ── Mobile bottom nav ─────────────────────────────────────────────
   App-first: phones/tablets get a floating glassy nav pill plus a SEPARATE
   account bubble; desktop keeps the top nav. */
.mobile-nav { display: none; }

.bottom-nav {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  height: 66px;
  padding: 0 4px;
  background: rgba(22, 22, 26, 0.55);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-pill);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.bn-tab {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 7px 5px;
  padding: 6px 4px;
  border-radius: var(--radius-pill);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bn-tab svg { width: 24px; height: 24px; transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1); }

.bn-tab:hover { color: rgba(255, 255, 255, 0.9); background: rgba(255, 255, 255, 0.06); }

/* Tap pop — the whole tab presses in and the icon dips a touch more. */
.bn-tab:active { transform: scale(0.9); }
.bn-tab:active svg { transform: scale(0.86); }

/* Active tab: the WHOLE tab (icon + label) is highlighted. */
.bn-tab.router-link-active,
.bn-tab.is-active {
  color: var(--color-accent);
  font-weight: var(--font-weight-bold);
  background: var(--color-accent-soft);
}

/* Separate account bubble (its own glassy circle, beside the main pill). */
.account-dock { position: relative; flex: 0 0 auto; }

.account-bubble {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.78);
  background: rgba(22, 22, 26, 0.55);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease;
}
.account-bubble svg { width: 25px; height: 25px; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.account-bubble:active { transform: scale(0.9); }
.account-bubble.is-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45), 0 0 22px color-mix(in srgb, var(--color-accent) 45%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: bubble-pop 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.account-bubble.is-active svg { transform: rotate(180deg); }

@keyframes bubble-pop {
  0%   { transform: scale(0.9); }
  45%  { transform: scale(1.14); }
  70%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}
.account-bubble__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border-strong);
}

/* Floating button stack above the bubble — no panel, just the buttons. */
.account-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  display: flex;
  flex-direction: column-reverse;   /* grows upward, first item nearest bubble */
  align-items: flex-end;
  gap: 10px;
}
.account-menu__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  white-space: nowrap;
  border-radius: var(--radius-pill);
  background: rgba(22, 22, 26, 0.6);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  color: var(--color-text-secondary);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  animation: acct-rise 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.account-menu__item:hover { color: #fff; border-color: var(--color-accent-border); }
.account-menu__item--logout { color: var(--color-danger); }
.account-menu__item:nth-child(1) { animation-delay: 0.02s; }
.account-menu__item:nth-child(2) { animation-delay: 0.07s; }
.account-menu__item:nth-child(3) { animation-delay: 0.12s; }
.account-menu__item:nth-child(4) { animation-delay: 0.17s; }
.account-menu__item:nth-child(5) { animation-delay: 0.22s; }

@keyframes acct-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* Click-catcher with a light blur of the page behind the menu. */
.account-scrim {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.acct-enter-active { transition: opacity 0.18s ease; }
.acct-leave-active { transition: opacity 0.16s ease; }
.acct-enter-from,
.acct-leave-to { opacity: 0; }

/* ── Log-out confirmation modal ── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.confirm-card {
  width: 100%;
  max-width: 340px;
  padding: 24px;
  text-align: center;
  background: rgba(20, 20, 24, 0.92);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.confirm-card__title { margin: 0 0 8px; font-size: var(--font-size-lg); font-weight: var(--font-weight-heavy); }
.confirm-card__text { margin: 0 0 20px; color: var(--color-text-muted); line-height: 1.5; font-size: var(--font-size-sm); }
.confirm-card__actions { display: flex; gap: 10px; }
.confirm-btn {
  flex: 1 1 0;
  padding: 12px 16px;
  border-radius: var(--radius-pill);
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.confirm-btn--ghost { background: transparent; border-color: var(--color-border-soft); color: var(--color-text-secondary); }
.confirm-btn--ghost:hover { background: var(--color-bg-surface-2); color: #fff; }
.confirm-btn--danger { background: var(--color-danger); color: #fff; }
.confirm-btn--danger:hover { background: #ff6b6b; }

.confirm-enter-active { transition: opacity 0.2s ease; }
.confirm-leave-active { transition: opacity 0.18s ease; }
.confirm-enter-from,
.confirm-leave-to { opacity: 0; }
.confirm-enter-active .confirm-card { transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1); }
.confirm-enter-from .confirm-card { transform: scale(0.92) translateY(8px); }

/* On mobile/tablet the top nav is removed entirely and replaced by a floating,
   glassy bottom pill (same treatment as the desktop top nav, minus the logo). */
@media (max-width: 1024px) {
  .navbar {
    display: none;
  }

  .mobile-nav {
    display: flex;
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(0.9rem + env(safe-area-inset-bottom));
    z-index: 200;
    align-items: flex-end;
    justify-content: center;
    gap: 10px;
    width: min(94%, 480px);
  }

}

/* ── Page-to-page transition (content cross-fade + slight rise) ── */
.page-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: 0.12s; }
.page-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.page-enter-from { opacity: 0; transform: translateY(14px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }

/* ── Route splash screen ── */
.route-splash {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background:
    radial-gradient(120% 90% at 50% 40%, #0b1411 0%, #050608 60%);
  /* Grows out of the tapped nav tab (--sx/--sy set in JS); default bottom-centre
     matches the floating mobile nav when the origin is unknown. */
  clip-path: circle(150% at var(--sx, 50%) var(--sy, 100%));
}

.route-splash__art {
  position: relative;
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
}

/* spinning accent ring */
.route-splash__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--color-accent-border);
  border-top-color: var(--color-accent);
  animation: splash-spin 0.8s linear infinite;
}

/* pulsing ball core */
.route-splash__ball {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 24px color-mix(in srgb, var(--color-accent) 55%, transparent);
  animation: splash-pulse 0.8s ease-in-out infinite;
}

.route-splash__brand {
  font-weight: var(--font-weight-heavy);
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  color: var(--color-accent);
}

/* Very subtle slide-in for the splash content on each navigation. */
.route-splash__art { animation: splash-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.route-splash__brand { animation: splash-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; }

@keyframes splash-spin { to { transform: rotate(360deg); } }
@keyframes splash-pulse { 0%, 100% { transform: scale(0.82); opacity: 0.85; } 50% { transform: scale(1); opacity: 1; } }
@keyframes splash-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* splash enter/leave — enter expands the clip-path circle out of the nav tap;
   leave is a soft fade so the destination page is revealed underneath. */
.splash-enter-active { transition: clip-path 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
.splash-enter-from { clip-path: circle(0% at var(--sx, 50%) var(--sy, 100%)); }
.splash-leave-active { transition: opacity 0.45s ease; }
.splash-leave-to { opacity: 0; }
</style>
