<script setup>
defineProps({
  dart: { type: Object, required: true },
})

const TYPE_LABELS = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  bull:   'Bull',
  miss:   'Raté',
}
</script>

<template>
  <div class="dart-chip" :class="`dart-chip--${dart.type}`">
    <div class="dart-chip__type">{{ TYPE_LABELS[dart.type] }}</div>
    <div class="dart-chip__label">{{ dart.label }}</div>
    <div class="dart-chip__pts">{{ dart.pts }} pts</div>
  </div>
</template>

<style lang="scss" scoped>
.dart-chip {
  flex: 1;
  border-radius: $radius-md;
  padding: 8px 6px;
  text-align: center;
  background: rgba(0, 0, 0, 0.22);
  border: 1.5px solid rgba(255, 255, 255, 0.15);

  &__type {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 3px;
  }

  &__label {
    font-family: $font-display;
    font-size: 20px;
    line-height: 1;
    color: white;
  }

  &__pts {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;
  }

  // Teintures par type sur le label
  &--double .dart-chip__label { color: $dart-double-light; }
  &--triple .dart-chip__label { color: $dart-triple-light; }
  &--bull   .dart-chip__label { color: $dart-bull-light;   }
  &--miss   { background: rgba(0,0,0,0.15); }
  &--miss .dart-chip__label   { color: rgba(255,255,255,0.35); }
}
</style>
