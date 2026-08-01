<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  friends: { type: Array, required: true },
  pendingCount: { type: Number, default: 0 },
})

defineEmits(['see-all'])

function displayName(f) {
  return f.first_name || f.username || f.friend_code || '?'
}

function initial(f) {
  const name = f.first_name || f.username || f.friend_code || '?'
  return name[0].toUpperCase()
}
</script>

<template>
  <section class="pf-section">
    <div class="pf-section__header">
      <h2 class="pf-section__title">Amis <span>{{ friends.length }}</span></h2>
      <button class="pf-section__more" @click="$emit('see-all')">
        Voir tout
        <span v-if="pendingCount" class="pf-section__pending">{{ pendingCount }}</span>
      </button>
    </div>

    <div v-if="friends.length" class="pf-section__list">
      <div
        v-for="f in friends.slice(0, 5)"
        :key="f.friendshipId"
        class="pf-section__friend"
      >
        <div class="pf-section__avatar">{{ initial(f) }}</div>
        <span class="pf-section__name">{{ displayName(f) }}</span>
      </div>
    </div>

    <button v-else class="pf-section__empty" @click="$emit('see-all')">
      <AppIcon name="user-plus" :width="18" :height="18" />
      Ajouter des amis
    </button>
  </section>
</template>

<style lang="scss" scoped>
.pf-section {
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

    span {
      color: $orange;
      margin-left: $gap-xs;
    }
  }

  &__more {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include title-sm;
    color: $orange;
    transition: opacity 0.15s;
    &:active { opacity: 0.7; }
  }

  &__pending {
    @include text-xs;
    color: $white;
    background: $orange;
    border-radius: $radius-pill;
    padding: 1px 6px;
    min-width: 18px;
    text-align: center;
    line-height: 1.4;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__friend {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
  }

  &__avatar {
    @include title-sm;
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: $text-color;
  }

  &__name {
    @include text-sm;
    color: $text-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__empty {
    @include text-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-sm;
    color: $muted;
    background: rgba(255, 255, 255, 0.03);
    border: $border-sm dashed rgba(255, 255, 255, 0.12);
    border-radius: $radius-md;
    padding: $padding-md;
    width: 100%;
    transition: background 0.15s;
    &:active { background: rgba(255, 255, 255, 0.06); }
  }
}

@media (min-width: $bp-laptop) {
  .pf-section {
    &__title { @include title-md; }
    &__more  { @include title-md; }
    &__name  { @include text-md; }
    &__empty { @include text-md; }
  }
}
</style>
