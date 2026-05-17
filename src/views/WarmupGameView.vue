<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter }    from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useWarmup }    from '../composables/useWarmup.js'
import AppHeader        from '../components/AppHeader.vue'

const router = useRouter()

const {
  timeDisplay, isUrgent, gameOver,
  totalDarts, hits, accuracy,
  recordDart, undoLast, startTimer, endSession, cleanup,
} = useWarmup(gameSettings.value)

// --- Onglet actif : single / double / triple ---
const activeTab = ref('single')

const TABS = [
  { id: 'single', label: 'Simple',  multiplier: 1 },
  { id: 'double', label: 'Double',  multiplier: 2 },
  { id: 'triple', label: 'Triple',  multiplier: 3 },
]

// Grille 1-20 organisée en 4 lignes de 5
const GRID_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const currentMultiplier = computed(
  () => TABS.find(t => t.id === activeTab.value)?.multiplier ?? 1
)

// Libellé de la zone entraînée
const ZONE_LABELS = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  bull:   'Bull (50)',
  outer:  'Outer (25)',
}
const zoneLabel = computed(() => ZONE_LABELS[gameSettings.value.trainZone] ?? '')

// --- Actions ---
function tapSector(sector) {
  const tab = TABS.find(t => t.id === activeTab.value)
  recordDart({
    type:   tab.id,
    sector,
    pts:    sector * tab.multiplier,
    label:  tab.id === 'single' ? String(sector) : `${tab.id === 'double' ? 'D' : 'T'}${sector}`,
  })
}

function tapBull() {
  recordDart({ type: 'bull', sector: null, pts: 50, label: 'Bull' })
}

function tapOuter() {
  recordDart({ type: 'bull', sector: null, pts: 25, label: 'Outer' })
}

function tapMiss() {
  recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })
}

onMounted(() => startTimer())
onUnmounted(() => cleanup())
</script>

<template>
  <div class="warmup">
    <!-- Header -->
    <AppHeader title="ECHAUFFEMENT" @back="router.push({ name: 'warmup-settings' })">
      <template #right>
        <div class="warmup__timer" :class="{ 'warmup__timer--urgent': isUrgent }">
          {{ timeDisplay }}
        </div>
      </template>
    </AppHeader>

    <!-- Écran de jeu -->
    <div v-if="!gameOver" class="warmup__game">
      <!-- Carte stats -->
      <div class="warmup__card">
        <div class="warmup__card-zone">{{ zoneLabel }}</div>
        <div class="warmup__card-stats">
          <div class="warmup__stat">
            <span class="warmup__stat-value">{{ hits }}/{{ totalDarts }}</span>
            <span class="warmup__stat-label">touches</span>
          </div>
          <div class="warmup__stat-divider" />
          <div class="warmup__stat">
            <span class="warmup__stat-value">{{ accuracy }}%</span>
            <span class="warmup__stat-label">précision</span>
          </div>
        </div>
      </div>

      <!-- Onglets Single / Double / Triple -->
      <div class="warmup__tabs">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="warmup__tab"
          :class="{ 'warmup__tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
        <button class="warmup__tab warmup__tab--bull" @click="tapBull">Bull<br><span>50</span></button>
        <button class="warmup__tab warmup__tab--outer" @click="tapOuter">Outer<br><span>25</span></button>
      </div>

      <!-- Grille de nombres -->
      <div class="warmup__grid">
        <template v-for="row in GRID_ROWS" :key="row[0]">
          <button
            v-for="n in row"
            :key="n"
            class="warmup__cell"
            @click="tapSector(n)"
          >
            <span class="warmup__cell-num">{{ n }}</span>
            <span class="warmup__cell-pts">{{ n * currentMultiplier }}</span>
          </button>
        </template>
      </div>

      <!-- Ligne du bas -->
      <div class="warmup__bottom">
        <button class="warmup__bottom-undo" @click="undoLast">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
          </svg>
        </button>
        <button class="warmup__bottom-miss" @click="tapMiss">MANQUÉ</button>
        <button class="warmup__bottom-end" @click="endSession">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Écran de récap -->
    <div v-else class="warmup__recap">
      <div class="warmup__recap-title">SESSION TERMINÉE</div>

      <div class="warmup__recap-score" :class="`warmup__recap-score--${accuracy >= 70 ? 'good' : accuracy >= 40 ? 'mid' : 'low'}`">
        {{ accuracy }}<span>%</span>
      </div>
      <div class="warmup__recap-zone">{{ zoneLabel }}</div>

      <div class="warmup__recap-stats">
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ totalDarts }}</span>
          <span class="warmup__recap-stat-lbl">fléchettes</span>
        </div>
        <div class="warmup__recap-sep" />
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ hits }}</span>
          <span class="warmup__recap-stat-lbl">dans la zone</span>
        </div>
        <div class="warmup__recap-sep" />
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ totalDarts - hits }}</span>
          <span class="warmup__recap-stat-lbl">manqués</span>
        </div>
      </div>

      <div class="warmup__recap-actions">
        <button
          class="warmup__recap-btn warmup__recap-btn--primary"
          @click="router.push({ name: 'warmup-game', query: { t: Date.now() } })"
        >
          Recommencer
        </button>
        <button
          class="warmup__recap-btn warmup__recap-btn--secondary"
          @click="router.push({ name: 'lobby' })"
        >
          Accueil
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warmup {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;

  // Timer dans le header
  &__timer {
    font-family: $font-display;
    font-size: $title-xxs;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    padding-right: $padding-xxs;
    transition: color 0.3s;

    &--urgent { color: $error; }
  }

  // --- Jeu ---
  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: $padding-xxs $padding-sm $padding-xs;
    gap: $padding-xxs;
  }

  // Carte orange stats
  &__card {
    background: $orange;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $padding-xxs;
  }

  &__card-zone {
    font-family: $font-display;
    font-size: $title-xxs;
    color: rgba(255,255,255,0.7);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  &__card-stats {
    display: flex;
    align-items: center;
    gap: $padding-md;
  }

  &__stat {
    display: flex;
    flex-direction: column;

    &-value {
      font-family: $font-display;
      font-size: $title-lg;
      color: $white;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    &-label {
      font-size: $text-xs;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  &__stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255,255,255,0.25);
  }

  // Onglets
  &__tabs {
    display: flex;
    border-bottom: 1px solid $border;
  }

  &__tab {
    flex: 1;
    padding: $padding-xs $padding-xxs;
    font-size: $text-xs;
    font-weight: 700;
    color: $muted;
    text-align: center;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    line-height: 1.2;

    span { font-size: $text-xxs; }

    &--active {
      color: $orange;
      border-bottom-color: $orange;
    }

    &--bull, &--outer {
      color: $muted;
      &:active { color: $text-color; }
    }
  }

  // Grille de nombres
  &__grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(4, 1fr);
    border-left: 1px solid $border;
    border-top: 1px solid $border;
  }

  &__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: 1px solid $border;
    border-bottom: 1px solid $border;
    gap: 2px;
    transition: background 0.1s;

    &:active { background: rgba(255,255,255,0.08); }

    &-num {
      font-family: $font-display;
      font-size: $title-xs;
      color: $text-color;
      line-height: 1;
    }

    &-pts {
      font-size: $text-xxs;
      color: $muted;
    }
  }

  // Ligne du bas
  &__bottom {
    display: flex;
    align-items: center;
    gap: $padding-xs;
    padding: $padding-xxs 0;
  }

  &__bottom-undo {
    color: $muted;
    padding: $padding-xs;
    transition: color 0.15s;
    &:active { color: $text-color; }
  }

  &__bottom-miss {
    flex: 1;
    font-family: $font-display;
    font-size: $title-xxs;
    letter-spacing: 2px;
    color: $text-color;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: $padding-xs;
    transition: background 0.1s;
    &:active { background: rgba($error, 0.2); color: $error-light; }
  }

  &__bottom-end {
    color: $muted;
    padding: $padding-xs;
    transition: color 0.15s;
    &:active { color: $error; }
  }

  // --- Récap ---
  &__recap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $padding-xl $padding-md;
    gap: $padding-lg;
  }

  &__recap-title {
    font-family: $font-display;
    font-size: $title-xs;
    letter-spacing: 2px;
    color: $muted;
  }

  &__recap-score {
    font-family: $font-display;
    font-size: $title-xxl;
    line-height: 1;
    font-variant-numeric: tabular-nums;

    span { font-size: $title-lg; }

    &--good { color: $accent; }
    &--mid  { color: $orange; }
    &--low  { color: $error; }
  }

  &__recap-zone {
    font-size: $text-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: -$padding-md;
  }

  &__recap-stats {
    display: flex;
    align-items: center;
    gap: $padding-md;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-md $padding-lg;
    width: 100%;
    justify-content: center;
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
    width: 100%;
  }

  &__recap-btn {
    flex: 1;
    border-radius: $radius-pill;
    font-size: $text-sm;
    font-weight: 700;
    padding: $padding-sm;
    transition: transform 0.1s, opacity 0.15s;

    &:active { transform: scale(0.97); opacity: 0.85; }

    &--primary  { background: #1D4ED8; color: $white; }
    &--secondary { background: $surface; border: 1px solid $border; color: $muted; }
  }
}
</style>
