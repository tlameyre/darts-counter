<script setup>
import { computed } from 'vue'
import VoleeDisplay from '../VoleeDisplay.vue'

const props = defineProps({
  phase:         Number,
  currentScore:  Number,
  currentVolee:  Array,
  voleeTotal:    Number,
  feedbackState: { type: String, default: null },
  correctAnswer: Number,
})

const overlayLabel = computed(() => {
  if (props.feedbackState === 'phase1ok') return 'CORRECT !'
  if (props.feedbackState === 'correct')  return 'CORRECT !'
  if (props.feedbackState === 'timeout')  return 'TEMPS ÉCOULÉ !'
  return 'RATÉ !'
})

const overlayClass = computed(() => {
  if (props.feedbackState === 'correct' || props.feedbackState === 'phase1ok') return 'round-card__overlay--correct'
  return 'round-card__overlay--wrong'
})
</script>

<template>
  <div class="round-card">
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

    <Transition name="fade">
      <div v-if="feedbackState && feedbackState !== 'phase1ok'" class="round-card__overlay" :class="overlayClass">
        <div class="round-card__overlay-title">{{ overlayLabel }}</div>
        <div v-if="feedbackState === 'wrong' || feedbackState === 'timeout'" class="round-card__overlay-sub">
          Réponse : <strong>{{ correctAnswer }}</strong>
        </div>
      </div>

      <div v-else-if="feedbackState === 'phase1ok'" class="round-card__overlay round-card__overlay--correct round-card__overlay--brief">
        <div class="round-card__overlay-title">{{ voleeTotal }}</div>
        <div class="round-card__overlay-sub">Maintenant le score restant</div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
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
