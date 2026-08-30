<script setup>
import { computed } from 'vue'

const props = defineProps({
  dart: { type: Object, required: true },
  size: { type: String, default: 'md', validator: v => ['sm', 'md'].includes(v) },
})

// Secteurs rouges de la cible (mêmes valeurs que DartChip / SvgDartboard).
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const colors = computed(() => {
  const { dart } = props
  if (dart.type === 'bull') {
    return dart.pts === 50
      ? { bg: 'var(--dart-red)', text: '#fff' }
      : { bg: 'var(--dart-green)', text: '#fff' }
  }
  const base = dart.sector
  const isRed = RED_NUMBERS.has(base)
  if (dart.type === 'single') {
    return isRed
      ? { bg: 'var(--dart-black)', text: '#fff' }
      : { bg: 'var(--dart-cream)', text: 'var(--dart-cream-text)' }
  }
  return isRed
    ? { bg: 'var(--dart-red)', text: '#fff' }
    : { bg: 'var(--dart-green)', text: '#fff' }
})
</script>

<template>
  <span class="dart-pill" :class="`dart-pill--${size}`"
    :style="{ background: colors.bg, color: colors.text }">
    {{ dart.label }}
  </span>
</template>

<style lang="scss" scoped>
.dart-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: $border-sm solid $white;
  border-radius: $radius-sm;
  font-variant-numeric: tabular-nums;

  &--sm {
    @include text-xs;
    padding: $padding-xxs $padding-xs;
  }

  &--md {
    @include title-md;
    padding: $padding-xs $padding-sm;
  }
}

@media (min-width: $bp-laptop) {
  .dart-pill--sm { @include text-sm; }
  .dart-pill--md { @include title-lg; }
}
</style>
