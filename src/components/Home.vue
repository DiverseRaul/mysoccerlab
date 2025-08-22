<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          My Soccer Lab
        </h1>
        <p class="hero-subtitle">
          The ultimate platform for soccer analytics and team management.
        </p>
        <div class="hero-buttons">
          <router-link to="/login" class="btn btn-primary">Get Started</router-link>
          <button class="btn btn-ghost" @click="scrollToFeatures">Learn More</button>
        </div>
      </div>
      <div class="hero-glow"></div>
    </div>

    <div class="features" ref="featuresSection">
      <h2 class="section-title">Everything you need to level up your game</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>
          </div>
          <h3>Advanced Analytics</h3>
          <p>Gain deep insights with real-time performance tracking and data visualization.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3>Player Management</h3>
          <p>A complete and intuitive system for managing your roster and player profiles.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <h3>Match Tracking</h3>
          <p>Easily track match results, key events, and view league standings.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Home',
  setup() {
    const featuresSection = ref(null)

    const scrollToFeatures = () => {
      featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
    }

    return {
      featuresSection,
      scrollToFeatures
    }
  }
}
</script>

<style scoped>
.home {
  background-color: #050505;
  color: #fff;
  overflow-x: hidden;
}

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 2rem;
  position: relative;
}

.hero-content {
  position: relative;
  z-index: 2;
  animation: fadeIn 1.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0) 60%);
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  animation: pulse 8s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #ffffff, #b0b0b0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.hero-subtitle {
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto 2.5rem;
  color: #a0a0a0;
  font-weight: 300;
  line-height: 1.6;
  animation: fadeInUp 1s ease-out 0.4s both;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.6s both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(76, 175, 80, 0.2);
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}

.features {
  padding: 6rem 2rem;
  background-color: #0a0a0a;
  position: relative;
  z-index: 2;
  border-top: 1px solid #1a1a1a;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 4rem;
  color: #eee;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: #111;
  padding: 2.5rem;
  border-radius: 16px;
  border: 1px solid #222;
  transition: all 0.3s ease;
  text-align: left;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: #4CAF50;
  background: #141414;
}

.feature-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f0f0f0;
}

.feature-card p {
  color: #888;
  line-height: 1.7;
  font-weight: 300;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
