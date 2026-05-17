<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useWarmup, formatZoneLabel } from '../composables/useWarmup.js'
import ZonePicker from '../components/ZonePicker.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'warmup-settings' })

const {
  timeDisplay, isUrgent, gameOver,
  currentZone, currentZoneStats, zoneRecapStats, sessionStats,
  darts, recordDart, undoLast, changeZone, startTimer, endSession, cleanup,
} = useWarmup(gameSettings.value ?? { duration: 5, zone: { sector: 20, type: 'D' } })

// --- Dartboard red/green sector mapping ---
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

// --- Active multiplier tab ---
const activeTab = ref('single')

const TABS = [
  { id: 'single', label: 'S', multiplier: 1 },
  { id: 'double', label: 'D', multiplier: 2 },
  { id: 'triple', label: 'T', multiplier: 3 },
]

const GRID_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const currentMultiplier = computed(
  () => TABS.find(t => t.id === activeTab.value)?.multiplier ?? 1
)

// --- Zone change modal ---
const showZoneModal = ref(false)
const tempZone = ref({ sector: 20, type: 'D' })

function openZoneModal() {
  tempZone.value = { ...currentZone.value }
  showZoneModal.value = true
}

function confirmZoneChange() {
  changeZone(tempZone.value)
  showZoneModal.value = false
}

// --- Tour tracking (3 darts = 1 tour) ---
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

// --- Visual feedback on tap ---
const pressedKey = ref(null)
let _pressTimer = null

function flash(key) {
  clearTimeout(_pressTimer)
  pressedKey.value = key
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
}

// --- Cell colors (dartboard-accurate) ---
function cellStyle(sector) {
  if (activeTab.value === 'single') {
    return RED_NUMBERS.has(sector)
      ? { background: '#000000', color: '#ffffff' }
      : { background: '#f0e8d0', color: '#111111' }
  }
  return RED_NUMBERS.has(sector)
    ? { background: '#B21327', color: '#ffffff' }
    : { background: '#36cc86', color: '#ffffff' }
}

// --- Duration format for recap ---
function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`
}

// --- Actions ---
function tapSector(sector) {
  if (justCompleted.value) return
  const tab = TABS.find(t => t.id === activeTab.value)
  flash(`s-${sector}`)
  recordDart({
    type: tab.id,
    sector,
    pts: sector * tab.multiplier,
    label: tab.id === 'single' ? String(sector) : `${tab.id === 'double' ? 'D' : 'T'}${sector}`,
  })
}

function tapBull() {
  if (justCompleted.value) return
  flash('bull')
  recordDart({ type: 'bull', sector: null, pts: 50, label: 'Bull' })
}

function tapOuter() {
  if (justCompleted.value) return
  flash('outer')
  recordDart({ type: 'bull', sector: null, pts: 25, label: 'Outer' })
}

function tapMiss() {
  if (justCompleted.value) return
  flash('miss')
  recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })
}

onMounted(() => startTimer())
onUnmounted(() => {
  cleanup()
  clearTimeout(_justCompletedTimer)
  clearTimeout(_pressTimer)
})
</script>

<template>
  <div class="warmup">

    <!-- Header -->
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
      <button class="warmup__header-btn" @click="openZoneModal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M9.71622 2.75625C9.82872 2.20125 10.32 1.8 10.89 1.8H13.1325C13.7025 1.8 14.1937 2.20125 14.3062 2.75625L14.85 5.38125C15.3787 5.60625 15.8737 5.895 16.3237 6.23625L18.8662 5.3925C19.4062 5.2125 19.9987 5.4375 20.2837 5.9325L21.405 7.875C21.69 8.37 21.5887 8.9925 21.1612 9.37125L19.1625 11.1487C19.1962 11.4262 19.2112 11.7112 19.2112 12C19.2112 12.2887 19.1925 12.5737 19.1625 12.8512L21.165 14.6325C21.5925 15.0112 21.69 15.6375 21.4087 16.1287L20.2875 18.0712C20.0025 18.5625 19.41 18.7912 18.87 18.6112L16.3275 17.7675C15.8737 18.1087 15.3787 18.3937 14.8537 18.6225L14.3137 21.2437C14.1975 21.8025 13.7062 22.2 13.14 22.2H10.8975C10.3275 22.2 9.83622 21.7987 9.72372 21.2437L9.18372 18.6225C8.65497 18.3975 8.16372 18.1087 7.70997 17.7675L5.15622 18.6112C4.61622 18.7912 4.02372 18.5662 3.73872 18.0712L2.61747 16.1287C2.33247 15.6337 2.43372 15.0112 2.86122 14.6325L4.86372 12.8512C4.82997 12.5737 4.81497 12.2887 4.81497 12C4.81497 11.7112 4.83372 11.4262 4.86372 11.1487L2.86122 9.3675C2.43372 8.98875 2.33622 8.3625 2.61747 7.87125L3.73872 5.92875C4.02372 5.43375 4.61622 5.20875 5.15622 5.38875L7.69872 6.2325C8.15247 5.89125 8.64747 5.60625 9.17247 5.3775L9.71622 2.75625ZM12.0112 15C13.6687 14.9925 15.0075 13.6462 15 11.9887C14.9925 10.3312 13.6462 8.9925 11.9887 9C10.3312 9.0075 8.99247 10.3537 8.99997 12.0112C9.00747 13.6687 10.3537 15.0075 12.0112 15Z"
            fill="currentColor" />
        </svg>
      </button>
    </header>

    <!-- Écran de jeu -->
    <div v-if="!gameOver" class="warmup__game">

      <!-- Carte stats bleue -->
      <div class="warmup__card">
        <div class="warmup__card-zone">{{ formatZoneLabel(currentZone) }}</div>
        <div class="warmup__card-rows">
          <div class="warmup__card-row">
            <span class="warmup__card-lbl">Fléchettes jetées</span>
            <span class="warmup__card-val">{{ currentZoneStats.total }}</span>
          </div>
          <div class="warmup__card-row">
            <span class="warmup__card-lbl">Fléchettes touchées</span>
            <span class="warmup__card-val">{{ currentZoneStats.hits }}</span>
          </div>
          <div class="warmup__card-row">
            <span class="warmup__card-lbl">Taux de réussite</span>
            <span class="warmup__card-val">{{ currentZoneStats.accuracy }}%</span>
          </div>
        </div>
      </div>

      <!-- Ligne TOUR + timer -->
      <div class="warmup__tour-row">
        <span class="warmup__tour-label">TOUR {{ tourNumber }}</span>
        <div class="warmup__timer" :class="{ 'warmup__timer--urgent': isUrgent }">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ timeDisplay }}
        </div>
      </div>

      <!-- Pill slots des 3 fléchettes -->
      <div class="warmup__slots">
        <div class="warmup__slots-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19.2 12C19.2 8.02499 15.975 4.79999 12 4.79999C8.02499 4.79999 4.79999 8.02499 4.79999 12C4.79999 15.975 8.02499 19.2 12 19.2C15.975 19.2 19.2 15.975 19.2 12ZM2.39999 12C2.39999 6.69749 6.69749 2.39999 12 2.39999C17.3025 2.39999 21.6 6.69749 21.6 12C21.6 17.3025 17.3025 21.6 12 21.6C6.69749 21.6 2.39999 17.3025 2.39999 12ZM12 15C13.6575 15 15 13.6575 15 12C15 10.3425 13.6575 8.99999 12 8.99999C10.3425 8.99999 8.99999 10.3425 8.99999 12C8.99999 13.6575 10.3425 15 12 15ZM12 6.59999C14.9812 6.59999 17.4 9.01874 17.4 12C17.4 14.9812 14.9812 17.4 12 17.4C9.01874 17.4 6.59999 14.9812 6.59999 12C6.59999 9.01874 9.01874 6.59999 12 6.59999ZM10.8 12C10.8 11.3362 11.3362 10.8 12 10.8C12.6637 10.8 13.2 11.3362 13.2 12C13.2 12.6637 12.6637 13.2 12 13.2C11.3362 13.2 10.8 12.6637 10.8 12Z"
              fill="#333" />
          </svg>
        </div>
        <div class="warmup__slots-sep" />
        <div class="warmup__slot" v-for="i in 3" :key="i">
          <Transition name="slot-pop">
            <span v-if="displayedDarts[i - 1]" :key="displayedDarts[i - 1].ts">
              {{ displayedDarts[i - 1].pts }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- Grille -->
      <div class="warmup__grid">
        <button v-for="tab in TABS" :key="tab.id" class="warmup__gtab"
          :class="{ 'warmup__gtab--active': activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
        <button class="warmup__gtab warmup__gtab--sb" :class="{ 'warmup__gtab--pressed': pressedKey === 'outer' }"
          @click="tapOuter">SB</button>
        <button class="warmup__gtab warmup__gtab--b" :class="{ 'warmup__gtab--pressed': pressedKey === 'bull' }"
          @click="tapBull">B</button>
        <template v-for="row in GRID_ROWS" :key="row[0]">
          <button v-for="n in row" :key="n" class="warmup__cell" :style="cellStyle(n)"
            :class="{ 'warmup__cell--pressed': pressedKey === `s-${n}` }" @click="tapSector(n)">
            <span class="warmup__cell-num">{{ n }}</span>
            <span v-if="activeTab !== 'single'" class="warmup__cell-pts">{{ n * currentMultiplier }}</span>
          </button>
        </template>
      </div>

      <!-- Bas : undo / MANQUÉ / fin -->
      <div class="warmup__bottom">
        <button class="warmup__bottom-undo" @click="undoLast">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
        </button>
        <button class="warmup__bottom-miss" :class="{ 'warmup__bottom-miss--pressed': pressedKey === 'miss' }"
          @click="tapMiss">MANQUÉ</button>
        <button class="warmup__bottom-end" @click="endSession">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Récap -->
    <div v-else class="warmup__recap">
      <div class="warmup__recap-title">SESSION TERMINÉE</div>

      <!-- Par zone -->
      <div class="warmup__recap-zones">
        <div v-for="zs in zoneRecapStats" :key="`${zs.zone.sector}-${zs.zone.type}`" class="warmup__recap-zone-card">
          <div class="warmup__recap-zone-header">
            <span class="warmup__recap-zone-name">{{ formatZoneLabel(zs.zone) }}</span>
            <span class="warmup__recap-zone-acc" :class="`warmup__recap-zone-acc--${zs.accuracy >= 70 ? 'good' : zs.accuracy >= 40 ? 'mid' : 'low'}`">
              {{ zs.accuracy }}%
            </span>
          </div>
          <div class="warmup__recap-zone-stats">
            <div class="warmup__recap-zone-stat">
              <span class="warmup__recap-zone-stat-val">{{ fmtDuration(zs.durationMs) }}</span>
              <span class="warmup__recap-zone-stat-lbl">temps</span>
            </div>
            <div class="warmup__recap-zone-sep" />
            <div class="warmup__recap-zone-stat">
              <span class="warmup__recap-zone-stat-val">{{ zs.total }}</span>
              <span class="warmup__recap-zone-stat-lbl">jetées</span>
            </div>
            <div class="warmup__recap-zone-sep" />
            <div class="warmup__recap-zone-stat">
              <span class="warmup__recap-zone-stat-val">{{ zs.hits }}</span>
              <span class="warmup__recap-zone-stat-lbl">touches</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Total session -->
      <div class="warmup__recap-total">
        <div class="warmup__recap-total-title">SESSION TOTALE</div>
        <div class="warmup__recap-stats">
          <div class="warmup__recap-stat">
            <span class="warmup__recap-stat-val">{{ sessionStats.total }}</span>
            <span class="warmup__recap-stat-lbl">fléchettes</span>
          </div>
          <div class="warmup__recap-sep" />
          <div class="warmup__recap-stat">
            <span class="warmup__recap-stat-val">{{ sessionStats.hits }}</span>
            <span class="warmup__recap-stat-lbl">touches</span>
          </div>
          <div class="warmup__recap-sep" />
          <div class="warmup__recap-stat">
            <span class="warmup__recap-stat-val">{{ sessionStats.accuracy }}%</span>
            <span class="warmup__recap-stat-lbl">précision</span>
          </div>
        </div>
      </div>

      <div class="warmup__recap-actions">
        <button
          class="warmup__recap-btn warmup__recap-btn--primary"
          @click="router.push({ name: 'warmup-game', query: { t: Date.now() } })">Recommencer</button>
        <button
          class="warmup__recap-btn warmup__recap-btn--secondary"
          @click="router.push({ name: 'lobby' })">Accueil</button>
      </div>
    </div>

    <!-- Modal changement de zone -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showZoneModal" class="warmup-modal" @click.self="showZoneModal = false">
          <div class="warmup-modal__sheet">
            <div class="warmup-modal__title">Changer de zone</div>
            <ZonePicker v-model="tempZone" />
            <div class="warmup-modal__actions">
              <button class="warmup-modal__btn warmup-modal__btn--cancel" @click="showZoneModal = false">Annuler</button>
              <button class="warmup-modal__btn warmup-modal__btn--confirm" @click="confirmZoneChange">Confirmer</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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

  // Header
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

  // Jeu
  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // Carte bleue
  &__card {
    background: #1D4ED8;
    border-radius: $radius-lg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex-shrink: 0;
    flex: 1;
  }

  &__card-zone {
    font-family: $font-display;
    font-size: $title-xl;
    color: $white;
    line-height: 1;
    text-align: center;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__card-rows {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__card-lbl {
    font-size: $text-md;
    color: rgba(255, 255, 255, 0.75);
  }

  &__card-val {
    font-size: $text-md;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  // Ligne TOUR + timer
  &__tour-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__tour-label {
    font-family: $font-display;
    font-size: $title-xxs;
    color: $text-color;
    letter-spacing: 1px;
  }

  &__timer {
    font-family: $font-display;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    font-size: $title-xxs;
    transition: color 0.3s;
    &--urgent { color: $error; }
  }

  // Pill slots
  &__slots {
    display: flex;
    align-items: stretch;
    background: $white;
    border-radius: $radius-pill;
    overflow: hidden;
    flex-shrink: 0;
    height: 50px;
  }

  &__slots-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $padding-md;
    flex-shrink: 0;
  }

  &__slots-sep {
    width: 1px;
    background: rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
  }

  &__slot {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-size: $title-xs;
    color: $input-text;
    border-left: 1px solid rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  // Grille
  &__gtab {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-size: $title-xxs;
    font-weight: 700;
    color: $muted;
    border-right: 1px solid $border;
    transition: background 0.12s, color 0.12s, filter 0.1s;

    &:last-child { border-right: none; }

    &--active {
      color: $white;
      background: rgba(255, 255, 255, 0.12);
    }

    &--sb { background: $dart-green; color: $white; }
    &--b  { background: $dart-red;   color: $white; }
    &--pressed { filter: brightness(1.35); }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-self: start;
    width: 100%;
  }

  &__cell {
    aspect-ratio: 1;
    display: flex;
    gap: $gap-xxs;
    align-items: center;
    justify-content: center;
    border-right: 2px solid $border;
    border-bottom: 2px solid $border;
    transition: filter 0.1s, transform 0.1s;

    &--pressed {
      filter: brightness(1.45);
      transform: scale(0.93);
    }

    &-num {
      font-family: $font-display;
      font-size: $title-sm;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    &-pts {
      font-family: $font-display;
      font-size: $text-xs;
      opacity: .8;
    }
  }

  // Bas — aligné sur la grille (1 case | 3 cases | 1 case)
  &__bottom {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    align-items: center;
    flex-shrink: 0;
  }

  &__bottom-undo {
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  &__bottom-miss {
    font-family: $font-display;
    font-size: $title-xxs;
    letter-spacing: 2px;
    color: $white;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: $padding-xs;
    transition: background 0.1s, color 0.1s;
    &:active, &--pressed {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__bottom-end {
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
    &:active { color: $error; }
  }

  // Récap
  &__recap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding-bottom: $padding-md;
  }

  &__recap-title {
    font-family: $font-display;
    font-size: $title-xs;
    letter-spacing: 2px;
    color: $muted;
    text-align: center;
    flex-shrink: 0;
  }

  &__recap-zones {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__recap-zone-card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__recap-zone-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__recap-zone-name {
    font-family: $font-display;
    font-size: $title-xxs;
    color: $text-color;
    letter-spacing: 1px;
  }

  &__recap-zone-acc {
    font-family: $font-display;
    font-size: $title-xs;
    font-variant-numeric: tabular-nums;
    &--good { color: $accent; }
    &--mid  { color: $orange; }
    &--low  { color: $error; }
  }

  &__recap-zone-stats {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__recap-zone-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    &-val {
      font-family: $font-display;
      font-size: $title-xxs;
      color: $text-color;
      font-variant-numeric: tabular-nums;
    }
    &-lbl {
      font-size: $text-xxs;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  &__recap-zone-sep {
    width: 1px;
    height: 28px;
    background: $border;
  }

  &__recap-total {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__recap-total-title {
    font-size: $text-xs;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: $muted;
    font-weight: 700;
  }

  &__recap-stats {
    display: flex;
    align-items: center;
    gap: $padding-md;
    justify-content: space-around;
  }

  &__recap-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    &-val {
      font-family: $font-display;
      font-size: $title-xs;
      color: $text-color;
      font-variant-numeric: tabular-nums;
    }
    &-lbl {
      font-size: $text-xxs;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  &__recap-sep {
    width: 1px;
    height: 36px;
    background: $border;
  }

  &__recap-actions {
    display: flex;
    gap: $padding-xs;
    flex-shrink: 0;
    margin-top: auto;
  }

  &__recap-btn {
    flex: 1;
    border-radius: $radius-pill;
    font-size: $text-sm;
    font-weight: 700;
    padding: $padding-sm;
    transition: transform 0.1s, opacity 0.15s;
    &:active { transform: scale(0.97); opacity: 0.85; }
    &--primary   { background: #1D4ED8; color: $white; }
    &--secondary { background: $surface; border: 1px solid $border; color: $muted; }
  }
}

// Animation score dans slot
.slot-pop-enter-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.slot-pop-enter-from   { transform: scale(0.5); opacity: 0; }
</style>

<style lang="scss">
// Modal (non scoped — Teleport sort du scope)
.warmup-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__sheet {
    width: 100%;
    background: #1a2422;
    border-radius: 24px 24px 0 0;
    padding: 24px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__title {
    font-family: 'Noka', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    color: #fff;
    text-align: center;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__btn {
    flex: 1;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    padding: 12px;
    transition: transform 0.1s, opacity 0.15s;
    &:active { transform: scale(0.97); opacity: 0.85; }
    &--cancel  { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    &--confirm { background: #1D4ED8; color: #fff; }
  }
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .warmup-modal__sheet,
.modal-leave-active .warmup-modal__sheet { transition: transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .warmup-modal__sheet,
.modal-leave-to .warmup-modal__sheet { transform: translateY(100%); }
</style>
