<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useDarts } from '../composables/useDarts.js'

import AppHeader    from '../components/AppHeader.vue'
import VoleeDisplay from '../components/VoleeDisplay.vue'
import AnswerInput  from '../components/AnswerInput.vue'
import NumPad       from '../components/NumPad.vue'
import GameOver     from '../components/GameOver.vue'

const props = defineProps({
  settings: { type: Object, required: true },
})

const emit = defineEmits(['home', 'replay'])

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  correctCount, gameOver, timeLeft,
  phase, voleeTotal,
  correctAnswer, questionLabel, phaseLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(props.settings)

// En 501 on descend le score
const newScore = computed(() => currentScore.value - correctAnswer.value)

// Feedback overlay
const overlayLabel = computed(() => {
  if (feedbackState.value === 'phase1ok') return 'CORRECT !'
  if (feedbackState.value === 'correct')  return 'CORRECT !'
  if (feedbackState.value === 'timeout')  return 'TEMPS ÉCOULÉ !'
  return 'RATÉ !'
})

const overlayClass = computed(() => {
  if (feedbackState.value === 'correct' || feedbackState.value === 'phase1ok') return 'round-card__overlay--correct'
  return 'round-card__overlay--wrong'
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
    <AppHeader title="ENTRAINEMENT" @back="emit('home')" />

    <main class="game__main">
      <GameOver
        v-if="gameOver"
        :correct-count="correctCount"
        :max-questions="settings.maxQuestions ?? questionLabel"
        :best="best"
        @replay="emit('replay')"
        @home="emit('home')"
      />

      <template v-else>
        <!-- TOUR X + badge timer -->
        <div class="game__tour-row">
          <span class="game__tour-label">
            TOUR {{ questionLabel }}
          </span>
          <div v-if="settings.doubleValidation" class="game__phase-badge">
            Phase {{ phase }}/2
          </div>
          <div v-if="settings.timeLimit" class="game__timer-badge"
            :class="timeLeft <= 5 && 'game__timer-badge--urgent'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ timeLeft }}S
          </div>
        </div>
        <!-- Carte score + volée -->
        <div class="round-card">
          <!-- Phase 1 : score + volée -->
          <template v-if="phase === 1">
            <div class="round-card__top">
              <div class="round-card__label">Score</div>
              <div class="round-card__score">{{ currentScore }}</div>
            </div>
            <div class="round-card__divider" />
            <div class="round-card__bottom">
              <div class="round-card__label">Volée</div>
              <VoleeDisplay :volee="currentVolee" />
            </div>
          </template>

          <!-- Phase 2 : recap + score restant à trouver -->
          <template v-else>
            <div class="round-card__top round-card__top--phase2">
              <div class="round-card__label">Score de départ</div>
              <div class="round-card__score">{{ currentScore }}</div>
            </div>
            <div class="round-card__divider" />
            <div class="round-card__bottom">
              <div class="round-card__label">Volée marquée</div>
              <div class="round-card__volee-total">{{ voleeTotal }}</div>
              <div class="round-card__label round-card__label--question">Score restant ?</div>
            </div>
          </template>

          <!-- Overlay feedback -->
          <Transition name="fade">
            <div v-if="feedbackState && feedbackState !== 'phase1ok'" class="round-card__overlay" :class="overlayClass">
              <div class="round-card__overlay-title">{{ overlayLabel }}</div>
              <div v-if="feedbackState === 'wrong' || feedbackState === 'timeout'" class="round-card__overlay-sub">
                Réponse : <strong>{{ correctAnswer }}</strong>
              </div>
            </div>

            <!-- Phase 1 ok rapide (avant phase 2) -->
            <div v-else-if="feedbackState === 'phase1ok'" class="round-card__overlay round-card__overlay--correct round-card__overlay--brief">
              <div class="round-card__overlay-title">{{ voleeTotal }}</div>
              <div class="round-card__overlay-sub">Maintenant le score restant</div>
            </div>
          </Transition>
        </div>

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

  // Ligne TOUR X + badge timer
  &__tour-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__tour-label {
    font-family: $font-display;
    font-size: $title-sm;
    color: $orange;
    letter-spacing: 1px;
  }

  &__timer-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    padding: $padding-xxs $padding-sm;
    font-size: $text-sm;
    font-weight: 700;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    transition: background 0.3s, border-color 0.3s;

    &--urgent {
      background: rgba($error, 0.2);
      border-color: rgba($error, 0.5);
      color: $error-light;
    }
  }

  &__phase-badge {
    background: rgba($accent, 0.15);
    border: 1px solid rgba($accent, 0.3);
    border-radius: $radius-pill;
    padding: $padding-xxs $padding-sm;
    font-size: $text-sm;
    font-weight: 700;
    color: $accent-light;
  }
}

// Carte orange
.round-card {
  min-height: 0;
  background: $orange;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  position: relative;
  overflow: hidden;

  &__top {
    padding: $padding-sm $padding-lg $padding-xs;
    text-align: center;

    &--phase2 .round-card__score { font-size: $title-xl; }
  }

  &__label {
    font-size: $text-xs;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: $white;
    margin-bottom: 2px;

    &--question {
      font-size: $text-md;
      letter-spacing: 0.5px;
      color: $white;
      font-weight: 700;
      margin-top: 6px;
      text-transform: none;
    }
  }

  &__score {
    font-family: $font-display;
    font-size: $title-xxl;
    line-height: 1;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__volee-total {
    font-family: $font-display;
    font-size: $title-lg;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__divider {
    height: 1px;
    background: $muted;
    margin: 0 $padding-lg;
  }

  &__bottom {
    padding: $padding-xs $padding-sm $padding-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  // Overlay
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: $radius-lg;

    &--correct { background: $accent-dark; }
    &--wrong   { background: $error-dark; }
    &--brief   { background: $accent-dark; }
  }

  &__overlay-title {
    font-family: $font-display;
    font-size: $title-lg;
    color: $white;
    letter-spacing: 2px;
  }

  &__overlay-sub {
    font-size: $text-md;
    color: $white;
    font-weight: 600;
    strong { font-weight: 800; color: $white; }
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
