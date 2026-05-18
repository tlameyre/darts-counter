<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'

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
      <AppIcon name="undo" :width="22" :height="22" />
    </button>
    <button class="warmup__bottom-miss" :class="{ 'warmup__bottom-miss--pressed': pressedMiss }"
      @click="tapMiss">MANQUÉ</button>
    <button class="warmup__bottom-end" @click="emit('end')">
      <AppIcon name="stop" :width="20" :height="20" />
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
