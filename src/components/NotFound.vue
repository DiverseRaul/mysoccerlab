<template>
  <main class="nf">
    <!-- Continuously drifting brand aurora behind everything. -->
    <div class="nf__bg" aria-hidden="true">
      <span class="nf__aurora"></span>
      <span class="nf__orb nf__orb--1"></span>
      <span class="nf__orb nf__orb--2"></span>
    </div>

    <div class="nf__inner">
      <!-- A football that bobs and spins forever. -->
      <div class="nf__ball" aria-hidden="true">⚽</div>
      <p class="nf__code">404</p>
      <h1 class="nf__title">
        <span class="nf__line">This page</span>
        <span class="nf__line nf__line--accent">went out of play.</span>
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
// Pure presentational catch-all. No data — a friendly, always-animating off-ramp
// so an unknown URL never leaves the user staring at a blank screen.
</script>

<style scoped>
.nf {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-page-bg);
  padding: 24px;
  text-align: center;
  overflow: hidden;
}

/* ── Drifting aurora backdrop ──────────────────────────────────────── */
.nf__bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }

.nf__aurora {
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(38% 46% at 18% 22%, color-mix(in srgb, var(--color-accent) 26%, transparent), transparent 70%),
    radial-gradient(42% 50% at 84% 16%, color-mix(in srgb, #7c5cff 20%, transparent), transparent 72%),
    radial-gradient(48% 54% at 70% 98%, color-mix(in srgb, #19c6c0 16%, transparent), transparent 70%);
  filter: blur(40px);
  opacity: 0.5;
  animation: nf-drift 26s ease-in-out infinite alternate;
}

/* Two slow-floating glow orbs for depth. */
.nf__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.4;
}
.nf__orb--1 {
  width: 320px; height: 320px;
  left: 8%; top: 14%;
  background: color-mix(in srgb, var(--color-accent) 40%, transparent);
  animation: nf-orb 18s ease-in-out infinite alternate;
}
.nf__orb--2 {
  width: 380px; height: 380px;
  right: 6%; bottom: 8%;
  background: color-mix(in srgb, #7c5cff 38%, transparent);
  animation: nf-orb 22s ease-in-out infinite alternate-reverse;
}

@keyframes nf-drift {
  from { transform: translate3d(-2%, -1.5%, 0) scale(1.02) rotate(0deg); }
  to   { transform: translate3d(2.5%, 2%, 0) scale(1.08) rotate(4deg); }
}
@keyframes nf-orb {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(40px, -30px, 0) scale(1.15); }
}

/* ── Content ───────────────────────────────────────────────────────── */
.nf__inner { position: relative; z-index: 1; max-width: 540px; }

.nf__ball {
  font-size: clamp(2.4rem, 8vw, 3.4rem);
  line-height: 1;
  margin-bottom: 6px;
  animation: nf-float 3.2s ease-in-out infinite, nf-spin 9s linear infinite;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.45));
}

@keyframes nf-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}
@keyframes nf-spin {
  from { rotate: 0deg; }
  to   { rotate: 360deg; }
}

.nf__code {
  margin: 0 0 8px;
  font-family: var(--font-family-display);
  font-weight: 900;
  font-size: clamp(3.4rem, 14vw, 6.5rem);
  line-height: 1;
  letter-spacing: 0.02em;
  /* Gradient-filled text with a shimmer sweep running across it forever. */
  background: linear-gradient(
    100deg,
    var(--color-accent) 0%,
    #b9ffe3 25%,
    var(--color-accent) 50%,
    #7c5cff 75%,
    var(--color-accent) 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: nf-shimmer 4.5s linear infinite;
}

@keyframes nf-shimmer {
  from { background-position: 0% 0; }
  to   { background-position: 250% 0; }
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
