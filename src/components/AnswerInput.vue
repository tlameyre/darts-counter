<script setup>
defineProps({
  value:    { type: String,  required: true },
  hasError: { type: Boolean, default: false },
})

defineEmits(['validate'])
</script>

<template>
  <div class="answer-input" :class="{ 'answer-input--error': hasError }">
    <div class="answer-input__value">{{ value || '?' }}</div>
    <button class="answer-input__btn" @click="$emit('validate')">OK</button>
  </div>
</template>

<style lang="scss" scoped>
.answer-input {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 3px solid transparent;
  border-radius: $radius-pill;
  padding: 8px 8px 8px 24px;
  transition: border-color 0.2s;

  &--error { border-color: $red; }

  &__value {
    flex: 1;
    font-family: $font-display;
    font-size: 28px;
    color: #111;
    font-variant-numeric: tabular-nums;
    letter-spacing: 1px;
  }

  &__btn {
    background: $accent;
    border-radius: $radius-pill;
    color: #fff;
    font-family: $font-body;
    font-size: 15px;
    font-weight: 700;
    padding: 10px 26px;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}
</style>
