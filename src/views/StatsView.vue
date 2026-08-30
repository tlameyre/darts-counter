<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import AppTabs from '../components/AppTabs.vue'
import StatsScoreTab from '../components/stats/StatsScoreTab.vue'
import StatsWarmupTab from '../components/stats/StatsWarmupTab.vue'
import StatsX01Tab from '../components/stats/StatsX01Tab.vue'
import StatsCheckoutTab from '../components/stats/StatsCheckoutTab.vue'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'

const router     = useRouter()
const dbStore    = useDbStore()
const badgeStore = useBadgeStore()

const globalStats      = ref(null)
const gameSessions     = ref([])
const warmupSessions   = ref([])
const x01Sessions      = ref([])
const checkoutSessions = ref([])
const loading          = ref(true)

onMounted(async () => {
  const [s, gs, ws, x1, co] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchGameSessions(10),
    dbStore.fetchWarmupSessions(10),
    dbStore.fetchX01Sessions(10),
    dbStore.fetchCheckoutSessions(10),
  ])
  globalStats.value      = s
  gameSessions.value     = gs
  warmupSessions.value   = ws
  x01Sessions.value      = x1
  checkoutSessions.value = co
  loading.value          = false
})

const MODES = [
  { id: 'score',    label: 'Quiz',  color: '#D64A24' },
  { id: 'warmup',   label: 'Echauffement', color: '#1D4ED8' },
  { id: 'x01',      label: 'x01',    color: '#047857' },
  { id: 'checkout', label: 'Checkouts', color: '#0891B2' },
]
const selectedMode = ref('score')

const selectedSession = ref(null)
const showDetail      = ref(false)

function openDetail(session) {
  selectedSession.value = session
  showDetail.value      = true
}

async function deleteSession(id) {
  if (selectedMode.value === 'score') {
    await dbStore.deleteGameSession(id)
    gameSessions.value = gameSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'warmup') {
    await dbStore.deleteWarmupSession(id)
    warmupSessions.value = warmupSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'x01') {
    await dbStore.deleteX01Session(id)
    x01Sessions.value = x01Sessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'checkout') {
    await dbStore.deleteCheckoutSession(id)
    checkoutSessions.value = checkoutSessions.value.filter(s => s.id !== id)
  }
  showDetail.value = false
  const [newGlobal, profileStats] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchProfileStats(),
  ])
  globalStats.value = newGlobal
  await badgeStore.revokeVolumeBadges(profileStats)
}
</script>

<template>
  <div class="stats">
    <header class="stats__header">
      <h1 class="stats__title">STATISTIQUES</h1>
      <AppTabs :tabs="MODES" v-model="selectedMode" />
    </header>

    <main class="stats__main">
      <div v-if="loading" class="stats__empty">Chargement…</div>

      <template v-else>
        <StatsScoreTab
          v-if="selectedMode === 'score'"
          :summary="globalStats?.gameStats ?? null"
          :sessions="gameSessions"
          @open-detail="openDetail"
        />
        <StatsWarmupTab
          v-else-if="selectedMode === 'warmup'"
          :summary="globalStats?.warmupStats ?? null"
          :sessions="warmupSessions"
          @open-detail="openDetail"
          @open-chart="router.push({ name: 'stats-warmup-detail' })"
        />
        <StatsX01Tab
          v-else-if="selectedMode === 'x01'"
          :sessions="x01Sessions"
          @open-detail="openDetail"
        />
        <StatsCheckoutTab
          v-else-if="selectedMode === 'checkout'"
          :sessions="checkoutSessions"
          @open-detail="openDetail"
        />
      </template>
    </main>

    <StatsSessionDetail
      :show="showDetail"
      :session="selectedSession"
      :mode="selectedMode"
      @close="showDetail = false"
      @delete="deleteSession"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-lg $padding-md 0;

  &__header {
    padding-top: $padding-lg;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    flex-shrink: 0;
    padding-bottom: $padding-lg;
  }

  &__title {
    @include title-xl;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    overflow: hidden;
    padding-bottom: calc($padding-xxl + 64px);
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}

@media (min-width: $bp-laptop) {
  .stats {
    padding: $padding-xl $padding-xl 0;

    &__header { gap: $gap-lg; padding-top: $padding-xl; padding-bottom: $padding-xl; }
    &__title  { @include title-xxl; }
    &__main   { gap: $gap-lg; padding-bottom: calc($padding-xxl + 64px); }
    &__empty  { @include text-md; }
  }
}
</style>
