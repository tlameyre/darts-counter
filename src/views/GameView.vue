<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useDarts } from '../composables/useDarts.js'

import AppHeader       from '../components/AppHeader.vue'
import ScoreDisplay    from '../components/ScoreDisplay.vue'
import VoleeDisplay    from '../components/VoleeDisplay.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import AnswerInput     from '../components/AnswerInput.vue'
import NumPad          from '../components/NumPad.vue'
import TimerBar        from '../components/TimerBar.vue'
import GameOver        from '../components/GameOver.vue'

const props = defineProps({
  settings: { type: Object, required: true },
  // { difficulty, maxQuestions, timeLimit }
})

const emit = defineEmits(['home'])

const {
  currentScore, currentVolee, inputValue,
  feedbackState, answered, streak, best,
  questionIndex, correctCount, gameOver, timeLeft,
  correctAnswer, timerProgress, questionLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(props.settings)

const newScore = computed(() => currentScore.value + correctAnswer.value)

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
    <AppHeader :streak="streak" :best="best">
      <template #center>
        <span class="game__counter">{{ questionLabel }}</span>
      </template>
    </AppHeader>

    <main class="game__main">
      <!-- Timer -->
      <TimerBar
        v-if="settings.timeLimit && !gameOver"
        :time-left="timeLeft"
        :time-limit="settings.timeLimit"
      />

      <!-- Game over -->
      <GameOver
        v-if="gameOver"
        :correct-count="correctCount"
        :max-questions="settings.maxQuestions"
        :best="best"
        @replay="emit('replay')"
        @home="emit('home')"
      />

      <!-- Game -->
      <template v-else>
        <ScoreDisplay :score="currentScore" />
        <VoleeDisplay :volee="currentVolee" />

        <FeedbackMessage
          :state="feedbackState"
          :new-score="newScore"
          :correct-answer="correctAnswer"
        />

        <AnswerInput
          :value="inputValue"
          :has-error="feedbackState === 'wrong' || feedbackState === 'timeout'"
          @validate="validate"
        />

        <NumPad
          @digit="appendDigit"
          @delete="deleteDigit"
          @validate="validate"
        />

        <Transition name="slide">
          <button v-if="answered" class="btn-next" @click="nextRound">
            Suivant →
          </button>
        </Transition>
      </template>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;

  &__main {
    width: 100%;
    max-width: 420px;
    padding: 20px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__counter {
    font-size: 13px;
    font-weight: 600;
    color: $muted;
    font-variant-numeric: tabular-nums;
  }
}

.btn-next {
  background: $card;
  border: 1px solid $accent;
  border-radius: $radius-lg;
  color: $accent;
  font-size: 17px;
  font-weight: 700;
  padding: 16px;
  width: 100%;
  transition: background 0.15s, transform 0.1s;

  &:active { transform: scale(0.97); }
}
</style>
