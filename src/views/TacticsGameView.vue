<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useTactics } from '../composables/useTactics.js'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import WarmupInput from '../components/warmup/WarmupInput.vue'
import TacticsBoard from '../components/tactics/TacticsBoard.vue'
import TacticsZoneChoiceModal from '../components/tactics/TacticsZoneChoiceModal.vue'
import TacticsLegRecap from '../components/tactics/TacticsLegRecap.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

const router    = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const dbStore   = useDbStore()

if (!gameStore.gameSettings) router.replace({ name: 'tactics-settings' })

const DEFAULT_PLAYERS = [{ id: 'me', name: 'Toi', isMe: true }]
const settings = gameStore.gameSettings ?? { players: DEFAULT_PLAYERS, legsToWin: 1 }
const players  = settings.players ?? DEFAULT_PLAYERS

const {
  activeZoneId,
  currentDarts,
  phase,
  volleyCompleting,
  pendingZoneChoice,
  volleyNumber,
  addDart,
  addMiss,
  undo,
  resolveZoneChoice,
  startNextLeg,
  stats,
  currentPlayerIndex,
  playerCount,
  isMulti,
  meIndex,
  allCompletedLegs,
  lastLegWinnerIndex,
  zonesForPlayer,
  activeZoneIdForPlayer,
  computeStatsForPlayer,
} = useTactics(settings)

const SPECIAL_LABELS = { double: 'Double', triple: 'Triple', bull: 'Bull' }

const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value || !!pendingZoneChoice.value)
const showMenu = ref(false)

function quitGame() {
  showMenu.value = false
  router.push({ name: 'tactics-settings' })
}

function finishGame() {
  showMenu.value = false
  phase.value    = 'game-over'
}

// ── Saisie (toujours le widget warmup — une seule zone active à la fois) ───
// Phase nombres : S/D/T du nombre actif. Phase spéciales : uniquement le
// bouton de la zone visée (Double/Triple) ou Outer/Bull pour la zone Bull.
const inputConfig = computed(() => {
  const id = activeZoneId.value
  if (id == null) return null
  if (id === 'bull')                    return { zones: [{ sector: null }], onlyType: null, labelOverride: null }
  if (id === 'double' || id === 'triple') return { zones: [{ sector: 20 }],  onlyType: id,   labelOverride: id.toUpperCase() }
  return { zones: [{ sector: Number(id) }], onlyType: null, labelOverride: null }
})

// ── Choix de zone (phase nombres, double/triple ambigu) ─────────────────────
const zoneChoiceProps = computed(() => {
  const p = pendingZoneChoice.value
  if (!p) return { dartLabel: '', numberLabel: '', specialLabel: '' }
  return {
    dartLabel:    p.dart.label,
    numberLabel:  p.numberZoneId,
    specialLabel: SPECIAL_LABELS[p.specialZoneId],
  }
})

// ── Plateau partagé (tableau Zone × Joueurs) ────────────────────────────────
const boardPlayers = computed(() => {
  const cards = []
  for (let i = 0; i < playerCount; i++) {
    cards.push({
      name:         players[i]?.name ?? 'Joueur',
      zones:        zonesForPlayer(i),
      activeZoneId: activeZoneIdForPlayer(i),
      isCurrent:    i === currentPlayerIndex.value,
    })
  }
  return cards
})

const activePlayerName = computed(() => players[currentPlayerIndex.value]?.name ?? 'Joueur')

// ── Récap de manche (multi-joueurs uniquement, solo termine direct) ────────
const showLegRecap = computed(() => phase.value === 'leg-recap')
const recapWinnerName = computed(() =>
  lastLegWinnerIndex.value != null ? players[lastLegWinnerIndex.value]?.name ?? null : null
)
const recapLeg = computed(() => {
  if (lastLegWinnerIndex.value == null) return null
  const legs = allCompletedLegs[lastLegWinnerIndex.value].value
  return legs[legs.length - 1] ?? null
})

// ── Fin de partie ────────────────────────────────────────────────────────────
const multiWinnerIndex = computed(() => {
  if (!isMulti || phase.value !== 'game-over') return null
  for (let i = 0; i < playerCount; i++) {
    if (allCompletedLegs[i].value.length >= settings.legsToWin) return i
  }
  return null
})
const multiWinnerName = computed(() =>
  multiWinnerIndex.value != null ? players[multiWinnerIndex.value]?.name ?? 'Joueur' : null
)

// ── Sauvegarde en fin de partie ────────────────────────────────────────────
let saved = false
watch(phase, async (val) => {
  if (val !== 'game-over' || !stats.value || saved) return
  saved = true
  await dbStore.saveTacticsSession({
    legsPlayed: allCompletedLegs[meIndex].value.length,
    stats:      stats.value,
    settings: {
      ...settings,
      humanName: authStore.profile?.username ?? null,
      opponents: isMulti
        ? players
            .map((p, i) => ({ p, i }))
            .filter(({ i }) => i !== meIndex)
            .map(({ p, i }) => ({
              name:       p.name,
              legsWon:    allCompletedLegs[i].value.length,
              totalDarts: computeStatsForPlayer(i)?.totalDarts ?? null,
            }))
        : [],
    },
  })
})
</script>

<template>
  <div class="tactics">

    <AppHeader title="Tactics" back-icon="exit" @back="router.push({ name: 'tactics-settings' })">
      <template v-if="phase !== 'game-over'" #right>
        <button class="tactics__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <!-- ── Jeu ──────────────────────────────────────────────────────────────── -->
    <div v-if="phase === 'playing'" class="tactics__game">

      <div class="tactics__game-left">
        <TacticsBoard :players="boardPlayers" />
      </div>

      <div class="tactics__game-main">
        <DartSlotsHeader :tour-number="volleyNumber">
          <template v-if="isMulti" #right>
            <span class="tactics__turn-label">{{ activePlayerName }} !</span>
          </template>
        </DartSlotsHeader>

        <WarmupInput
          v-if="inputConfig"
          :darts="currentDarts"
          :zones="inputConfig.zones"
          :only-type="inputConfig.onlyType"
          :label-override="inputConfig.labelOverride"
          :locked="isLocked"
          @dart="addDart"
          @miss="addMiss"
          @undo="undo"
        />
      </div>
    </div>

    <!-- ── Récap de manche ──────────────────────────────────────────────────── -->
    <TacticsLegRecap
      :show="showLegRecap"
      :winner-name="recapWinnerName"
      :total-darts="recapLeg?.totalDarts ?? 0"
      :volleys="recapLeg?.volleys ?? []"
      @next="startNextLeg"
    />

    <!-- ── Modales ──────────────────────────────────────────────────────────── -->
    <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
    <TacticsZoneChoiceModal
      :show="!!pendingZoneChoice"
      v-bind="zoneChoiceProps"
      @choose="resolveZoneChoice"
    />

    <!-- ── Résultats finaux ────────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="tactics__overlay">

        <!-- Multi-joueurs -->
        <div v-if="isMulti" class="tactics__multi-result">
          <div class="tactics__multi-winner">
            <div class="tactics__multi-trophy">🏆</div>
            <div class="tactics__multi-winner-name">{{ multiWinnerName }}</div>
            <div class="tactics__multi-winner-sub">a fermé le plateau le premier !</div>
          </div>
          <div class="tactics__multi-scores">
            <div v-for="(p, i) in players" :key="i" class="tactics__multi-score-row"
                 :class="{ 'tactics__multi-score-row--winner': i === multiWinnerIndex }">
              <div class="tactics__multi-avatar">{{ p.name?.[0]?.toUpperCase() }}</div>
              <span class="tactics__multi-player-name">{{ p.name }}</span>
              <span class="tactics__multi-legs">{{ allCompletedLegs[i].value.length }} / {{ settings.legsToWin }}</span>
            </div>
          </div>
          <div class="tactics__multi-actions">
            <button class="tactics__multi-btn" @click="router.push({ name: 'tactics-settings' })">Rejouer</button>
            <button class="tactics__multi-btn tactics__multi-btn--ghost" @click="router.push({ name: 'home' })">Accueil</button>
          </div>
        </div>

        <!-- Solo -->
        <div v-else class="tactics__solo-result">
          <div class="tactics__solo-trophy">🎯</div>
          <div class="tactics__solo-title">Plateau fermé !</div>
          <div class="tactics__solo-stats">
            <div class="tactics__solo-stat">
              <span class="tactics__solo-stat-val">{{ stats?.totalDarts ?? '–' }}</span>
              <span class="tactics__solo-stat-lbl">fléchettes</span>
            </div>
          </div>
          <div class="tactics__multi-actions">
            <button class="tactics__multi-btn" @click="router.push({ name: 'tactics-settings' })">Rejouer</button>
            <button class="tactics__multi-btn tactics__multi-btn--ghost" @click="router.push({ name: 'home' })">Accueil</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.tactics {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;

  &__menu-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__game-left {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    min-height: 0;
    overflow-y: auto;
  }

  &__game-main {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    flex: 1;
  }

  &__turn-label {
    @include title-sm;
    font-weight: 700;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    padding: $padding-md;
  }

  &__multi-result,
  &__solo-result {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xl;
  }

  &__multi-winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
  }

  &__multi-trophy,
  &__solo-trophy {
    font-size: 64px;
    line-height: 1;
  }

  &__multi-winner-name,
  &__solo-title {
    @include title-xxl;
    font-weight: 700;
    color: $orange;
  }

  &__multi-winner-sub {
    @include text-md;
    color: $muted;
  }

  &__multi-scores {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    width: 100%;
    max-width: 320px;
  }

  &__multi-score-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);

    &--winner {
      background: rgba($orange, 0.15);
      border: $border-sm solid rgba($orange, 0.4);
    }
  }

  &__multi-avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;
  }

  &__multi-player-name {
    flex: 1;
    @include text-sm;
    font-weight: 600;
    color: $text-color;
  }

  &__multi-legs {
    @include title-md;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__solo-stats {
    display: flex;
    gap: $gap-xl;
    justify-content: center;
  }

  &__solo-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__solo-stat-val {
    @include display-md;
    font-weight: 700;
    color: $white;
  }

  &__solo-stat-lbl {
    @include title-sm;
    color: $muted;
  }

  &__multi-actions {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    width: 100%;
    max-width: 320px;
  }

  &__multi-btn {
    @include title-md;
    font-weight: 700;
    color: $white;
    background: $orange;
    border-radius: $radius-md;
    padding: $padding-md;
    text-align: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }

    &--ghost {
      background: rgba($white, 0.08);
      color: $muted;
    }
  }
}

@media (min-width: $bp-tablet) {
  .tactics__game {
    flex-direction: row;
    align-items: stretch;
    gap: $gap-lg;
  }

  .tactics__game-left,
  .tactics__game-main {
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .tactics {
    padding: $padding-xl;
  }

  .tactics__game       { gap: $gap-xl; }
  .tactics__turn-label { @include title-md; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
