<script setup>
defineProps({
  value:       { type: String,  required: true },
  hasError:    { type: Boolean, default: false },
  placeholder: { type: String,  default: 'Entrer un score' },
})

defineEmits(['validate'])
</script>

<template>
  <div class="answer-input" :class="{ 'answer-input--error': hasError }">
    <!-- Icône clavier -->
    <div class="answer-input__icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
        <rect x="2" y="4" width="4" height="4" rx="1"/><rect x="10" y="4" width="4" height="4" rx="1"/><rect x="18" y="4" width="4" height="4" rx="1"/>
        <rect x="2" y="12" width="4" height="4" rx="1"/><rect x="10" y="12" width="4" height="4" rx="1"/><rect x="18" y="12" width="4" height="4" rx="1"/>
        <rect x="2" y="20" width="4" height="4" rx="1"/><rect x="10" y="20" width="4" height="4" rx="1"/><rect x="18" y="20" width="4" height="4" rx="1"/>
      </svg>
    </div>

    <div class="answer-input__value" :class="{ 'answer-input__value--placeholder': !value }">
      {{ value || placeholder }}
    </div>

    <button class="answer-input__btn" @click="$emit('validate')">
      OK
    </button>
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
  padding: 8px 8px 8px 16px;
  transition: border-color 0.2s;

  &--error { border-color: $red; }

  &__icon {
    flex-shrink: 0;
    color: #333;
    display: flex;
    align-items: center;
  }

  &__value {
    flex: 1;
    font-family: $font-display;
    font-size: 26px;
    color: #111;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5px;

    &--placeholder {
      font-family: $font-body;
      font-size: 15px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.35);
      letter-spacing: 0;
    }
  }

  &__btn {
    background: $accent;
    border-radius: $radius-pill;
    color: #fff;
    font-family: $font-body;
    font-size: 15px;
    font-weight: 700;
    padding: 11px 28px;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    flex-shrink: 0;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}
</style>
