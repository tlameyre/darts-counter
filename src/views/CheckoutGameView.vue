<script setup>
import { watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import CheckoutFlashcard from '../components/checkout/CheckoutFlashcard.vue'
import CheckoutQuizInput from '../components/checkout/CheckoutQuizInput.vue'
import CheckoutRecap from '../components/checkout/CheckoutRecap.vue'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useCheckoutTrainer } from '../composables/useCheckoutTrainer.js'

const router = useRouter()
const gameStore = useGameStore()
const dbStore = useDbStore()

if (!gameStore.gameSettings || gameStore.gameSettings.mode !== 'checkout') {
  router.replace({ name: 'checkout-settings' })
}

const settings = gameStore.gameSettings ?? {
  variant: 'review',
  brackets: [[2, 170]],
  order: 'asc',
  count: 10,
}

const {
  isQuiz, currentScore, currentCheckout, gameOver, progress,
  revealed, toggleReveal, grade, reviewDone, reviewTotal,
  attemptDarts, answered, pushDart, undoDart, submit, lastResult, sessionStats,
  next, endSession, cleanup,
} = useCheckoutTrainer(settings)

watch(gameOver, async (over) => {
  if (over && isQuiz) {
    const s = sessionStats.value
    await dbStore.saveCheckoutSession({
      questions: s.questions,
      correctCount: s.correct,
      optimalCount: s.optimal,
      bestStreak: s.bestStreak,
      points: s.points,
      settings: { brackets: settings.brackets, order: settings.order },
    })
  }
})

function backToSettings() {
  router.push({ name: 'checkout-settings' })
}

onUnmounted(() => cleanup())
</script>

<template>
  <div class="co-game">
    <AppHeader :title="gameOver ? 'TERMINÉ' : 'CHECKOUTS'" back-icon="exit" @back="backToSettings">
      <template v-if="!gameOver" #right>
        <button class="co-game__end-btn" @click="endSession">
          <AppIcon name="check" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <CheckoutRecap
      v-if="gameOver"
      :variant="isQuiz ? 'quiz' : 'review'"
      :session-stats="sessionStats"
      :reviewed-count="reviewDone"
      @restart="backToSettings"
      @home="router.push({ name: 'home' })"
    />

    <CheckoutQuizInput
      v-else-if="isQuiz"
      :score="currentScore"
      :checkout="currentCheckout"
      :attempt-darts="attemptDarts"
      :answered="answered"
      :last-result="lastResult"
      :progress="progress"
      @dart="pushDart"
      @undo="undoDart"
      @submit="submit"
      @next="next"
    />

    <CheckoutFlashcard
      v-else
      :score="currentScore"
      :checkout="currentCheckout"
      :revealed="revealed"
      :done="reviewDone"
      :total="reviewTotal"
      @toggle="toggleReveal"
      @grade="grade"
    />
  </div>
</template>

<style lang="scss" scoped>
.co-game {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;

  &__end-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }
}

@media (min-width: $bp-laptop) {
  .co-game { padding: $padding-xl; }
}
</style>
