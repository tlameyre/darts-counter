<script setup>
defineProps({
  label:       { type: String, required: true },
  options:     { type: Array,  required: true }, // [{ value, label }]
  modelValue:  { required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="option-selector">
    <div class="option-selector__label">{{ label }}</div>
    <div class="option-selector__options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="option-selector__btn"
        :class="{ 'option-selector__btn--active': modelValue === opt.value }"
        @click="$emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.option-selector {
  &__label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $muted;
    margin-bottom: 10px;
  }

  &__options {
    display: flex;
    gap: 8px;
  }

  &__btn {
    flex: 1;
    background: $bg;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $muted;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 8px;
    transition: all 0.15s;

    &--active {
      background: rgba($accent, 0.15);
      border-color: $accent;
      color: $accent;
    }
  }
}
</style>
