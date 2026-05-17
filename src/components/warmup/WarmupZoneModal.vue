<script setup>
import { ref, watch } from 'vue'
import ZonePicker from '../ZonePicker.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  zone: { type: Object, required: true },
})

const emit = defineEmits(['update:show', 'confirm'])

const tempZone = ref({ ...props.zone })

watch(() => props.show, (val) => {
  if (val) tempZone.value = { ...props.zone }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="warmup-modal" @click.self="emit('update:show', false)">
        <div class="warmup-modal__sheet">
          <div class="warmup-modal__title">Changer de zone</div>
          <ZonePicker v-model="tempZone" />
          <div class="warmup-modal__actions">
            <button class="warmup-modal__btn warmup-modal__btn--cancel" @click="emit('update:show', false)">Annuler</button>
            <button class="warmup-modal__btn warmup-modal__btn--confirm" @click="emit('confirm', tempZone)">Confirmer</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.warmup-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__sheet {
    width: 100%;
    background: #1a2422;
    border-radius: 24px 24px 0 0;
    padding: 24px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__title {
    font-family: 'Noka', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    color: #fff;
    text-align: center;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__btn {
    flex: 1;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    padding: 12px;
    transition: transform 0.1s, opacity 0.15s;
    &:active { transform: scale(0.97); opacity: 0.85; }
    &--cancel  { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    &--confirm { background: #1D4ED8; color: #fff; }
  }
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .warmup-modal__sheet,
.modal-leave-active .warmup-modal__sheet { transition: transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .warmup-modal__sheet,
.modal-leave-to .warmup-modal__sheet { transform: translateY(100%); }
</style>
