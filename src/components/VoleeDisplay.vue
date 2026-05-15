<script setup>
import DartChip from './DartChip.vue'

defineProps({
  volee: { type: Array, required: true },
})
</script>

<template>
  <div class="volee">
    <div class="volee__label">Volée (3 fléchettes)</div>
    <div class="volee__darts">
      <template v-for="(dart, i) in volee" :key="i">
        <span v-if="i > 0" class="volee__plus">+</span>
        <DartChip :dart="dart" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.volee {
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 20px;

  &__label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $muted;
    margin-bottom: 14px;
    text-align: center;
  }

  &__darts {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  &__plus {
    color: $muted;
    font-size: 18px;
    font-weight: 300;
  }
}
</style>
