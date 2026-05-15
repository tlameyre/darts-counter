<script setup>
const props = defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const options = [
  { value: 'easy',   label: 'Simple' },
  { value: 'medium', label: 'Double' },
  { value: 'hard',   label: 'Triple' },
]
</script>

<template>
  <div class="difficulty">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="difficulty__btn"
      :class="{ 'difficulty__btn--active': modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.difficulty {
  display: flex;
  gap: 8px;

  &__btn {
    flex: 1;
    background: $bg;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $muted;
    font-size: 13px;
    font-weight: 600;
    padding: 10px;
    transition: all 0.15s;

    &--active {
      background: rgba($accent, 0.15);
      border-color: $accent;
      color: $accent;
    }
  }
}
</style>
