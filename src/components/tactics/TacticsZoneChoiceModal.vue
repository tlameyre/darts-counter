<script setup>
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:         { type: Boolean, default: false },
  dartLabel:    { type: String,  default: '' },   // ex: "T18"
  numberLabel:  { type: String,  default: '' },   // ex: "18"
  specialLabel: { type: String,  default: '' },   // ex: "Triple"
})

const emit = defineEmits(['choose'])
</script>

<template>
  <AppModal :show :z-index="110" size="lg" @close="emit('choose', 'number')">
    <div class="zc-modal__header">
      <p class="zc-modal__title">{{ dartLabel }} compte pour...</p>
      <button class="zc-modal__close" @click="emit('choose', 'number')">
        <AppIcon name="close" :width="16" :height="16" />
      </button>
    </div>
    <div class="zc-modal__options">
      <button class="zc-modal__btn" @click="emit('choose', 'number')">
        Le {{ numberLabel }}
      </button>
      <button class="zc-modal__btn" @click="emit('choose', 'special')">
        La zone {{ specialLabel }}
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.zc-modal {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    @include title-lg;
    color: $white;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xxs;
    transition: color 0.15s;
    &:active { color: $white; }
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__btn {
    background: rgba($white, 0.08);
    border-radius: $radius-md;
    padding: $padding-lg;
    @include text-xl;
    font-weight: 700;
    color: $white;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $orange;
      transform: scale(0.97);
    }
  }
}

@media (min-width: $bp-laptop) {
  .zc-modal {
    &__title { @include title-xl; }
    &__btn   { @include text-xxl; padding: $padding-xl; }
  }
}
</style>
