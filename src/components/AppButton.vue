<script setup>
defineProps({
  size: {
    type: String,
    default: 'big',
    validator: v => ['big', 'small'].includes(v),
  },
  rounded: {
    type: String,
    default: 'default',
    validator: v => ['default', 'full'].includes(v),
  },
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'ghost'].includes(v),
  },
  active: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button :class="['btn', `btn--${size}`, `btn--${rounded}`, `btn--${variant}`, { 'btn--active': active }]">
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-transform: uppercase;
  transition: background 0.15s, transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  // --- Tailles ---
  &--big {
    @include title-md;
    font-weight: 700;
    padding: $padding-md $padding-xl;
  }

  &--small {
    @include title-sm;
    font-weight: 700;
    padding: $padding-xs $padding-md;
  }

  // --- Radius ---
  &--default {
    border-radius: $radius-sm;
  }

  &--full {
    border-radius: $radius-pill;
  }

  // --- Variantes ---
  &--primary {
    background: $orange;
    color: $white;

    &:active {
      background: $orange-dark;
    }
  }

  &--secondary {
    background: transparent;
    color: $white;
    border: $border-md solid $white;

    &:active {
      background: rgba($white, 0.05);
    }
  }

  &--ghost {
    background: transparent;
    color: $white;
    border: $border-md solid $white;

    &:active {
      background: rgba($white, 0.08);
    }
  }

  // État actif (ex: option sélectionnée dans un groupe)
  &--active {
    background: $orange;
    border-color: $orange;
    color: $white;
  }

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

@media (min-width: $bp-laptop) {
  .btn--big {
    @include title-lg;
    padding: $padding-lg $padding-xxl;
  }

  .btn--small {
    @include title-md;
    padding: $padding-sm $padding-lg;
  }
}
</style>
