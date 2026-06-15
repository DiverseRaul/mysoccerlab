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

const routes = [
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
