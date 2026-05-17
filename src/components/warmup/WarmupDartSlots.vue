<script setup>
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {{ timeDisplay }}
    </div>
  </div>

  <div class="warmup__slots">
    <div class="warmup__slots-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M19.2 12C19.2 8.02499 15.975 4.79999 12 4.79999C8.02499 4.79999 4.79999 8.02499 4.79999 12C4.79999 15.975 8.02499 19.2 12 19.2C15.975 19.2 19.2 15.975 19.2 12ZM2.39999 12C2.39999 6.69749 6.69749 2.39999 12 2.39999C17.3025 2.39999 21.6 6.69749 21.6 12C21.6 17.3025 17.3025 21.6 12 21.6C6.69749 21.6 2.39999 17.3025 2.39999 12ZM12 15C13.6575 15 15 13.6575 15 12C15 10.3425 13.6575 8.99999 12 8.99999C10.3425 8.99999 8.99999 10.3425 8.99999 12C8.99999 13.6575 10.3425 15 12 15ZM12 6.59999C14.9812 6.59999 17.4 9.01874 17.4 12C17.4 14.9812 14.9812 17.4 12 17.4C9.01874 17.4 6.59999 14.9812 6.59999 12C6.59999 9.01874 9.01874 6.59999 12 6.59999ZM10.8 12C10.8 11.3362 11.3362 10.8 12 10.8C12.6637 10.8 13.2 11.3362 13.2 12C13.2 12.6637 12.6637 13.2 12 13.2C11.3362 13.2 10.8 12.6637 10.8 12Z"
          fill="#333" />
      </svg>
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
