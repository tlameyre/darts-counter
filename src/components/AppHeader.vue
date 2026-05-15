<script setup>
defineProps({
  streak:        { type: Number, required: true },
  questionLabel: { type: String, required: true },
  maxQuestions:  { default: null },
})
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">DARTS</h1>
    <div class="app-header__right">
      <div v-if="maxQuestions !== null" class="app-header__pill">
        {{ questionLabel }}
      </div>
      <div v-else class="app-header__pill">
        Série <strong>{{ streak }}</strong>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  padding: 14px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__title {
    font-family: $font-display;
    font-size: 22px;
    font-weight: 400;
    letter-spacing: 2px;
    color: $text;
  }

  &__pill {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    padding: 5px 14px;
    font-size: 13px;
    font-weight: 700;
    color: $text;
    font-variant-numeric: tabular-nums;

    strong { color: $orange; }
  }
}
</style>
