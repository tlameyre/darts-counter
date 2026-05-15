<script setup>
defineProps({
  value:    { type: String,  required: true },
  hasError: { type: Boolean, default: false },
})

defineEmits(['validate'])
</script>

<template>
  <div class="answer-input">
    <div class="answer-input__label">Total de la volée =</div>
    <div class="answer-input__row">
      <div
        class="answer-input__display"
        :class="{ 'answer-input__display--error': hasError }"
      >
        {{ value || '?' }}
      </div>
      <button class="answer-input__btn" @click="$emit('validate')">OK</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.answer-input {
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 20px;

  &__label {
    font-size: 13px;
    color: $muted;
    margin-bottom: 12px;
    text-align: center;
  }

  &__row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__display {
    flex: 1;
    background: $bg;
    border: 2px solid $border;
    border-radius: $radius-md;
    color: $text;
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    padding: 14px 12px;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.2s;

    &--error { border-color: $red; }
  }

  &__btn {
    background: $accent;
    border-radius: $radius-md;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    padding: 14px 22px;
    transition: background 0.15s, transform 0.1s;

    &:active {
      transform: scale(0.96);
      background: $accent-dark;
    }
  }
}
</style>
