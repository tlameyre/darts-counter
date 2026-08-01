<script setup>
defineProps({
  tournaments: { type: Array, required: true },
})

defineEmits(['tournament-click', 'view-all'])
</script>

<template>
  <section v-if="tournaments.length" class="active-tournaments">
    <div class="active-tournaments__header">
      <h2 class="active-tournaments__title">Tournois en cours</h2>
      <button class="active-tournaments__more" @click="$emit('view-all')">Voir tout</button>
    </div>

    <div class="active-tournaments__list">
      <button
        v-for="t in tournaments" :key="t.id"
        class="active-tournaments__chip"
        @click="$emit('tournament-click', t.id)"
      >
        <span class="active-tournaments__icon">🏆</span>
        <span class="active-tournaments__name">{{ t.name }}</span>
        <span class="active-tournaments__meta">{{ t.player_count }} joueurs</span>
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.active-tournaments {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__more {
    @include title-sm;
    color: $orange;
  }

  &__list {
    display: flex;
    gap: $gap-sm;
    overflow-x: auto;
  }

  &__chip {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    min-width: 140px;
    flex-shrink: 0;
    transition: background 0.15s;

    &:active { background: rgba($white, 0.09); }
  }

  &__icon {
    @include title-md;
    line-height: 1;
  }

  &__name {
    @include text-sm;
    font-weight: 600;
    color: $text-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  &__meta {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .active-tournaments {
    &__title { @include title-md; }
    &__more  { @include title-md; }
  }
}
</style>
