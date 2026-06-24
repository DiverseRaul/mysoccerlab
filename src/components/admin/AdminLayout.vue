<template>
  <div class="admin">
    <div class="admin__wrap">
      <header class="admin__header">
        <div class="admin__header-title-row">
          <span class="admin__badge">Admin Portal</span>
          <h1 class="admin__title">Control Center</h1>
        </div>
        <p class="admin__subtitle">Manage site content, analyze platform metrics, and operate user records.</p>
      </header>

      <div class="admin__body">
        <nav class="admin__nav">
          <template v-for="group in navGroups" :key="group.title">
            <span class="admin__nav-group">{{ group.title }}</span>
            <router-link v-for="s in group.items" :key="s.to" :to="s.to" class="admin__nav-link">
              <span class="admin__nav-icon">
                <i v-if="s.icon === 'overview'" class="ph ph-squares-four" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'users'" class="ph ph-users" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'matches'" class="ph ph-soccer-ball" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'practice'" class="ph ph-pulse" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'waitlist'" class="ph ph-file-text" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'audit'" class="ph ph-clock" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'home'" class="ph ph-house" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'premium'" class="ph ph-star" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'coach'" class="ph ph-sparkle" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'faq'" class="ph ph-question" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'sparkle'" class="ph ph-sparkle" aria-hidden="true" style="font-size:18px"></i>
                <i v-else-if="s.icon === 'dashboard'" class="ph ph-gear" aria-hidden="true" style="font-size:18px"></i>
              </span>
              {{ s.label }}
            </router-link>
          </template>
        </nav>

        <main class="admin__main">
          <slot><router-view /></slot>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAdmin, loadEntitlements } from '../../lib/premium'
import { loadAll } from '../../lib/siteContent'
import { ResolveSession } from '../../lib/authSession'

const props = defineProps({ previewMode: { type: Boolean, default: false } })
const router = useRouter()

const navGroups = [
  { title: 'Insights', items: [{ to: '/admin/overview', label: 'Overview', icon: 'overview' }] },
  { title: 'Operate', items: [
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/matches', label: 'Matches', icon: 'matches' },
    { to: '/admin/practice', label: 'Training', icon: 'practice' },
    { to: '/admin/waitlist', label: 'Waitlist', icon: 'waitlist' },
    { to: '/admin/audit', label: 'Audit log', icon: 'audit' }
  ] },
  { title: 'Content', items: [
    { to: '/admin/home', label: 'Home page', icon: 'home' },
    { to: '/admin/intro', label: 'Welcome Intro', icon: 'sparkle' },
    { to: '/admin/premium', label: 'Premium', icon: 'premium' },
    { to: '/admin/coach', label: 'AI Coach', icon: 'coach' },
    { to: '/admin/faq', label: 'FAQ', icon: 'faq' },
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' }
  ] }
]

onMounted(async () => {
  if (props.previewMode) return
  const session = await ResolveSession()
  if (!session) { router.push('/login'); return }
  await loadEntitlements(session.user.id)
  if (!isAdmin.value) { router.push('/dashboard'); return }
  loadAll()
})
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--app-page-bg);
  color: var(--color-text-primary);
  padding: 120px 20px 60px;
}
.admin__wrap { max-width: 1200px; margin: 0 auto; }

.admin__header {
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-4);
}
.admin__header-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.admin__badge {
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  font-size: 0.65rem;
  font-weight: var(--font-weight-heavy);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}
.admin__title { margin: 0; font-size: 2.2rem; font-weight: var(--font-weight-heavy); letter-spacing: -0.02em; }
.admin__subtitle { margin: 8px 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.5; }

.admin__body { display: grid; grid-template-columns: 1fr; gap: var(--space-6); }

.admin__nav {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  scrollbar-width: none;
}
.admin__nav::-webkit-scrollbar {
  display: none;
}

.admin__nav-group { display: none; }

.admin__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;
}
.admin__nav-link:hover { background: var(--color-bg-surface-2); color: var(--color-text-secondary); }
.admin__nav-icon { display: flex; align-items: center; justify-content: center; opacity: 0.7; transition: opacity 0.2s ease; }
.admin__nav-link.router-link-active { background: var(--color-accent-soft); color: var(--color-accent); }
.admin__nav-link.router-link-active .admin__nav-icon { opacity: 1; }

.admin__main { min-width: 0; }

@media (min-width: 900px) {
  .admin__body { grid-template-columns: 240px 1fr; align-items: start; }
  .admin__nav {
    flex-direction: column;
    gap: 4px;
    overflow: visible;
    position: sticky;
    top: 120px;
    padding: var(--space-4);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
  }
  
  .admin__nav-group {
    display: block;
    margin: var(--space-4) 0 var(--space-2);
    padding: 0 var(--space-3);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-faint);
    font-weight: var(--font-weight-bold);
  }
  .admin__nav-group:first-child { margin-top: 0; }
  
  .admin__nav-link {
    display: flex;
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    box-sizing: border-box;
  }
}
</style>
