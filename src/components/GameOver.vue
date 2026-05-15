<script setup>
defineProps({
  correctCount: { type: Number, required: true },
  maxQuestions: { type: Number, required: true },
  best:         { type: Number, required: true },
})

defineEmits(['replay', 'home'])
</script>

<template>
  <div class="game-over">
    <div class="game-over__result">
      <div class="game-over__score">{{ correctCount }}<span>/{{ maxQuestions }}</span></div>
      <div class="game-over__label">bonnes réponses</div>
    </div>

    <div class="game-over__stat">Meilleure série <strong>{{ best }}</strong></div>

    <div class="game-over__actions">
      <button class="game-over__btn game-over__btn--primary" @click="$emit('replay')">
        Rejouer
      </button>
      <button class="game-over__btn game-over__btn--secondary" @click="$emit('home')">
        Accueil
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-over {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;

  &__result { text-align: center; }

  &__score {
    font-family: $font-display;
    font-size: 80px;
    line-height: 1;
    color: $orange;
    font-variant-numeric: tabular-nums;

    span {
      font-size: 40px;
      color: $muted;
    }
  }

  &__label {
    font-size: 14px;
    color: $muted;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__stat {
    font-size: 14px;
    color: $muted;
    strong { color: $text; font-weight: 700; }
  }

  &__actions {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  &__btn {
    flex: 1;
    border-radius: $radius-pill;
    font-size: 16px;
    font-weight: 700;
    padding: 14px;
    transition: transform 0.1s, opacity 0.15s;

    &:active { transform: scale(0.97); opacity: 0.85; }

    &--primary  { background: $orange; color: #fff; }
    &--secondary { background: $surface; border: 1px solid $border; color: $muted; }
  }
}
</style>
