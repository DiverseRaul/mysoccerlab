<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <h1 class="hero-title">My Soccer Lab</h1>
        <p class="hero-subtitle">Ultimate soccer analytics platform</p>
        <div class="hero-buttons">
          <router-link to="/login" class="btn btn-primary">Get Started</router-link>
          <button class="btn btn-ghost" @click="scrollToFeatures">Learn More</button>
        </div>
      </div>
    </div>

    <div class="features" ref="featuresSection">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Analytics</h3>
          <p>Real-time performance tracking</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚽</div>
          <h3>Players</h3>
          <p>Complete roster management</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🏆</div>
          <h3>Matches</h3>
          <p>Track results & standings</p>
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
  padding: 0;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.home::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(76, 175, 80, 0.01) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.hero {
  background: transparent;
  color: white;
  text-align: center;
  padding: 8rem 2rem;
  margin: -2rem -2rem 0 -2rem;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 1;
  animation: fadeInUp 1.2s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(45deg, #4CAF50, #81C784, #66BB6A);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -2px;
  animation: gradientShift 3s ease-in-out infinite, titleFloat 6s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes titleFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  opacity: 0.8;
  color: #b0b0b0;
  font-weight: 300;
  animation: fadeInUp 1.2s ease-out 0.3s both;
}

.hero-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 1.2s ease-out 0.6s both;
}

.btn-primary {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border: none;
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.5);
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-ghost {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.btn-ghost::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.btn-ghost:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  transform: translateY(-2px);
}

.btn-ghost:hover::before {
  width: 300%;
  height: 300%;
}

.features {
  padding: 6rem 2rem;
  background: transparent;
  position: relative;
  z-index: 1;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeInUp 1.2s ease-out 0.9s both;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 2.5rem;
  border-radius: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(76, 175, 80, 0.05) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
  background: rgba(76, 175, 80, 0.08);
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 20px 40px rgba(76, 175, 80, 0.1);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:nth-child(1) {
  animation: fadeInUp 1.2s ease-out 1.0s both;
}

.feature-card:nth-child(2) {
  animation: fadeInUp 1.2s ease-out 1.1s both;
}

.feature-card:nth-child(3) {
  animation: fadeInUp 1.2s ease-out 1.2s both;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  filter: grayscale(0.2);
  transition: all 0.4s ease;
  display: inline-block;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
  filter: grayscale(0);
}

.feature-card h3 {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.4rem;
  font-weight: 600;
}

.feature-card p {
  color: #b0b0b0;
  line-height: 1.6;
  font-weight: 300;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
