<script setup>
defineProps({
  dart: {
    type: Object,
    required: true,
    // { type: 'single'|'double'|'triple'|'bull'|'miss', label: String, pts: Number }
  },
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
  max-width: 110px;
  border-radius: $radius-md;
  padding: 12px 8px;
  text-align: center;
  border: 2px solid transparent;

  &__type {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    opacity: 0.75;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  &__pts {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 3px;
  }

  &--single { background: rgba($dart-single, 0.15); border-color: rgba($dart-single, 0.4); color: $dart-single-light; }
  &--double { background: rgba($dart-double, 0.15); border-color: rgba($dart-double, 0.4); color: $dart-double-light; }
  &--triple { background: rgba($dart-triple, 0.15); border-color: rgba($dart-triple, 0.4); color: $dart-triple-light; }
  &--bull   { background: rgba($dart-bull,   0.15); border-color: rgba($dart-bull,   0.4); color: $dart-bull-light;   }
  &--miss   { background: rgba($dart-miss,   0.10); border-color: rgba($dart-miss,   0.2); color: $dart-miss;         }
}
</style>
