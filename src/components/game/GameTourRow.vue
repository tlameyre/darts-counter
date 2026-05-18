<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  questionLabel: [String, Number],
  phase:         Number,
  showPhase:     Boolean,
  timeLeft:      { type: Number, default: null },
  showTimer:     Boolean,
  isUrgent:      Boolean,
})
</script>

<template>
  <div class="game__tour-row">
    <span class="game__tour-label">
      TOUR {{ questionLabel }}
    </span>
    <div v-if="showPhase" class="game__phase-badge">
      Phase {{ phase }}/2
    </div>
    <div v-if="showTimer" class="game__timer-badge"
      :class="isUrgent && 'game__timer-badge--urgent'">
      <AppIcon name="clock" :width="13" :height="13" />
      {{ timeLeft }}S
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game__tour-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.game__tour-label {
  font-family: $font-display;
  font-size: $title-sm;
  color: $orange;
  letter-spacing: 1px;
}

.game__timer-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: $surface;
  border: 1px solid $border;
  border-radius: $radius-pill;
  padding: $padding-xxs $padding-sm;
  font-size: $text-sm;
  font-weight: 700;
  color: $text-color;
  font-variant-numeric: tabular-nums;
  transition: background 0.3s, border-color 0.3s;

  &--urgent {
    background: rgba($error, 0.2);
    border-color: rgba($error, 0.5);
    color: $error-light;
  }
}

.game__phase-badge {
  background: rgba($accent, 0.15);
  border: 1px solid rgba($accent, 0.3);
  border-radius: $radius-pill;
  padding: $padding-xxs $padding-sm;
  font-size: $text-sm;
  font-weight: 700;
  color: $accent-light;
}
</style>
