<script setup>
defineProps({
  label:      { type: String, required: true },
  options:    { type: Array,  required: true },
  modelValue: { required: true },
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
    font-size: $text-xs;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: $muted;
    margin-bottom: 10px;
    font-weight: 700;
  }

  &__options { display: flex; gap: 8px; }

  &__btn {
    flex: 1;
    background: rgba($white, 0.05);
    border: 1.5px solid $border;
    border-radius: $radius-md;
    color: $muted;
    font-family: $font-body;
    font-size: $text-xs;
    font-weight: 700;
    padding: $padding-sm;
    transition: all 0.15s;

    &--active {
      background: $orange;
      border-color: $orange;
      color: $white;
    }
  }
}
</style>
