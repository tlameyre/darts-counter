<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useX01 } from '../composables/useX01.js'
import { useX01AIOpponent } from '../composables/useX01AIOpponent.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01LegRecap from '../components/x01/X01LegRecap.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import X01PlayerSplitCard from '../components/x01/X01PlayerSplitCard.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

const router          = useRouter()
const gameStore       = useGameStore()
const authStore       = useAuthStore()
const dbStore         = useDbStore()
const badgeStore      = useBadgeStore()
const tournamentStore = useTournamentStore()

const newBadges  = ref([])

if (!gameStore.gameSettings) router.replace({ name: 'x01-settings' })

const settings  = gameStore.gameSettings ?? { startScore: 501, legsToWin: 2, players: null }
const aiProfile = settings.aiProfile ?? null
const players   = settings.players ?? null   // null = legacy solo/vs-AI mode
const isMulti   = players && players.length > 1 && !aiProfile

const tournamentContext  = settings.tournamentContext ?? null
const isTournamentMatch  = !!tournamentContext

const {
  completedLegs,
  volleys,
  currentDarts,
  phase,
  legRemaining,
  volleyNumber,
  volleyCompleting,
  pendingDoublesPrompt,
  pendingCheckout,
  addDart,
  addMiss,
  undo,
  confirmVolleyTotal,
  bustVolley,
  confirmDoublesAttempted,
  confirmCheckout,
  startNextLeg,
  addLostLegVolleys,
  stats,
  liveAvgVolley,
  // Multi-player extras
  currentPlayerIndex,
  legStarterIndex,
  playerCount,
  meIndex,
  allCompletedLegs,
  allVolleys,
  lastLegWinnerIndex,
  computeStatsForPlayer,
} = useX01(settings)

const {
  aiRemaining,
  aiLegsWon,
  aiLastVolley,
  aiTurn,
  aiWonLeg,
  aiWonGame,
  aiVolleysScores,
  aiLegHumanSnapshot,
  aiCardData,
  handleAILegContinue,
} = useX01AIOpponent({
  aiProfile,
  settings,
  volleys,
  phase,
  legRemaining,
  pendingDoublesPrompt,
  pendingCheckout,
  startNextLeg,
})

const AI_VOLLEY_BUCKETS = ['180', '160', '140', '120', '100', '80', '60', '40']

const aiStats = computed(() => {
  if (!aiProfile || !aiVolleysScores.value.length) return null
  const scores = aiVolleysScores.value
  const dist = Object.fromEntries(AI_VOLLEY_BUCKETS.map(k => [k, 0]))
  for (const s of scores) {
    if (s >= 180)      dist['180']++
    else if (s >= 160) dist['160']++
    else if (s >= 140) dist['140']++
    else if (s >= 120) dist['120']++
    else if (s >= 100) dist['100']++
    else if (s >= 80)  dist['80']++
    else if (s >= 60)  dist['60']++
    else if (s >= 40)  dist['40']++
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return {
    avgVolley:          parseFloat(avg.toFixed(2)),
    highestVolley:      Math.max(...scores),
    doublesHit:         aiLegsWon.value,
    volleyDistribution: dist,
  }
})

const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value)
const showMenu = ref(false)

function finishGame() {
  showMenu.value = false
  phase.value    = 'game-over'
}

function quitGame() {
  showMenu.value = false
  router.push({ name: 'x01-settings' })
}

watch(aiWonLeg, (val) => {
  if (val && aiLegHumanSnapshot.value?.volleys?.length) {
    addLostLegVolleys(aiLegHumanSnapshot.value.volleys)
  }
})

// ── Lancers spéciaux en temps réel (utilisateur connecté = meIndex) ────────
watch(() => allVolleys[meIndex].value.length, async (newLen, oldLen) => {
  if (newLen <= oldLen) return
  const v = allVolleys[meIndex].value[newLen - 1]
  if (v.bust) return
  const isTotal = v.darts.length === 1 && v.darts[0].type === 'volley'
  const special = await badgeStore.checkSpecialThrow(
    isTotal ? [] : v.darts,
    isTotal ? v.score : null,
  )
  if (special.length) newBadges.value = [...newBadges.value, ...special]
})

// ── Sauvegarde en fin de partie ────────────────────────────────────────────
watch(phase, async (val) => {
  if (val !== 'game-over' || !stats.value) return

  const humanLegsWon = allCompletedLegs[meIndex].value.length

  if (isMulti) {
    // Multi-player: save session for logged-in user with opponents data
    const opponents = players
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => i !== meIndex)
      .map(({ p, i }) => ({
        name:      p.name,
        legsWon:   allCompletedLegs[i].value.length,
        avgVolley: computeStatsForPlayer(i)?.avgVolley ?? null,
        isFriend:  !!p.isFriend,
        friendId:  p.isFriend ? p.id : null,
      }))
    await dbStore.saveX01Session({
      startScore: settings.startScore,
      legsPlayed: Math.max(...allCompletedLegs.map(r => r.value.length)),
      stats:      stats.value,
      settings: {
        ...settings,
        humanName:    authStore.profile?.username ?? null,
        humanLegsWon,
        opponents,
      },
      tournamentId:      tournamentContext?.tournamentId ?? null,
      tournamentMatchId: tournamentContext?.matchId ?? null,
    })

    if (isTournamentMatch && multiWinnerIndex.value != null) {
      const winnerParticipantId = players[multiWinnerIndex.value]?.participantId
      if (winnerParticipantId) {
        await tournamentStore.recordMatchResult({
          matchId:             tournamentContext.matchId,
          winnerParticipantId,
        })
      }
    }
  } else {
    // Solo or vs AI (existing behavior)
    const humanLegsWonAdj = Math.max(0, completedLegs.value.length - (aiProfile ? aiLegsWon.value : 0))
    await dbStore.saveX01Session({
      startScore: settings.startScore,
      legsPlayed: completedLegs.value.length,
      stats:      stats.value,
      settings: {
        ...settings,
        humanName:    authStore.profile?.username ?? null,
        humanLegsWon: humanLegsWonAdj,
        ...(aiProfile ? {
          aiLegsWon:   aiLegsWon.value,
          aiAvgVolley: aiCardData.value.avgVolley,
        } : {}),
      },
    })
  }

  const profileStats  = await dbStore.fetchProfileStats()
  const volumeBadges  = await badgeStore.checkX01Badges(profileStats)
  if (volumeBadges.length) newBadges.value = [...newBadges.value, ...volumeBadges]
})

// ── Données carte joueurs ──────────────────────────────────────────────────
const lastHumanDarts = computed(() => {
  const last = volleys.value[volleys.value.length - 1]
  return last ? last.darts : []
})

const humanTotalDarts = computed(() =>
  volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
  + (isBust.value ? 0 : currentDarts.value.length)
)

const humanLastScore = computed(() => {
  const valid = volleys.value.filter(v => !v.bust)
  return valid.length ? valid[valid.length - 1].score : null
})

// Build player cards for X01PlayerSplitCard
const playerCards = computed(() => {
  const cards = []

  if (isMulti) {
    // Multi-player human cards
    for (let i = 0; i < playerCount; i++) {
      const p         = players[i]
      const pVolleys  = allCompletedLegs[i]  // use the allCompletedLegs ref
      const isCurrent = i === currentPlayerIndex.value

      // For current player: use live data; for others: use stored state
      if (isCurrent) {
        cards.push({
          name:       p.name,
          remaining:  legRemaining.value,
          legsWon:    allCompletedLegs[i].value.length,
          legsToWin:  settings.legsToWin,
          lastDarts:  lastHumanDarts.value,
          avgVolley:  liveAvgVolley.value,
          lastScore:  humanLastScore.value,
          totalDarts: humanTotalDarts.value,
          isLegStarter: i === legStarterIndex.value,
        })
      } else {
        const pVols       = allVolleys[i].value
        const pRemaining  = pVols.filter(v => !v.bust).reduce((acc, v) => acc - v.score, settings.startScore)
        const pLastVolley = pVols.filter(v => !v.bust).slice(-1)[0] ?? null
        cards.push({
          name:       p.name,
          remaining:  pRemaining,
          legsWon:    allCompletedLegs[i].value.length,
          legsToWin:  settings.legsToWin,
          lastDarts:  pLastVolley ? pLastVolley.darts : [],
          avgVolley:  computeStatsForPlayer(i)?.avgVolley ?? '–',
          lastScore:  pLastVolley?.score ?? null,
          totalDarts: pVols.reduce((sum, v) => sum + v.darts.length, 0),
          isLegStarter: i === legStarterIndex.value,
        })
      }
    }
  } else {
    // Single player card (original behavior)
    cards.push({
      name:       authStore.profile?.username ?? 'Toi',
      remaining:  legRemaining.value,
      legsWon:    completedLegs.value.length,
      legsToWin:  settings.legsToWin,
      lastDarts:  lastHumanDarts.value,
      avgVolley:  liveAvgVolley.value,
      lastScore:  humanLastScore.value,
      totalDarts: humanTotalDarts.value,
    })

    // AI card
    if (aiProfile && aiCardData.value) {
      cards.push({ ...aiCardData.value, isAI: true })
    }
  }

  return cards
})

const activeCardIndex = computed(() => {
  if (isMulti) return currentPlayerIndex.value
  return aiTurn.value ? 1 : 0
})

// Active player name for turn label
const activePlayerName = computed(() => {
  if (isMulti) return players[currentPlayerIndex.value]?.name ?? 'Joueur'
  return aiTurn.value ? 'DartBot' : (authStore.profile?.username ?? 'Toi')
})

const currentVolleyDarts = computed(() =>
  isBust.value
    ? (volleys.value[volleys.value.length - 1]?.darts ?? [])
    : currentDarts.value
)

// ── Données récap de manche ────────────────────────────────────────────────
const showLegRecap = computed(() => phase.value === 'leg-recap' || aiWonLeg.value)
const legWinner    = computed(() => aiWonLeg.value ? 'ai' : 'human')
const lastLeg      = computed(() => completedLegs.value[completedLegs.value.length - 1])

const recapVolleys = computed(() =>
  legWinner.value === 'ai'
    ? (aiLegHumanSnapshot.value?.volleys ?? [])
    : (lastLeg.value?.volleys ?? [])
)

const recapTotalDarts = computed(() =>
  legWinner.value === 'ai'
    ? recapVolleys.value.reduce((sum, v) => sum + v.darts.length, 0)
    : (lastLeg.value?.totalDarts ?? 0)
)

// Multi-player leg recap: use tracked winner index from useX01
const multiLegWinner = computed(() => {
  if (!isMulti || lastLegWinnerIndex.value == null) return null
  const i    = lastLegWinnerIndex.value
  const legs = allCompletedLegs[i].value
  const last = legs[legs.length - 1] ?? null
  return last ? { playerIndex: i, name: players[i]?.name, leg: last } : null
})

function startNextLegWithAI() {
  aiRemaining.value = settings.startScore
  startNextLeg()
}

// Winner in multi-player
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
</script>

<template>
  <div class="x01">

    <AppHeader :title="String(settings.startScore)" back-icon="exit" @back="router.push({ name: 'x01-settings' })">
      <template v-if="phase !== 'game-over'" #right>
        <button class="x01__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <!-- ── Jeu ──────────────────────────────────────────────────────────────── -->
    <div v-if="phase === 'playing' || isBust" class="x01__game">

      <div class="x01__game-left">
        <X01PlayerSplitCard
          :players="playerCards"
          :active-index="activeCardIndex"
        />
      </div>

      <div class="x01__game-main">
        <DartSlotsHeader :tour-number="isBust ? volleyNumber - 1 : volleyNumber">
          <template #right>
            <span
              class="x01__turn-label"
              :class="{ 'x01__turn-label--ai': aiTurn && !isMulti }"
            >
              {{ aiTurn && !isMulti ? 'DartBot...' : `${activePlayerName} !` }}
            </span>
          </template>
        </DartSlotsHeader>
        <GameInput
          :darts="currentVolleyDarts"
          value-key="label"
          :bust="isBust"
          :locked="isLocked || (aiTurn && !isMulti)"
          toggleable
          @dart="addDart"
          @miss="addMiss"
          @bust="bustVolley"
          @validate="confirmVolleyTotal"
          @undo="undo"
        />
      </div>
    </div>

    <!-- ── Récap de manche (vs AI) ──────────────────────────────────────────── -->
    <X01LegRecap
      v-if="!isMulti"
      :show="showLegRecap"
      :leg-winner="legWinner"
      :has-a-i="!!aiProfile"
      :human-remaining="aiLegHumanSnapshot?.remaining ?? legRemaining"
      :ai-remaining="aiRemaining"
      :total-darts="recapTotalDarts"
      :checkout-score="lastLeg?.checkoutScore ?? null"
      :ai-darts-used="aiLastVolley?.dartsUsed ?? null"
      :volleys="recapVolleys"
      @next="legWinner === 'ai' ? handleAILegContinue() : startNextLegWithAI()"
    />

    <!-- ── Récap de manche (multi-player) ────────────────────────────────────── -->
    <X01LegRecap
      v-if="isMulti"
      :show="phase === 'leg-recap'"
      leg-winner="human"
      :winner-name="multiLegWinner?.name ?? null"
      :has-a-i="false"
      :human-remaining="0"
      :ai-remaining="0"
      :total-darts="multiLegWinner?.leg?.totalDarts ?? 0"
      :checkout-score="multiLegWinner?.leg?.checkoutScore ?? null"
      :ai-darts-used="null"
      :volleys="multiLegWinner?.leg?.volleys ?? []"
      @next="startNextLeg"
    />

    <!-- ── Modales ──────────────────────────────────────────────────────────── -->
    <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
    <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
    <X01DoublesModal :show="pendingDoublesPrompt" @confirm="confirmDoublesAttempted" />
    <X01CheckoutModal
      :show="!!pendingCheckout"
      :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0"
      @confirm="confirmCheckout"
    />

    <!-- ── Résultats finaux ────────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay">

        <!-- Multi-player result -->
        <div v-if="isMulti" class="x01__multi-result">
          <div class="x01__multi-winner">
            <div class="x01__multi-trophy">🏆</div>
            <div class="x01__multi-winner-name">{{ multiWinnerName }}</div>
            <div class="x01__multi-winner-sub">a gagné la partie !</div>
          </div>
          <div class="x01__multi-scores">
            <div v-for="(p, i) in players" :key="i" class="x01__multi-score-row"
                 :class="{ 'x01__multi-score-row--winner': i === multiWinnerIndex }">
              <div class="x01__multi-avatar">{{ p.name?.[0]?.toUpperCase() }}</div>
              <span class="x01__multi-player-name">{{ p.name }}</span>
              <span class="x01__multi-legs">{{ allCompletedLegs[i].value.length }} / {{ settings.legsToWin }}</span>
            </div>
          </div>
          <div class="x01__multi-actions">
            <button
              v-if="isTournamentMatch"
              class="x01__multi-btn"
              @click="router.push({ name: 'tournament-detail', params: { id: tournamentContext.tournamentId } })"
            >Retour au bracket</button>
            <button v-else class="x01__multi-btn" @click="router.push({ name: 'x01-settings' })">Rejouer</button>
            <button class="x01__multi-btn x01__multi-btn--ghost" @click="router.push({ name: 'home' })">Accueil</button>
          </div>
        </div>

        <!-- Solo / vs AI result -->
        <X01Result
          v-else
          :stats="stats"
          :legs-played="completedLegs.length"
          :start-score="settings.startScore"
          :ai-won="aiWonGame"
          :ai-legs-won="aiLegsWon"
          :ai-stats="aiStats"
          @replay="router.push({ name: 'x01-settings' })"
          @home="router.push({ name: 'home' })"
        />
      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.x01 {
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

    &--ai { color: $muted; }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    padding: $padding-md;
  }

  // ── Multi-player result screen ──────────────────────────────────────────
  &__multi-result {
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

  &__multi-trophy {
    font-size: 64px;
    line-height: 1;
  }

  &__multi-winner-name {
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
  .x01__game {
    flex-direction: row;
    align-items: stretch;
    gap: $gap-lg;
  }

  .x01__game-left,
  .x01__game-main {
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    padding: $padding-xl;
  }

  .x01__game      { gap: $gap-xl; }
  .x01__turn-label { @include title-md; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
