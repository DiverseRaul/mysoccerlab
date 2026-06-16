<template>
  <div class="practice-section">
    <DrillList
      v-if="!selectedDrill"
      :drills="drills"
      :sessionsByDrill="sessionsByDrill"
      :loading="loading"
      @select-drill="selectDrill"
      @add-drill="openAddDrill"
    />

    <DrillDetailView
      v-else
      :drill="selectedDrill"
      :sessions="sessionsForSelected"
      :placements="placementsForSelected"
      @back="selectedDrill = null"
      @log-session="showLogSession = true"
      @edit-drill="showEditDrill = true"
      @delete-drill="confirmDeleteDrill = true"
      @delete-session="deleteSession"
    />

    <AddDrillModal
      v-model="showAddDrill"
      :initial-value="addDrillPreset"
      @submit="onCreateDrill"
    />

    <EditDrillModal
      v-model="showEditDrill"
      :drill="selectedDrill"
      @submit="onUpdateDrill"
    />

    <LogSessionModal
      v-model="showLogSession"
      :drill="selectedDrill"
      @submit="onLogSession"
    />

    <DeleteDrillModal
      v-model="confirmDeleteDrill"
      :drill="selectedDrill"
      @confirm="onDeleteDrill"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../lib/supabase'
import DrillList from './DrillList.vue'
import DrillDetailView from './DrillDetailView.vue'
import AddDrillModal from './AddDrillModal.vue'
import EditDrillModal from './EditDrillModal.vue'
import LogSessionModal from './LogSessionModal.vue'
import DeleteDrillModal from './DeleteDrillModal.vue'
import { toast } from '../../../lib/toast'

defineProps({
  userName: { type: String, default: '' }
})

const drills = ref([])
const sessions = ref([])
const placements = ref([])
const loading = ref(true)
const selectedDrill = ref(null)
const showAddDrill = ref(false)
const addDrillPreset = ref(null)
const showEditDrill = ref(false)
const showLogSession = ref(false)
const confirmDeleteDrill = ref(false)

const sessionsByDrill = computed(() => {
  const map = {}
  for (const s of sessions.value) {
    if (!map[s.drill_id]) map[s.drill_id] = []
    map[s.drill_id].push(s)
  }
  return map
})

const sessionsForSelected = computed(() => {
  if (!selectedDrill.value) return []
  return sessionsByDrill.value[selectedDrill.value.id] || []
})

const placementsForSelected = computed(() => {
  if (!selectedDrill.value) return []
  return placements.value.filter(p => p.drill_id === selectedDrill.value.id)
})

const loadAll = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: drillsData, error: drillsError } = await supabase
      .from('practice_drills')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (drillsError) { console.error('Error loading drills:', drillsError); return }
    drills.value = drillsData || []

    if (drills.value.length === 0) {
      sessions.value = []
      placements.value = []
      return
    }

    const drillIds = drills.value.map(d => d.id)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .in('drill_id', drillIds)
      .order('session_date', { ascending: true })

    if (sessionsError) { console.error('Error loading sessions:', sessionsError); return }
    sessions.value = sessionsData || []

    const shotMapDrillIds = drills.value
      .filter(d => d.metric_type === 'shot_map')
      .map(d => d.id)
    if (shotMapDrillIds.length > 0) {
      const { data: placementsData, error: placementsError } = await supabase
        .from('practice_shot_placements')
        .select('*')
        .in('drill_id', shotMapDrillIds)
      if (placementsError) console.error('Error loading placements:', placementsError)
      placements.value = placementsData || []
    } else {
      placements.value = []
    }
  } finally {
    loading.value = false
  }
}

const selectDrill = (drill) => { selectedDrill.value = drill }

const openAddDrill = (preset) => {
  // Preset arrives when the user taps a starter card; otherwise it's
  // a plain "+ New drill" click and the form should be blank.
  addDrillPreset.value = (preset && typeof preset === 'object' && preset.metric_type) ? preset : null
  showAddDrill.value = true
}

const onCreateDrill = async (form) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data, error } = await supabase
    .from('practice_drills')
    .insert([{
      user_id: user.id,
      name: form.name.trim(),
      metric_type: form.metric_type,
      unit: form.unit?.trim() || null,
      lower_is_better: !!form.lower_is_better,
      target_value: form.target_value === '' || form.target_value === null ? null : Number(form.target_value),
      notes: form.notes?.trim() || null
    }])
    .select()
    .single()
  if (error) { console.error('Error creating drill:', error); toast.error('Could not create drill.'); return }
  drills.value = [data, ...drills.value]
  showAddDrill.value = false
}

const onUpdateDrill = async (form) => {
  if (!selectedDrill.value) return
  const id = selectedDrill.value.id
  const { data, error } = await supabase
    .from('practice_drills')
    .update({
      name: form.name.trim(),
      metric_type: form.metric_type,
      unit: form.unit?.trim() || null,
      lower_is_better: !!form.lower_is_better,
      target_value: form.target_value === '' || form.target_value === null ? null : Number(form.target_value),
      notes: form.notes?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('Error updating drill:', error); toast.error('Could not update drill.'); return }
  const idx = drills.value.findIndex(d => d.id === id)
  if (idx !== -1) drills.value.splice(idx, 1, data)
  selectedDrill.value = data
  showEditDrill.value = false
}

const onDeleteDrill = async () => {
  if (!selectedDrill.value) return
  const id = selectedDrill.value.id
  const { error } = await supabase.from('practice_drills').delete().eq('id', id)
  if (error) { console.error('Error deleting drill:', error); toast.error('Could not delete drill.'); return }
  drills.value = drills.value.filter(d => d.id !== id)
  sessions.value = sessions.value.filter(s => s.drill_id !== id)
  placements.value = placements.value.filter(p => p.drill_id !== id)
  selectedDrill.value = null
  confirmDeleteDrill.value = false
}

const onLogSession = async (form) => {
  if (!selectedDrill.value) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const payload = {
    user_id: user.id,
    drill_id: selectedDrill.value.id,
    session_date: form.session_date,
    primary_value: Number(form.primary_value),
    secondary_value: form.secondary_value === '' || form.secondary_value === null || form.secondary_value === undefined
      ? null
      : Number(form.secondary_value),
    notes: form.notes?.trim() || null
  }
  const { data: sessionRow, error } = await supabase
    .from('practice_sessions')
    .insert([payload])
    .select()
    .single()
  if (error) { console.error('Error logging session:', error); toast.error('Could not log session.'); return }
  sessions.value = [...sessions.value, sessionRow].sort(
    (a, b) => new Date(a.session_date) - new Date(b.session_date)
  )

  if (Array.isArray(form.placements) && form.placements.length > 0) {
    const rows = form.placements.map(p => ({
      session_id: sessionRow.id,
      drill_id: selectedDrill.value.id,
      user_id: user.id,
      x_pct: p.x_pct,
      y_pct: p.y_pct,
      outcome: p.outcome,
      foot: p.foot ?? null
    }))
    const { data: placementRows, error: placementError } = await supabase
      .from('practice_shot_placements')
      .insert(rows)
      .select()
    if (placementError) {
      console.error('Error saving shot placements:', placementError)
      toast.error('Session saved but shot placements failed to save.')
    } else if (placementRows) {
      placements.value = [...placements.value, ...placementRows]
    }
  }

  showLogSession.value = false
}

const deleteSession = async (sessionId) => {
  const { error } = await supabase.from('practice_sessions').delete().eq('id', sessionId)
  if (error) { console.error('Error deleting session:', error); toast.error('Could not delete session.'); return }
  sessions.value = sessions.value.filter(s => s.id !== sessionId)
  placements.value = placements.value.filter(p => p.session_id !== sessionId)
}

onMounted(loadAll)
</script>

<style scoped>
.practice-section {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-soft);
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .practice-section {
    padding: var(--space-4);
  }
}
</style>
