<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <div class="ai-badge">Powered by AI Analytics</div>
        <h1 class="hero-title">
          My Soccer Lab
        </h1>
        <p class="hero-subtitle">
          The ultimate platform for player development.
        </p>
        <div class="hero-buttons">
          <router-link v-if="!user" to="/login" class="btn btn-primary">Get Started</router-link>
          <div v-else class="auth-buttons">
            <router-link to="/dashboard" class="btn btn-primary">Dashboard</router-link>
            <router-link to="/feed" class="btn btn-secondary">Feed</router-link>
          </div>
          <button class="btn btn-ghost" @click="scrollToHowItWorks">Learn More</button>
        </div>
      </div>
    </div>
    <div class="how-it-works" ref="howItWorksSection">
      <h2 class="section-title">How it works</h2>
      <div class="steps-container">
        
        <!-- Step 1 -->
        <div class="step-row">
          <div class="step-content">
            <span class="step-number">01</span>
            <h3>Sign Up & Connect</h3>
            <p>Create your profile and securely connect your match data or upload footage.</p>
          </div>
          <div class="step-visual">
            <div class="visual-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="step-row reverse">
          <div class="step-content">
            <span class="step-number">02</span>
            <h3>AI Analysis</h3>
            <p>Our advanced algorithms break down your performance, tracking key metrics like shots, passes, and chances created.</p>
          </div>
          <div class="step-visual">
            <div class="visual-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="step-row">
          <div class="step-content">
            <span class="step-number">03</span>
            <h3>Level Up</h3>
            <p>Review actionable insights, monitor your progress over time, and elevate your game to the next level.</p>
          </div>
          <div class="step-visual">
            <div class="visual-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

export default {
  name: 'Home',
  setup() {
    const howItWorksSection = ref(null)
    const user = ref(null)

    onMounted(async () => {
      const { data } = await supabase.auth.getUser()
      user.value = data.user
    })

    const scrollToHowItWorks = () => {
      howItWorksSection.value?.scrollIntoView({ behavior: 'smooth' })
    }

    return {
      howItWorksSection,
      scrollToHowItWorks,
      user
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
  background: radial-gradient(circle at center top, #111 0%, #050505 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  animation: fadeIn 1s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ai-badge {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4CAF50;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  display: inline-block;
  animation: slideDown 0.8s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
  color: #ffffff;
}

.hero-subtitle {
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto 2.5rem;
  color: #a0a0a0;
  font-weight: 300;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px 0 rgba(76, 175, 80, 0.39);
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: transparent;
  border: 2px solid #4CAF50;
  color: #4CAF50;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #4CAF50;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(76, 175, 80, 0.2);
}

.auth-buttons {
  display: flex;
  gap: 1rem;
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

.how-it-works {
  padding: 8rem 2rem;
  background-color: #0a0a0a;
  position: relative;
  z-index: 2;
  border-top: 1px solid #1a1a1a;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 5rem;
  color: #fff;
  letter-spacing: -0.02em;
}

.steps-container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8rem;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 4rem;
}

.step-row.reverse {
  flex-direction: row-reverse;
}

.step-content {
  flex: 1;
  text-align: left;
}

.step-number {
  font-size: 4.5rem;
  font-weight: 800;
  color: rgba(76, 175, 80, 0.1);
  line-height: 1;
  display: block;
  margin-bottom: 1rem;
}

.step-content h3 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #f0f0f0;
}

.step-content p {
  color: #a1a1aa;
  line-height: 1.8;
  font-weight: 400;
  font-size: 1.15rem;
}

.step-visual {
  flex: 1;
  display: flex;
  justify-content: center;
}

.visual-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #111 0%, #0a0a0a 100%);
  border: 1px solid #222;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4CAF50;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  transition: transform 0.5s ease, border-color 0.5s ease;
}

.step-row:hover .visual-placeholder {
  transform: translateY(-10px) scale(1.02);
  border-color: rgba(76, 175, 80, 0.4);
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

  .step-row, .step-row.reverse {
    flex-direction: column;
    gap: 3rem;
  }
  .step-content {
    text-align: center;
  }
}
</style>
