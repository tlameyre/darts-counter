<script setup>
import draggable from 'vuedraggable'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  modelValue: { type: Array, required: true },
  removable:  { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'remove'])

function onModelUpdate(value) {
  emit('update:modelValue', value)
}

function avatarLetter(player) {
  return player.name?.[0]?.toUpperCase() ?? '?'
}
</script>

<template>
  <draggable
    :model-value="modelValue"
    item-key="id"
    handle=".player-order__handle"
    ghost-class="player-order__item--ghost"
    tag="div"
    class="player-order"
    @update:model-value="onModelUpdate"
  >
    <template #item="{ element: player, index: i }">
      <div class="player-order__item" :class="{ 'player-order__item--me': player.isMe }">
        <span class="player-order__handle">
          <AppIcon name="drag-handle" :width="18" :height="18" />
        </span>
        <span class="player-order__position">{{ i + 1 }}</span>
        <div class="player-order__avatar" :class="{ 'player-order__avatar--guest': player.isGuest }">
          {{ avatarLetter(player) }}
        </div>
        <span class="player-order__name">{{ player.name }}</span>
        <span v-if="player.isMe" class="player-order__tag">Toi</span>
        <span v-else-if="player.isFriend" class="player-order__tag">Ami</span>
        <span v-else-if="player.isRegistered" class="player-order__tag">Joueur</span>
        <button v-if="removable && !player.isMe" class="player-order__remove" @click="emit('remove', i)">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </div>
    </template>
  </draggable>
</template>

<style lang="scss" scoped>
.player-order {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);

    &--me {
      background: rgba($orange, 0.12);
      border: $border-sm solid rgba($orange, 0.3);
    }

    &--ghost {
      opacity: 0.4;
    }
  }

  &__handle {
    display: flex;
    align-items: center;
    color: $muted;
    cursor: grab;
    touch-action: none;
    flex-shrink: 0;

    &:active { cursor: grabbing; }
  }

  &__position {
    @include text-xs;
    color: $muted;
    width: 16px;
    text-align: center;
    flex-shrink: 0;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--guest {
      background: rgba($white, 0.15);
    }
  }

  &__name {
    flex: 1;
    @include text-sm;
    font-weight: 600;
    color: $text-color;
  }

  &__tag {
    @include text-xs;
    color: $muted;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 2px 8px;
  }

  &__remove {
    color: $muted;
    display: flex;
    align-items: center;
    padding: $padding-xxs;

    &:active { opacity: 0.6; }
  }
}

@media (min-width: $bp-laptop) {
  .player-order {
    &__name { @include text-md; }
  }
}
</style>
