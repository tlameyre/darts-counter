<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDarts } from '../composables/useDarts.js'
import { gameSettings } from '../store/gameStore.js'

import AppHeader    from '../components/AppHeader.vue'
import AnswerInput  from '../components/AnswerInput.vue'
import NumPad       from '../components/NumPad.vue'
import GameOver     from '../components/GameOver.vue'
import GameTourRow  from '../components/game/GameTourRow.vue'
import GameRoundCard from '../components/game/GameRoundCard.vue'

const route  = useRoute()
const router = useRouter()

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  correctCount, gameOver, timeLeft,
  phase, voleeTotal,
  correctAnswer, questionLabel, phaseLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(gameSettings.value)

function onKeydown(e) {
  if (e.key >= '0' && e.key <= '9') appendDigit(e.key)
  else if (e.key === 'Backspace') deleteDigit()
  else if (e.key === 'Enter') validate()
}

onMounted(() => {
  nextRound()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  cleanup()
})
</script>

<template>
  <div class="game">
    <AppHeader
      title="ENTRAINEMENT"
      @back="router.push({ name: 'score-settings' })"
    />

    <main class="game__main">
      <GameOver
        v-if="gameOver"
        :correct-count="correctCount"
        :max-questions="settings.maxQuestions ?? questionLabel"
        :best="best"
        @replay="router.push({ name: 'score-game', query: { t: Date.now() } })"
        @home="router.push({ name: 'lobby' })"
      />

      <template v-else>
        <GameTourRow
          :question-label="questionLabel"
          :phase="phase"
          :show-phase="gameSettings.doubleValidation"
          :time-left="timeLeft"
          :show-timer="!!gameSettings.timeLimit"
          :is-urgent="timeLeft <= 5"
        />

        <GameRoundCard
          :phase="phase"
          :current-score="currentScore"
          :current-volee="currentVolee"
          :volee-total="voleeTotal"
          :feedback-state="feedbackState"
          :correct-answer="correctAnswer"
        />

        <AnswerInput
          :value="inputValue"
          :placeholder="phaseLabel"
          :has-error="feedbackState === 'wrong' || feedbackState === 'timeout'"
          @validate="validate"
        />

        <NumPad
          @digit="appendDigit"
          @delete="deleteDigit"
          @validate="validate"
        />
      </template>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.game {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__main {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: 420px;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
