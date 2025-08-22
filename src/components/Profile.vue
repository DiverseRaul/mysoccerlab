<template>
  <div class="profile-view">
    <div class="profile-card card-glass">
      <h2 class="profile-title">My Profile</h2>
      <div v-if="user" class="profile-info">
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user.email }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Last Sign In</span>
          <span class="info-value">{{ formatSignInTime(user.last_sign_in_at) }}</span>
        </div>
      </div>
      <button @click="signOut" class="btn btn-danger">Sign Out</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

export default {
  name: 'ProfileView',
  setup() {
    const user = ref(null)
    const router = useRouter()

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
      } else {
        router.push('/login')
      }
    })

    const signOut = async () => {
      await supabase.auth.signOut()
      router.push('/')
    }

    const formatSignInTime = (time) => {
      if (!time) return 'N/A'
      return new Date(time).toLocaleString()
    }

    return {
      user,
      signOut,
      formatSignInTime
    }
  }
}
</script>

<style scoped>
.profile-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.card-glass {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #222;
  border-radius: 16px;
  padding: 2.5rem;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 2rem;
}

.profile-info {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #222;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #aaa;
  font-weight: 500;
}

.info-value {
  color: #f0f0f0;
}

.btn-danger {
  width: 100%;
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.btn-danger:hover {
  background: rgba(255, 71, 87, 0.4);
  color: white;
}
</style>
