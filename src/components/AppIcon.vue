<script setup>
defineProps({
  name:   { type: String, required: true },
  width:  { type: [Number, String], default: 24 },
  height: { type: [Number, String], default: 24 },
  color:  { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :style="{ color }"
    fill="none"
    aria-hidden="true"
  >
    <use :href="`#icon-${name}`" />
  </svg>
</template>
