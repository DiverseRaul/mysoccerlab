<template>
  <div class="plan-wrapper">
    <div class="plan-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      Training Plan
    </div>
    <div class="sessions-list">
      <div
        v-for="Session in TrainingSessions"
        :key="Session.DayTitle"
        class="session-card"
      >
        <div class="session-top">
          <span class="day-badge">{{ Session.DayTitle }}</span>
          <span class="focus-theme">{{ Session.FocusTheme }}</span>
        </div>
        <ul class="drills-list">
          <li v-for="Drill in Session.Drills" :key="Drill" class="drill-item">
            <span class="drill-dot"></span>
            {{ Drill }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const Props = defineProps({
  TrainingSessions: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.plan-wrapper {
  background: #09090b;
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 10px;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(52, 211, 153, 0.08);
  border-bottom: 1px solid rgba(52, 211, 153, 0.15);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #4cda9c;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(255, 255, 255, 0.03);
}

.session-card {
  background: #18181b;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: background 0.2s;
}

.session-card:last-child {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.session-card:hover {
  background: #1f1f23;
}

.session-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day-badge {
  background: rgba(76, 218, 156, 0.1);
  border: 1px solid rgba(76, 218, 156, 0.3);
  color: #4cda9c;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.focus-theme {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.drills-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 4px;
}

.drill-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: #a1a1aa;
  line-height: 1.5;
}

.drill-dot {
  width: 5px;
  height: 5px;
  min-width: 5px;
  border-radius: 50%;
  background: #4cda9c;
  opacity: 0.6;
  margin-top: 6px;
}
</style>
