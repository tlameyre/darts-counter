<script setup>
const emit = defineEmits(['digit', 'delete', 'validate'])

const rows = [
  [
    { label: '1', action: () => emit('digit', '1') },
    { label: '2', action: () => emit('digit', '2') },
    { label: '3', action: () => emit('digit', '3') },
  ],
  [
    { label: '4', action: () => emit('digit', '4') },
    { label: '5', action: () => emit('digit', '5') },
    { label: '6', action: () => emit('digit', '6') },
  ],
  [
    { label: '7', action: () => emit('digit', '7') },
    { label: '8', action: () => emit('digit', '8') },
    { label: '9', action: () => emit('digit', '9') },
  ],
  [
    { label: '⌫', mod: 'del',      action: () => emit('delete') },
    { label: '0', action: () => emit('digit', '0') },
    { label: '✓', mod: 'validate', action: () => emit('validate') },
  ],
]
</script>

<template>
  <div class="numpad">
    <div v-for="(row, ri) in rows" :key="ri" class="numpad__row">
      <div v-if="ri > 0" class="numpad__separator" />
      <div class="numpad__row-keys">
        <button
          v-for="key in row"
          :key="key.label"
          class="numpad__key"
          :class="key.mod && `numpad__key--${key.mod}`"
          @click="key.action"
        >
          {{ key.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.numpad {
  display: flex;
  flex-direction: column;

  &__separator {
    height: 1px;
    background: $border;
    margin: 0 -4px;
  }

  &__row-keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  &__key {
    background: transparent;
    border: none;
    color: $text;
    font-family: $font-display;
    font-size: 24px;
    font-weight: 400;
    padding: 10px;
    transition: background 0.1s, transform 0.08s;

    &:active {
      transform: scale(0.88);
      background: rgba(255, 255, 255, 0.06);
    }

    &--del {
      font-family: $font-body;
      font-size: 15px;
      color: $muted;
    }

    &--validate {
      color: $accent;
      font-family: $font-body;
      font-size: 18px;
    }
  }
}
</style>
