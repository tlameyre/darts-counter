<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  darts: { type: Array, required: true },
  tourNumber: { type: Number, required: true },
  timeDisplay: { type: String, required: true },
  isUrgent: { type: Boolean, default: false },
})
</script>

<template>
  <div class="warmup__tour-row">
    <span class="warmup__tour-label">TOUR {{ tourNumber }}</span>
    <div class="warmup__timer" :class="{ 'warmup__timer--urgent': isUrgent }">
      <AppIcon name="clock" :width="13" :height="13" />
      {{ timeDisplay }}
    </div>
  </div>

  <div class="warmup__slots">
    <div class="warmup__slots-icon">
      <AppIcon name="dartboard" :width="24" :height="24" color="#333" />
    </div>
    <div class="warmup__slots-sep" />
    <div class="warmup__slot" v-for="i in 3" :key="i">
      <Transition name="slot-pop">
        <span v-if="darts[i - 1]" :key="darts[i - 1].ts">
          {{ darts[i - 1].pts }}
        </span>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warmup__tour-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.warmup__tour-label {
  font-family: $font-display;
  font-size: $title-xxs;
  color: $text-color;
  letter-spacing: 1px;
}

.warmup__timer {
  font-family: $font-display;
  display: flex;
  align-items: center;
  gap: $gap-xs;
  font-size: $title-xxs;
  transition: color 0.3s;
  &--urgent { color: $error; }
}

.warmup__slots {
  display: flex;
  align-items: stretch;
  background: $white;
  border-radius: $radius-pill;
  overflow: hidden;
  flex-shrink: 0;
  height: 50px;
}

.warmup__slots-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 $padding-md;
  flex-shrink: 0;
}

.warmup__slots-sep {
  width: 1px;
  background: rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.warmup__slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-display;
  font-size: $title-xs;
  color: $input-text;
  border-left: 1px solid rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.slot-pop-enter-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.slot-pop-enter-from   { transform: scale(0.5); opacity: 0; }
</style>
