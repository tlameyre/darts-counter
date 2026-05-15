<script setup>
defineProps({
  streak: { type: Number, required: true },
  best:   { type: Number, required: true },
})
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">Darts <span>Counter</span></h1>
    <div class="app-header__stats">
      <div class="stat-pill">Serie: <strong>{{ streak }}</strong></div>
      <div class="stat-pill">Meilleur: <strong>{{ best }}</strong></div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  background: $card;
  border-bottom: 1px solid $border;
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;

  &__title {
    font-size: 20px;
    font-weight: 700;

    span { color: $accent; }
  }

  &__stats {
    display: flex;
    gap: 6px;
  }
}

.stat-pill {
  background: $bg;
  border: 1px solid $border;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  color: $muted;

  strong { color: $text; }
}
</style>
