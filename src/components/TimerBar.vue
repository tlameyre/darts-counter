<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeLeft:  { type: Number, required: true },
  timeLimit: { type: Number, required: true },
})

const progress = computed(() => (props.timeLeft / props.timeLimit) * 100)

const colorClass = computed(() => {
  if (progress.value > 50) return 'timer-bar__fill--ok'
  if (progress.value > 25) return 'timer-bar__fill--warn'
  return 'timer-bar__fill--danger'
})
</script>

<template>
  <div class="timer-bar">
    <div
      class="timer-bar__fill"
      :class="colorClass"
      :style="{ width: `${progress}%` }"
    />
    <span class="timer-bar__label">{{ timeLeft }}s</span>
  </div>
</template>

<style lang="scss" scoped>
.timer-bar {
  position: relative;
  width: 100%;
  height: 6px;
  background: $border;
  border-radius: 3px;
  overflow: visible;

  &__fill {
    height: 100%;
    border-radius: 3px;
    transition: width 1s linear, background-color 0.3s;

    &--ok     { background: $accent; }
    &--warn   { background: $dart-triple; }
    &--danger { background: $red; }
  }

  &__label {
    position: absolute;
    right: 0;
    top: -20px;
    font-size: 11px;
    font-weight: 600;
    color: $muted;
    font-variant-numeric: tabular-nums;
  }
}
</style>
