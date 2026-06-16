import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './styles/tokens.css'
import './styles/controls.css'
import App from './App.vue'
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import SignUp from './components/SignUp.vue'
import Dashboard from './components/Dashboard.vue'
import Profile from './components/Profile.vue'
import Feed from './components/Feed.vue'
import PrivacyPolicy from './components/legal/PrivacyPolicy.vue'
import TermsOfService from './components/legal/TermsOfService.vue'
import Faq from './components/legal/Faq.vue'
import CoachScreen from './components/coach/CoachScreen.vue'
import PremiumScreen from './components/premium/PremiumScreen.vue'
import AdminLayout from './components/admin/AdminLayout.vue'
import AdminOverview from './components/admin/sections/AdminOverview.vue'
import AdminHome from './components/admin/sections/AdminHome.vue'
import AdminPremium from './components/admin/sections/AdminPremium.vue'
import AdminCoach from './components/admin/sections/AdminCoach.vue'
import AdminFaq from './components/admin/sections/AdminFaq.vue'
import AdminIntro from './components/admin/sections/AdminIntro.vue'
import AdminUsers from './components/admin/sections/AdminUsers.vue'
import AdminUserDetail from './components/admin/sections/AdminUserDetail.vue'
import AdminMatches from './components/admin/sections/AdminMatches.vue'
import AdminMatchDetail from './components/admin/sections/AdminMatchDetail.vue'
import AdminPractice from './components/admin/sections/AdminPractice.vue'
import AdminWaitlist from './components/admin/sections/AdminWaitlist.vue'
import AdminAudit from './components/admin/sections/AdminAudit.vue'
import AdminDashboard from './components/admin/sections/AdminDashboard.vue'
import SharedDashboard from './components/share/SharedDashboard.vue'

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
  { path: '/faq', component: Faq }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
