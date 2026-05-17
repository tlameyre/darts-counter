<script setup>
import { ref } from 'vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['undo', 'miss', 'end'])

const pressedMiss = ref(false)
let _missTimer = null

function tapMiss() {
  if (props.locked) return
  clearTimeout(_missTimer)
  pressedMiss.value = true
  _missTimer = setTimeout(() => { pressedMiss.value = false }, 160)
  emit('miss')
}
</script>

<template>
  <div class="warmup__bottom">
    <button class="warmup__bottom-undo" @click="emit('undo')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </svg>
    </button>
    <button class="warmup__bottom-miss" :class="{ 'warmup__bottom-miss--pressed': pressedMiss }"
      @click="tapMiss">MANQUÉ</button>
    <button class="warmup__bottom-end" @click="emit('end')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.warmup__bottom {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  align-items: center;
  flex-shrink: 0;
}

.warmup__bottom-undo {
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.warmup__bottom-miss {
  font-family: $font-display;
  font-size: $title-xxs;
  letter-spacing: 2px;
  color: $white;
  background: $surface;
  border: 1px solid $border;
  border-radius: $radius-md;
  padding: $padding-xs;
  transition: background 0.1s, color 0.1s;
  &:active, &--pressed {
    background: rgba($error, 0.2);
    color: $error-light;
  }
}

.warmup__bottom-end {
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:active { color: $error; }
}
</style>
