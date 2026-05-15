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
    { label: '⌫', mod: 'del', action: () => emit('delete') },
    { label: '0', action: () => emit('digit', '0') },
    { label: '✓', mod: 'validate', action: () => emit('validate') },
  ],
]
</script>

<template>
  <div class="numpad">
    <div v-for="(row, ri) in rows" :key="ri" class="numpad__row">
      <div class="numpad__row-keys">
        <button v-for="key in row" :key="key.label" class="numpad__key" :class="key.mod && `numpad__key--${key.mod}`"
          @click="key.action">
          {{ key.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.numpad {
  display: flex;
  flex: 1;
  flex-direction: column;

  &__row {
    display: flex;
    flex: 1;
    flex-direction: column;

    // Bordure du bas sur toutes les lignes sauf la dernière
    &:not(:last-child) .numpad__row-keys {
      border-bottom: 1px solid $border;
    }
  }

  &__row-keys {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, 1fr);
  }

  &__key {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: $text;
    font-family: $font-display;
    font-size: 24px;
    font-weight: 400;
    padding: 0;
    transition: background 0.1s, transform 0.08s;

    // Bordure droite sur toutes les touches sauf la dernière de chaque ligne
    &:not(:last-child) {
      border-right: 1px solid $border;
    }

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
