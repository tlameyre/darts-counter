<script setup>
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

defineProps({
  show:          { type: Boolean, required: true },
  title:         { type: String,  required: true },
  message:       { type: String,  required: true },
  confirmLabel:  { type: String,  default: 'Confirmer' },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <AppModal :show="show" :title="title" size="sm" @close="$emit('close')">
    <div class="confirm-modal">
      <p class="confirm-modal__message">{{ message }}</p>
      <div class="confirm-modal__actions">
        <AppButton variant="ghost" @click="$emit('close')">Annuler</AppButton>
        <AppButton variant="secondary" class="confirm-modal__danger" @click="$emit('confirm')">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.confirm-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__message {
    @include text-sm;
    color: $muted;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__danger {
    border-color: $error;
    color: $error;

    &:active { background: rgba($error, 0.1); }
  }
}
</style>
