<script setup>
defineProps({
  state:         { type: String,  default: null },  // 'correct' | 'wrong' | null
  newScore:      { type: Number,  required: true },
  correctAnswer: { type: Number,  required: true },
})
</script>

<template>
  <Transition name="slide">
    <div v-if="state" class="feedback" :class="`feedback--${state}`">
      <template v-if="state === 'correct'">
        Correct ! +{{ correctAnswer }} → {{ newScore }}
      </template>
      <template v-else>
        Raté !
        <div class="feedback__sub">
          La bonne réponse était <strong>{{ correctAnswer }}</strong>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.feedback {
  border-radius: $radius-md;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;

  &--correct {
    background: rgba($accent, 0.15);
    border: 1px solid rgba($accent, 0.35);
    color: $accent-light;
  }

  &--wrong {
    background: rgba($red, 0.15);
    border: 1px solid rgba($red, 0.35);
    color: $red-light;
  }

  &__sub {
    font-weight: 400;
    font-size: 13px;
    margin-top: 4px;
    opacity: 0.85;
  }
}
</style>
