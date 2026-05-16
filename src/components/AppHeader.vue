<script setup>
defineProps({
  title: { type: String, default: 'DARTS COUNTER' },
})

defineEmits(['back'])
</script>

<template>
  <header class="app-header">
    <button class="app-header__back" @click="$emit('back')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <h1 class="app-header__title">{{ title }}</h1>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  padding: $padding-md $padding-md 0;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;

  &__back {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__title {
    font-family: $font-display;
    font-size: $title-md;
    font-weight: 400;
    letter-spacing: 1px;
    color: $text-color;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
