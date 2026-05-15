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
    <div class="game-over__score-wrap">
      <div class="game-over__score">{{ correctCount }}<span>/{{ maxQuestions }}</span></div>
      <div class="game-over__label">bonnes réponses</div>
    </div>

    <div class="game-over__stat">
      Meilleure série : <strong>{{ best }}</strong>
    </div>

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 20px;
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;

  &__score-wrap {
    text-align: center;
  }

  &__score {
    font-size: 72px;
    font-weight: 800;
    line-height: 1;
    color: $accent;
    font-variant-numeric: tabular-nums;

    span {
      font-size: 36px;
      color: $muted;
      font-weight: 600;
    }
  }

  &__label {
    font-size: 14px;
    color: $muted;
    margin-top: 6px;
  }

  &__stat {
    font-size: 14px;
    color: $muted;

    strong { color: $text; }
  }

  &__actions {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  &__btn {
    flex: 1;
    border-radius: $radius-md;
    font-size: 16px;
    font-weight: 700;
    padding: 14px;
    transition: transform 0.1s, background 0.15s;

    &:active { transform: scale(0.97); }

    &--primary {
      background: $accent;
      color: #fff;
      &:active { background: $accent-dark; }
    }

    &--secondary {
      background: $bg;
      border: 1px solid $border;
      color: $muted;
    }
  }
}
</style>
