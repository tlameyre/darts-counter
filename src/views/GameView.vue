<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useDarts } from '../composables/useDarts.js'

import AppHeader    from '../components/AppHeader.vue'
import VoleeDisplay from '../components/VoleeDisplay.vue'
import AnswerInput  from '../components/AnswerInput.vue'
import NumPad       from '../components/NumPad.vue'
import TimerBar     from '../components/TimerBar.vue'
import GameOver     from '../components/GameOver.vue'

const props = defineProps({
  settings: { type: Object, required: true },
})

const emit = defineEmits(['home', 'replay'])

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  questionIndex, correctCount, gameOver, timeLeft,
  correctAnswer, questionLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(props.settings)

const newScore = computed(() => currentScore.value + correctAnswer.value)

const feedbackLabel = computed(() => {
  if (feedbackState.value === 'correct') return 'Correct !'
  if (feedbackState.value === 'timeout') return 'Temps écoulé !'
  return 'Raté !'
})

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
      <!-- Game over -->
      <GameOver
        v-if="gameOver"
        :correct-count="correctCount"
        :max-questions="settings.maxQuestions"
        :best="best"
        @replay="emit('replay')"
        @home="emit('home')"
      />

      <template v-else>
        <!-- Timer -->
        <TimerBar
          v-if="settings.timeLimit"
          :time-left="timeLeft"
          :time-limit="settings.timeLimit"
        />

        <!-- Score + Volée -->
        <div class="round-card">
          <div class="round-card__score-section">
            <div class="round-card__label">Score actuel</div>
            <div class="round-card__score">{{ currentScore }}</div>
          </div>

          <div class="round-card__divider" />

          <div class="round-card__volee-section">
            <div class="round-card__label">Volée</div>
            <VoleeDisplay :volee="currentVolee" />
          </div>

          <!-- Feedback overlay -->
          <Transition name="fade">
            <div
              v-if="feedbackState"
              class="round-card__overlay"
              :class="`round-card__overlay--${feedbackState}`"
            >
              <div class="round-card__overlay-title">{{ feedbackLabel }}</div>
              <div v-if="feedbackState === 'correct'" class="round-card__overlay-sub">
                +{{ correctAnswer }} &rarr; {{ newScore }}
              </div>
              <div v-else class="round-card__overlay-sub">
                La bonne réponse était <strong>{{ correctAnswer }}</strong>
              </div>
            </div>
          </Transition>
        </div>

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
    padding: 14px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__counter {
    font-size: 13px;
    font-weight: 600;
    color: $muted;
    font-variant-numeric: tabular-nums;
  }
}

.round-card {
  flex: 1;
  min-height: 0;
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  position: relative;
  overflow: hidden;

  &__score-section {
    text-align: center;
  }

  &__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $muted;
    margin-bottom: 4px;
  }

  &__score {
    font-size: 56px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__divider {
    height: 1px;
    background: $border;
    margin: 0 -16px;
  }

  &__volee-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  // Feedback overlay
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: $radius-lg;

    &--correct {
      background: rgba($accent, 0.92);
      color: #fff;
    }

    &--wrong, &--timeout {
      background: rgba($red, 0.92);
      color: #fff;
    }
  }

  &__overlay-title {
    font-size: 28px;
    font-weight: 800;
  }

  &__overlay-sub {
    font-size: 16px;
    opacity: 0.9;
    font-weight: 500;

    strong { font-weight: 800; }
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
