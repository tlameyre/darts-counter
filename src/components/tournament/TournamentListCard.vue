<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  tournament: { type: Object, required: true },
})

defineEmits(['click'])

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const STATUS_LABELS = { pending: 'Pas démarré', in_progress: 'En cours', completed: 'Terminé' }
</script>

<template>
  <button class="tournament-card" @click="$emit('click')">
    <div class="tournament-card__icon" :class="{ 'tournament-card__icon--done': tournament.status === 'completed' }">
      <AppIcon name="trophy" :width="20" :height="20" />
    </div>
    <div class="tournament-card__info">
      <span class="tournament-card__name">{{ tournament.name }}</span>
      <span class="tournament-card__meta">
        {{ tournament.player_count }} joueurs · {{ formatDate(tournament.created_at) }}
      </span>
    </div>
    <span class="tournament-card__status" :class="{ 'tournament-card__status--done': tournament.status === 'completed' }">
      {{ STATUS_LABELS[tournament.status] ?? tournament.status }}
    </span>
    <AppIcon name="arrow-left" :width="16" :height="16" class="tournament-card__arrow" />
  </button>
</template>

<style lang="scss" scoped>
.tournament-card {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-md;
  background: rgba($white, 0.05);
  text-align: left;
  transition: background 0.15s;
  color: $white;

  &:active { background: rgba($white, 0.08); }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: rgba(#7C3AED, 0.2);
    color: #7C3AED;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--done {
      background: rgba($orange, 0.2);
      color: $orange;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    @include title-sm;
    color: $text-color;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    @include text-xs;
    color: $muted;
  }

  &__status {
    @include text-xs;
    color: $orange;
    background: rgba($orange, 0.12);
    border-radius: $radius-pill;
    padding: 2px 8px;
    flex-shrink: 0;

    &--done {
      color: $muted;
      background: rgba($white, 0.08);
    }
  }

  &__arrow {
    color: $muted;
    transform: rotate(180deg);
    flex-shrink: 0;
  }
}
</style>
