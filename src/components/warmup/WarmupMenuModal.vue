<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'
import ZonePicker from '../ZonePicker.vue'

const props = defineProps({
  show:  { type: Boolean, required: true },
  zones: { type: Array,   required: true },
})

const emit = defineEmits(['finish', 'quit', 'close', 'zone-change'])

const tempZones = ref(props.zones.map(z => ({ ...z })))

watch(() => props.show, (val) => {
  if (val) tempZones.value = props.zones.map(z => ({ ...z }))
})

function zonesChanged(a, b) {
  if (a.length !== b.length) return true
  return a.some((z, i) => z.sector !== b[i].sector || z.type !== b[i].type)
}

function handleClose() {
  if (zonesChanged(tempZones.value, props.zones)) {
    emit('zone-change', tempZones.value.map(z => ({ ...z })))
  }
  emit('close')
}
</script>

<template>
  <AppModal :show size="lg" title="Échauffement en cours" min-height="75dvh" @close="handleClose">
    <ZonePicker :multiple="true" v-model="tempZones" />

    <div class="wm-modal__divider" />

    <div class="wm-modal__actions">
      <button class="wm-modal__item wm-modal__item--finish" @click="$emit('finish')">
        <AppIcon name="check" :width="20" :height="20" />
        Terminer la partie
      </button>

      <button class="wm-modal__item wm-modal__item--quit" @click="$emit('quit')">
        <AppIcon name="exit" :width="20" :height="20" />
        Quitter sans sauvegarder
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.wm-modal {
  &__divider {
    border-top: 1px solid rgba($white, 0.08);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    @include text-sm;
    padding: $padding-md;
    border-radius: $radius-md;
    transition: background 0.15s;
    text-align: left;

    &:active { background: rgba($white, 0.06); }

    &--finish { color: $accent; }
    &--quit   { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .wm-modal__item {
    @include text-md;
    padding: $padding-lg;
  }
}
</style>
