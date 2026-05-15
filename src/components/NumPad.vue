<script setup>
const emit = defineEmits(['digit', 'delete', 'validate'])

const keys = [
  { label: '1', action: () => emit('digit', '1') },
  { label: '2', action: () => emit('digit', '2') },
  { label: '3', action: () => emit('digit', '3') },
  { label: '4', action: () => emit('digit', '4') },
  { label: '5', action: () => emit('digit', '5') },
  { label: '6', action: () => emit('digit', '6') },
  { label: '7', action: () => emit('digit', '7') },
  { label: '8', action: () => emit('digit', '8') },
  { label: '9', action: () => emit('digit', '9') },
  { label: '⌫', mod: 'del',      action: () => emit('delete') },
  { label: '0', action: () => emit('digit', '0') },
  { label: '✓', mod: 'validate', action: () => emit('validate') },
]
</script>

<template>
  <div class="numpad">
    <button
      v-for="key in keys"
      :key="key.label"
      class="numpad__key"
      :class="key.mod && `numpad__key--${key.mod}`"
      @click="key.action"
    >
      {{ key.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  &__key {
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-sm;
    color: $text;
    font-size: 22px;
    font-weight: 500;
    padding: 16px;
    transition: background 0.1s, transform 0.08s;

    &:active {
      transform: scale(0.92);
      background: $border;
    }

    &--del      { font-size: 16px; color: $muted; }
    &--validate { background: $accent; border-color: $accent; color: #fff; font-size: 18px; }
    &--validate:active { background: $accent-dark; }
  }
}
</style>
