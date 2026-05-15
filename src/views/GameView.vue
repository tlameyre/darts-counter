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
  correctCount, gameOver, timeLeft,
  correctAnswer, questionLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(props.settings)

// En 501, on descend son score
const newScore = computed(() => currentScore.value - correctAnswer.value)

const feedbackLabel = computed(() => {
  if (feedbackState.value === 'correct') return 'CORRECT'
  if (feedbackState.value === 'timeout') return 'TEMPS !'
  return 'RATÉ'
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
    <AppHeader
      :streak="streak"
      :question-label="questionLabel"
      :max-questions="settings.maxQuestions"
    />

    <main class="game__main">
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

        <!-- Carte score + volée -->
        <div class="round-card">
          <div class="round-card__top">
            <div class="round-card__score-label">Score</div>
            <div class="round-card__score">{{ currentScore }}</div>
          </div>

          <div class="round-card__divider" />

          <div class="round-card__bottom">
            <div class="round-card__volee-label">Volée</div>
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
                &minus;{{ correctAnswer }} &rarr; {{ newScore }}
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
    padding: 8px 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

// Carte orange inspirée de la DA
.round-card {
  flex: 1;
  min-height: 0;
  background: $orange;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  position: relative;
  overflow: hidden;

  &__top {
    padding: 14px 18px 10px;
    text-align: center;
  }

  &__score-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.55);
    margin-bottom: 2px;
  }

  &__score {
    font-family: $font-display;
    font-size: 72px;
    line-height: 1;
    color: #fff;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
  }

  &__divider {
    height: 1px;
    background: rgba(255,255,255,0.2);
    margin: 0 18px;
  }

  &__bottom {
    padding: 10px 14px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__volee-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.55);
  }

  // Overlay feedback
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: $radius-lg;

    &--correct { background: rgba(22, 163, 74, 0.95); }
    &--wrong, &--timeout { background: rgba(185, 28, 28, 0.95); }
  }

  &__overlay-title {
    font-family: $font-display;
    font-size: 48px;
    color: #fff;
    letter-spacing: 2px;
  }

  &__overlay-sub {
    font-size: 16px;
    color: rgba(255,255,255,0.9);
    font-weight: 600;

    strong { font-weight: 800; color: #fff; }
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
