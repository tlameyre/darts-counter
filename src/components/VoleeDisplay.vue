<script setup>
import DartChip from './DartChip.vue'

defineProps({
  volee: { type: Array, required: true },
})
</script>

<template>
  <div class="volee-darts">
    <template v-for="(dart, i) in volee" :key="i">
      <span v-if="i > 0" class="volee-darts__plus">+</span>
      <DartChip :dart="dart" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.volee-darts {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;

  &__plus {
    color: $muted;
    font-size: $text-sm;
    font-weight: 300;
    flex-shrink: 0;
  }
}
</style>
