<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useWarmup } from '../composables/useWarmup.js'
import WarmupStatsCard from '../components/warmup/WarmupStatsCard.vue'
import WarmupDartSlots from '../components/warmup/WarmupDartSlots.vue'
import WarmupGrid from '../components/warmup/WarmupGrid.vue'
import WarmupBottomBar from '../components/warmup/WarmupBottomBar.vue'
import WarmupRecap from '../components/warmup/WarmupRecap.vue'
import WarmupZoneModal from '../components/warmup/WarmupZoneModal.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'warmup-settings' })

const {
  timeDisplay, isUrgent, gameOver,
  currentZone, currentZoneStats, zoneRecapStats, sessionStats,
  darts, recordDart, undoLast, changeZone, startTimer, endSession, cleanup,
} = useWarmup(gameSettings.value ?? { duration: 5, zone: { sector: 20, type: 'D' } })

const showZoneModal = ref(false)

const justCompleted = ref(false)
let _justCompletedTimer = null

watch(() => darts.value.length, (newLen, oldLen) => {
  clearTimeout(_justCompletedTimer)
  if (newLen > oldLen && newLen > 0 && newLen % 3 === 0) {
    justCompleted.value = true
    _justCompletedTimer = setTimeout(() => { justCompleted.value = false }, 700)
  } else if (newLen < oldLen) {
    justCompleted.value = false
  }
})

const tourNumber = computed(() => {
  if (justCompleted.value) return Math.floor(darts.value.length / 3)
  return Math.floor(darts.value.length / 3) + 1
})

const displayedDarts = computed(() => {
  if (darts.value.length === 0) return []
  if (justCompleted.value) return darts.value.slice(-3)
  const inTurn = darts.value.length % 3
  return inTurn > 0 ? darts.value.slice(-inTurn) : []
})

onMounted(() => startTimer())
onUnmounted(() => {
  cleanup()
  clearTimeout(_justCompletedTimer)
})
</script>

<template>
  <div class="warmup">

    <header class="warmup__header">
      <button class="warmup__header-btn" @click="router.push({ name: 'warmup-settings' })">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H12M15 9L12 12L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round" />
          <path
            d="M19 6V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V18"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1 class="warmup__header-title">ECHAUFFEMENT</h1>
      <button class="warmup__header-btn" @click="showZoneModal = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M9.71622 2.75625C9.82872 2.20125 10.32 1.8 10.89 1.8H13.1325C13.7025 1.8 14.1937 2.20125 14.3062 2.75625L14.85 5.38125C15.3787 5.60625 15.8737 5.895 16.3237 6.23625L18.8662 5.3925C19.4062 5.2125 19.9987 5.4375 20.2837 5.9325L21.405 7.875C21.69 8.37 21.5887 8.9925 21.1612 9.37125L19.1625 11.1487C19.1962 11.4262 19.2112 11.7112 19.2112 12C19.2112 12.2887 19.1925 12.5737 19.1625 12.8512L21.165 14.6325C21.5925 15.0112 21.69 15.6375 21.4087 16.1287L20.2875 18.0712C20.0025 18.5625 19.41 18.7912 18.87 18.6112L16.3275 17.7675C15.8737 18.1087 15.3787 18.3937 14.8537 18.6225L14.3137 21.2437C14.1975 21.8025 13.7062 22.2 13.14 22.2H10.8975C10.3275 22.2 9.83622 21.7987 9.72372 21.2437L9.18372 18.6225C8.65497 18.3975 8.16372 18.1087 7.70997 17.7675L5.15622 18.6112C4.61622 18.7912 4.02372 18.5662 3.73872 18.0712L2.61747 16.1287C2.33247 15.6337 2.43372 15.0112 2.86122 14.6325L4.86372 12.8512C4.82997 12.5737 4.81497 12.2887 4.81497 12C4.81497 11.7112 4.83372 11.4262 4.86372 11.1487L2.86122 9.3675C2.43372 8.98875 2.33622 8.3625 2.61747 7.87125L3.73872 5.92875C4.02372 5.43375 4.61622 5.20875 5.15622 5.38875L7.69872 6.2325C8.15247 5.89125 8.64747 5.60625 9.17247 5.3775L9.71622 2.75625ZM12.0112 15C13.6687 14.9925 15.0075 13.6462 15 11.9887C14.9925 10.3312 13.6462 8.9925 11.9887 9C10.3312 9.0075 8.99247 10.3537 8.99997 12.0112C9.00747 13.6687 10.3537 15.0075 12.0112 15Z"
            fill="currentColor" />
        </svg>
      </button>
    </header>

    <div v-if="!gameOver" class="warmup__game">
      <WarmupStatsCard :zone="currentZone" :stats="currentZoneStats" />
      <WarmupDartSlots
        :darts="displayedDarts"
        :tourNumber="tourNumber"
        :timeDisplay="timeDisplay"
        :isUrgent="isUrgent"
      />
      <WarmupGrid :locked="justCompleted" @dart="recordDart" />
      <WarmupBottomBar
        :locked="justCompleted"
        @undo="undoLast"
        @miss="recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })"
        @end="endSession"
      />
    </div>

    <WarmupRecap
      v-else
      :zoneRecapStats="zoneRecapStats"
      :sessionStats="sessionStats"
      @restart="router.push({ name: 'warmup-game', query: { t: Date.now() } })"
      @home="router.push({ name: 'lobby' })"
    />

    <WarmupZoneModal
      :show="showZoneModal"
      :zone="currentZone"
      @update:show="showZoneModal = $event"
      @confirm="zone => { changeZone(zone); showZoneModal = false }"
    />

  </div>
</template>

<style lang="scss" scoped>
.warmup {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__header-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
    &:active { opacity: 0.6; }
  }

  &__header-title {
    font-family: $font-display;
    font-size: $title-sm;
    font-weight: 400;
    letter-spacing: 1px;
    color: $text-color;
    text-align: center;
  }

  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }
}
</style>
