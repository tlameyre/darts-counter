<script setup>
defineProps({
  score: { type: Number, required: true },
})
</script>

<template>
  <div class="score-display">
    <div class="score-display__label">Score actuel</div>
    <div class="score-display__value">{{ score }}</div>
  </div>
</template>

<style lang="scss" scoped>
.score-display {
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 20px;
  text-align: center;

  &__label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $muted;
    margin-bottom: 8px;
  }

  &__value {
    font-size: 64px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}
</style>
