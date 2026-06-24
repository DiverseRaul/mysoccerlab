import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
// Phosphor icons. Weights in use: light (thin outline — nav inactive tabs),
// regular (general in-app UI icons), fill (solid — active/emphasis states).
import '@phosphor-icons/web/light'
import '@phosphor-icons/web/regular'
import '@phosphor-icons/web/fill'
import './styles/tokens.css'
import './styles/controls.css'
import './styles/reveal.css'
import App from './App.vue'
// Home is the landing page (first paint), so it's eager-loaded into the main
// bundle. Every other screen is lazy-loaded as its own chunk so visitors don't
// download the whole app — especially the large admin section — up front.
import Home from './components/Home.vue'

const Login = () => import('./components/Login.vue')
const SignUp = () => import('./components/SignUp.vue')
const Dashboard = () => import('./components/Dashboard.vue')
const Profile = () => import('./components/Profile.vue')
const Feed = () => import('./components/Feed.vue')
const PrivacyPolicy = () => import('./components/legal/PrivacyPolicy.vue')
const TermsOfService = () => import('./components/legal/TermsOfService.vue')
const Faq = () => import('./components/legal/Faq.vue')
const CoachScreen = () => import('./components/coach/CoachScreen.vue')
const PremiumScreen = () => import('./components/premium/PremiumScreen.vue')
const SharedDashboard = () => import('./components/share/SharedDashboard.vue')
const NotFound = () => import('./components/NotFound.vue')

// Admin is a whole sub-app most users never see — keep it entirely out of the
// initial bundle.
const AdminLayout = () => import('./components/admin/AdminLayout.vue')
const AdminOverview = () => import('./components/admin/sections/AdminOverview.vue')
const AdminHome = () => import('./components/admin/sections/AdminHome.vue')
const AdminPremium = () => import('./components/admin/sections/AdminPremium.vue')
const AdminCoach = () => import('./components/admin/sections/AdminCoach.vue')
const AdminFaq = () => import('./components/admin/sections/AdminFaq.vue')
const AdminIntro = () => import('./components/admin/sections/AdminIntro.vue')
const AdminUsers = () => import('./components/admin/sections/AdminUsers.vue')
const AdminUserDetail = () => import('./components/admin/sections/AdminUserDetail.vue')
const AdminMatches = () => import('./components/admin/sections/AdminMatches.vue')
const AdminMatchDetail = () => import('./components/admin/sections/AdminMatchDetail.vue')
const AdminPractice = () => import('./components/admin/sections/AdminPractice.vue')
const AdminWaitlist = () => import('./components/admin/sections/AdminWaitlist.vue')
const AdminAudit = () => import('./components/admin/sections/AdminAudit.vue')
const AdminDashboard = () => import('./components/admin/sections/AdminDashboard.vue')

const routes = [
  { path: '/share/:token', component: SharedDashboard },
  { path: '/coach', component: CoachScreen },
  { path: '/premium', component: PremiumScreen },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/admin/overview' },
      { path: 'overview', component: AdminOverview },
      { path: 'users', component: AdminUsers },
      { path: 'users/:id', component: AdminUserDetail },
      { path: 'matches', component: AdminMatches },
      { path: 'matches/:id', component: AdminMatchDetail },
      { path: 'practice', component: AdminPractice },
      { path: 'waitlist', component: AdminWaitlist },
      { path: 'audit', component: AdminAudit },
      { path: 'home', component: AdminHome },
      { path: 'premium', component: AdminPremium },
      { path: 'coach', component: AdminCoach },
      { path: 'faq', component: AdminFaq },
      { path: 'intro', component: AdminIntro },
      { path: 'dashboard', component: AdminDashboard }
    ]
  },
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/signup', component: SignUp },
  { path: '/dashboard', component: Dashboard },
  { path: '/profile', component: Profile },
  { path: '/feed', component: Feed },
  { path: '/privacy', component: PrivacyPolicy },
  { path: '/terms', component: TermsOfService },
  { path: '/faq', component: Faq },
  // Catch-all → friendly 404 (never a blank screen for an unknown URL).
  { path: '/:pathMatch(.*)*', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Fresh navigations land at the top of the new page (going Home → Dashboard
  // shouldn't inherit how far you'd scrolled). Browser back/forward still
  // restores the previous scroll position. Wait for the route-splash transition
  // to swap the page in before scrolling so the reset isn't visibly undone.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return new Promise((resolve) => {
      setTimeout(() => resolve({ top: 0, left: 0 }), 80)
    })
  }
})

// A lazy chunk can fail to load (network blip, or a new deploy replaced the
// hashed file mid-session). Rather than leaving the user stuck, reload once to
// fetch the fresh asset manifest.
router.onError((err) => {
  const msg = err?.message || ''
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    if (!sessionStorage.getItem('msl-chunk-reload')) {
      sessionStorage.setItem('msl-chunk-reload', '1')
      window.location.reload()
    }
  }
})
router.afterEach(() => { sessionStorage.removeItem('msl-chunk-reload') })

createApp(App).use(router).mount('#app')
