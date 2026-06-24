<template>
  <footer class="app-footer">
    <nav class="app-footer__links">
      <router-link to="/faq" class="app-footer__link">FAQ</router-link>
      <router-link to="/privacy" class="app-footer__link">Privacy</router-link>
      <router-link to="/terms" class="app-footer__link">Terms</router-link>
      <router-link to="/" class="app-footer__link">Home</router-link>
    </nav>
    <p class="app-footer__copy">&copy; 2026 </p>
    <p class="version">Version 0.9.0</p>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
}
</script>

<style scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 2rem 1rem;
  margin-top: auto;
  background-color: #050608;
  border-top: 1px solid var(--color-border-subtle);
}

.app-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.app-footer__link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: var(--font-weight-medium);
  transition: color 0.2s ease;
}

.app-footer__link:hover {
  color: var(--color-accent);
}

.app-footer__copy {
  margin: 0;
  color: var(--color-text-faint);
  font-size: 0.85rem;
}

.app-footer__brand {
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition: color 0.2s ease;
}
.app-footer__brand:hover { color: var(--color-accent); }

.version {
  margin: 0;
  color: var(--color-text-faint);
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .app-footer {
    padding-top: 4rem;
    padding-bottom: 8rem;
  }
}

</style>
