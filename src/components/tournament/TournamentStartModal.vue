<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import ToggleSwitch from '../ToggleSwitch.vue'
import { isPowerOfTwo } from '../../composables/useTournamentBracket.js'

const props = defineProps({
  show:             { type: Boolean, required: true },
  participantCount: { type: Number, required: true },
})

const emit = defineEmits(['close', 'confirm'])

const manualSeeding     = ref(false)
const doubleElimination = ref(false)
const isPow2 = computed(() => isPowerOfTwo(props.participantCount))

watch(isPow2, (ok) => { if (!ok) doubleElimination.value = false })

function confirm() {
  emit('confirm', {
    seedingMethod:     manualSeeding.value ? 'manual' : 'random',
    doubleElimination: doubleElimination.value,
  })
}
</script>

<template>
  <AppModal :show="show" title="Démarrer le tournoi" size="sm" @close="$emit('close')">
    <div class="start-modal">
      <ToggleSwitch
        v-model="manualSeeding"
        title="Seeding manuel"
        description="Sinon, tirage au sort à l'instant du démarrage."
      />
      <ToggleSwitch
        :model-value="doubleElimination"
        title="Bracket perdants"
        :description="isPow2
          ? 'Double élimination : les perdants ont une seconde chance.'
          : `Nécessite un nombre de participants puissance de 2 (4, 8, 16...) — actuellement ${participantCount}.`"
        :class="{ 'start-modal__toggle--disabled': !isPow2 }"
        @update:model-value="val => { if (isPow2) doubleElimination = val }"
      />
      <AppButton @click="confirm">Démarrer</AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.start-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__toggle--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
