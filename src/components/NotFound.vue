<template>
  <main class="nf">
    <div class="nf__inner">
      <p class="nf__code">404</p>
      <h1 class="nf__title">
        <span class="nf__line">This page</span>
        <span class="nf__line nf__line--accent">doesn't exist.</span>
      </h1>
      <p class="nf__msg">The link may be broken or the page may have moved. Let's get you back on the pitch.</p>
      <div class="nf__actions">
        <router-link to="/dashboard" class="btn btn-primary">Go to Dashboard</router-link>
        <router-link to="/" class="btn btn-ghost">Back to Home</router-link>
      </div>
    </div>
  </main>
</template>

<script setup>
// Pure presentational catch-all. No data — just a friendly off-ramp so an
// unknown URL never leaves the user staring at a blank screen.
</script>

<style scoped>
.nf {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-page-bg);
  padding: 24px;
  text-align: center;
}

.nf__inner {
  max-width: 520px;
}

.nf__code {
  margin: 0 0 8px;
  font-family: var(--font-family-display);
  font-weight: 900;
  font-size: clamp(3rem, 12vw, 5.5rem);
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2px var(--color-accent);
  text-stroke: 2px var(--color-accent);
  letter-spacing: 0.02em;
}

.nf__title {
  margin: 0 0 16px;
  font-family: var(--font-family-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.96;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  color: var(--color-text-primary);
}

.nf__line { display: block; }
.nf__line--accent { color: var(--color-accent); }

.nf__msg {
  margin: 0 auto 28px;
  max-width: 38ch;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.6;
}

.nf__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
