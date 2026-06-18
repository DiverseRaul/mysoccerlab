<template>
  <div class="load-widget" data-testid="load-management-widget">
    <header class="load-widget__head">
      <h3 class="load-widget__title">Load Management</h3>
      <p class="load-widget__subtitle">Self-reported training load — a guide, not medical advice</p>
    </header>

    <div class="load-widget__gauge" :class="`load-widget__gauge--${Status.Zone}`">
      <div class="load-widget__zone-pill">{{ Status.ZoneLabel }}</div>
      <div class="load-widget__track" role="img" :aria-label="`Load gauge at ${Status.GaugePercent} percent`">
        <div class="load-widget__marker" :style="{ left: `${Status.GaugePercent}%` }"></div>
      </div>
      <div class="load-widget__scale">
        <span>Optimal</span>
        <span>Elevated</span>
        <span>High risk</span>
      </div>
      <div class="load-widget__readout">
        <div class="load-widget__metric">
          <span class="load-widget__metric-value">{{ Status.WeeklyMinutes }}</span>
          <span class="load-widget__metric-label">min / 7 days</span>
        </div>
        <div class="load-widget__metric">
          <span class="load-widget__metric-value">{{ Status.HasData ? Status.AverageFatigue : '—' }}</span>
          <span class="load-widget__metric-label">avg fatigue</span>
        </div>
      </div>
    </div>

    <form class="load-widget__form" @submit.prevent="SubmitEntry">
      <div class="load-widget__field">
        <label for="LoadDate">Date</label>
        <input id="LoadDate" v-model="EntryDate" type="date" required />
      </div>
      <div class="load-widget__field">
        <label for="LoadMinutes">Minutes</label>
        <input id="LoadMinutes" v-model.number="EntryMinutes" type="number" min="0" max="600" placeholder="e.g. 90" required />
      </div>
      <div class="load-widget__field">
        <label for="LoadFatigue">Fatigue: <strong>{{ EntryFatigue }}</strong> / 10</label>
        <input id="LoadFatigue" v-model.number="EntryFatigue" type="range" min="1" max="10" step="1" />
      </div>
      <button type="submit" class="load-widget__submit" :disabled="Saving || EntryMinutes == null">
        {{ Saving ? 'Saving…' : 'Log load' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'
import { ComputeLoadStatus } from '../../../lib/load'

const LoadEntries = ref([])
const EntryDate = ref(new Date().toISOString().split('T')[0])
const EntryMinutes = ref(null)
const EntryFatigue = ref(5)
const Saving = ref(false)

const Status = computed(() => ComputeLoadStatus(LoadEntries.value))

const LoadEntriesFromDb = async () => {
  const { data: authData } = await supabase.auth.getUser()
  const User = authData?.user
  if (!User) return
  const { data, error } = await supabase
    .from('load_entries')
    .select('*')
    .eq('user_id', User.id)
    .order('entry_date', { ascending: false })
    .limit(60)
  if (!error) LoadEntries.value = data || []
}

const SubmitEntry = async () => {
  if (Saving.value || EntryMinutes.value == null) return
  Saving.value = true
  try {
    const { data: authData } = await supabase.auth.getUser()
    const User = authData?.user
    if (!User) return
    const { data, error } = await supabase
      .from('load_entries')
      .insert({
        user_id: User.id,
        entry_date: EntryDate.value,
        minutes: EntryMinutes.value,
        fatigue: EntryFatigue.value
      })
      .select()
      .single()
    if (error) throw error
    LoadEntries.value = [data, ...LoadEntries.value]
    EntryMinutes.value = null
    EntryFatigue.value = 5
  } catch (e) {
    console.error('Error logging load entry:', e)
  } finally {
    Saving.value = false
  }
}

onMounted(LoadEntriesFromDb)
</script>

<style scoped>
.load-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  color: var(--color-text-primary);
}

.load-widget__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.load-widget__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.load-widget__subtitle {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.load-widget__gauge {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.load-widget__zone-pill {
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.load-widget__gauge--optimal .load-widget__zone-pill { background: var(--color-success-bg); color: var(--color-success); }
.load-widget__gauge--caution .load-widget__zone-pill { background: var(--color-warning-bg); color: var(--color-warning); }
.load-widget__gauge--high-risk .load-widget__zone-pill { background: var(--color-danger-bg); color: var(--color-danger); }

.load-widget__track {
  position: relative;
  height: 12px;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--color-success) 0%, var(--color-warning) 60%, var(--color-danger) 100%);
}

.load-widget__marker {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-text-primary);
  border: 3px solid var(--color-bg-page);
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: left 0.3s ease;
}

.load-widget__scale {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.load-widget__readout {
  display: flex;
  gap: var(--space-6);
  padding-top: var(--space-2);
}

.load-widget__metric {
  display: flex;
  flex-direction: column;
}

.load-widget__metric-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-heavy);
  line-height: 1;
}

.load-widget__metric-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 4px;
}

.load-widget__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.load-widget__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.load-widget__field label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.load-widget__field input[type='date'],
.load-widget__field input[type='number'] {
  width: 100%;
  padding: 12px;
  min-height: 44px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
  box-sizing: border-box;
}

.load-widget__field input:focus {
  outline: none;
  border-color: var(--color-accent-border);
}

.load-widget__field input[type='range'] {
  width: 100%;
  accent-color: var(--color-accent);
}

.load-widget__submit {
  margin-top: var(--space-2);
  padding: 14px;
  min-height: 48px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.load-widget__submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.load-widget__submit:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
