<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: '' },
  zIndex: { type: Number, default: 100 },
  size: { type: String, default: 'sm' }, // 'sm' | 'lg'
  centered: { type: Boolean, default: false },
  minHeight: { type: String, default: null },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="app-sheet">
      <div v-if="show" class="app-modal" :class="{ 'app-modal--centered': centered }" :style="{ zIndex }">
        <div class="app-modal__backdrop" @click="$emit('close')" />
        <div class="app-modal__sheet" :class="`app-modal__sheet--${size}`" :style="minHeight ? { minHeight } : undefined">
          <div v-if="title" class="app-modal__header">
            <span class="app-modal__title">{{ title }}</span>
            <button class="app-modal__close" @click="$emit('close')">
              <AppIcon name="close" :width="24" :height="24" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;

  &--centered {
    @media (min-width: $bp-tablet) {
      align-items: center;
      justify-content: center;
    }
  }

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.65);
  }

  &__sheet {
    position: relative;
    width: 100%;
    margin: 0 auto;
    background: #1e2b28;
    border-radius: $radius-lg $radius-lg 0 0;
    display: flex;
    flex-direction: column;
    max-height: 90dvh;
    overflow-y: auto;

    &--sm {
      padding: $padding-md $padding-md $padding-xxl;
      gap: $gap-md;

      @media (min-width: $bp-laptop) {
        padding: $padding-xl $padding-xl $padding-xxl;
        gap: $gap-lg;
      }
    }

    &--lg {
      padding: $padding-xl $padding-md calc($padding-xl + env(safe-area-inset-bottom, 0px));
      gap: $gap-lg;

      @media (min-width: $bp-laptop) {
        padding: $padding-xxl $padding-xl calc($padding-xxl + env(safe-area-inset-bottom, 0px));
        gap: $gap-xl;
      }
    }
  }

  &--centered &__sheet {
    @media (min-width: $bp-tablet) {
      width: auto;
      min-width: 50%;
      border-radius: $radius-lg;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $gap-sm;
    border-bottom: 1px solid rgba($white, 0.08);
    position: sticky;
    top: 0;
    background: #1e2b28;
    z-index: 1;
  }

  &__title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    @media (min-width: $bp-laptop) { @include title-md; }
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    flex-shrink: 0;

    &:active {
      color: $text-color;
    }
  }
}

.app-sheet-enter-active,
.app-sheet-leave-active {
  transition: opacity 0.25s;

  .app-modal__sheet {
    transition: transform 0.25s ease;
  }
}

.app-sheet-enter-from,
.app-sheet-leave-to {
  opacity: 0;

  .app-modal__sheet {
    transform: translateY(100%);
  }
}
</style>
