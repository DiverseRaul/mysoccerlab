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
                <svg v-if="s.icon === 'overview'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                <svg v-else-if="s.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <svg v-else-if="s.icon === 'matches'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z"/><path d="M12 2v20M2 12h20"/></svg>
                <svg v-else-if="s.icon === 'practice'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <svg v-else-if="s.icon === 'waitlist'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <svg v-else-if="s.icon === 'audit'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <svg v-else-if="s.icon === 'home'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <svg v-else-if="s.icon === 'premium'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg v-else-if="s.icon === 'coach'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M18.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>
                <svg v-else-if="s.icon === 'faq'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <svg v-else-if="s.icon === 'sparkle'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
                <svg v-else-if="s.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
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
