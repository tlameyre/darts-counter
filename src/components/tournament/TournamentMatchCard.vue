<script setup>
const props = defineProps({
  match:            { type: Object, required: true },
  participantsById: { type: Object, required: true }, // id -> participant row
})

const emit = defineEmits(['play'])

function slotLabel(participantId) {
  if (participantId) return props.participantsById[participantId]?.player_data?.name ?? '—'
  return props.match.status === 'bye' ? 'Exempt' : 'À déterminer'
}

function isWinner(participantId) {
  return !!participantId && props.match.winner_participant_id === participantId
}

function onClick() {
  if (props.match.status === 'ready') emit('play')
}
</script>

<template>
  <button
    class="match-card"
    :class="`match-card--${match.status}`"
    :disabled="match.status !== 'ready'"
    @click="onClick"
  >
    <div
      class="match-card__player"
      :class="{
        'match-card__player--winner': isWinner(match.player1_participant_id),
        'match-card__player--tbd':    !match.player1_participant_id,
      }"
    >
      {{ slotLabel(match.player1_participant_id) }}
    </div>
    <div class="match-card__divider" />
    <div
      class="match-card__player"
      :class="{
        'match-card__player--winner': isWinner(match.player2_participant_id),
        'match-card__player--tbd':    !match.player2_participant_id,
      }"
    >
      {{ slotLabel(match.player2_participant_id) }}
    </div>
  </button>
</template>

<style lang="scss" scoped>
.match-card {
  display: flex;
  flex-direction: column;
  width: 168px;
  border-radius: $radius-sm;
  background: rgba($white, 0.05);
  border: $border-sm solid transparent;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;

  &--ready {
    border-color: rgba($orange, 0.5);

    &:active { background: rgba($orange, 0.1); }
  }

  &--bye,
  &--pending {
    opacity: 0.55;
  }

  &--completed {
    border-color: rgba($white, 0.1);
  }

  &:disabled {
    cursor: default;
  }

  &__player {
    @include text-sm;
    color: $text-color;
    font-weight: 600;
    padding: $padding-xs $padding-sm;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--tbd {
      color: $muted;
      font-weight: 400;
      font-style: italic;
    }

    &--winner {
      color: $orange;
    }
  }

  &__divider {
    height: 1px;
    background: rgba($white, 0.08);
  }
}
</style>
