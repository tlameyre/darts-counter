<script setup>
defineProps({
  modelValue:  Boolean,
  title:       String,
  description: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <button
    class="toggle"
    :class="{ 'toggle--on': modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div class="toggle__text">
      <span class="toggle__title">{{ title }}</span>
      <span class="toggle__desc">{{ description }}</span>
    </div>
    <div class="toggle__switch" :class="{ 'toggle__switch--on': modelValue }">
      <div class="toggle__knob" />
    </div>
  </button>
</template>

<style lang="scss" scoped>
.toggle {
  background: $surface;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: $padding-sm $padding-md;
  display: flex;
  align-items: center;
  gap: $padding-sm;
  text-align: left;
  transition: border-color 0.2s;
  width: 100%;

  &--on { border-color: rgba($orange, 0.6); }

  &__text { flex: 1; }

  &__title {
    display: block;
    font-size: $text-sm;
    font-weight: 700;
    color: $text-color;
    margin-bottom: $padding-xxs;
  }

  &__desc {
    display: block;
    font-size: $text-xs;
    color: $muted;
    line-height: 1.4;
  }

  &__switch {
    width: 44px;
    height: 26px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;

    &--on { background: $orange; border-color: $orange; }
  }

  &__knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: $white;
    border-radius: 50%;
    transition: transform 0.2s;

    .toggle__switch--on & { transform: translateX(18px); }
  }
}
</style>
