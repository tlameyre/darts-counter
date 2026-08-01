<script setup>
import { computed } from 'vue'
import AppModal from '../AppModal.vue'

const props = defineProps({
  show:          { type: Boolean, required: true },
  friends:       { type: Array,   default: () => [] },
  excludedIds:   { type: Array,   default: () => [] },
})

const emit = defineEmits(['close', 'select'])

const availableFriends = computed(() =>
  props.friends.filter(f => !props.excludedIds.includes(f.id))
)

function avatarLetter(friend) {
  return (friend.username?.[0] || friend.first_name?.[0] || '?').toUpperCase()
}

function pick(friend) {
  emit('select', { id: friend.id, name: friend.username || friend.first_name || 'Ami' })
}
</script>

<template>
  <AppModal :show="show" title="Ajouter un hôte" size="lg" @close="$emit('close')">
    <div class="host-picker">
      <div v-if="availableFriends.length" class="host-picker__list">
        <button
          v-for="friend in availableFriends" :key="friend.id"
          class="host-picker__item"
          @click="pick(friend)"
        >
          <div class="host-picker__avatar">{{ avatarLetter(friend) }}</div>
          <span class="host-picker__name">{{ friend.username || friend.first_name }}</span>
        </button>
      </div>
      <p v-else class="host-picker__empty">
        Tous tes amis sont déjà hôtes, ou tu n'as pas encore d'amis.
      </p>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.host-picker {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba($white, 0.09); }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-sm;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;
  }

  &__name {
    @include title-sm;
    color: $text-color;
    font-weight: 600;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;
  }
}
</style>
