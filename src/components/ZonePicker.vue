<script setup>
import { computed } from 'vue'
import AppButton from './AppButton.vue'

const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const SECTOR_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const TYPES = [
  { id: 'A', label: 'Tout' },
  { id: 'S', label: 'Simple' },
  { id: 'D', label: 'Double' },
  { id: 'T', label: 'Triple' },
]

const props = defineProps({
  modelValue: { required: true },
  multiple:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function isBull(zone) {
  return zone?.sector === null
}

// Le bull stocke son type en AB/SB/B (legacy, pas de triple) — on le traduit
// vers le référentiel générique A/S/D partagé avec les secteurs numériques.
function genericType(zone) {
  if (!zone) return 'A'
  if (isBull(zone)) {
    if (zone.type === 'B') return 'D'
    if (zone.type === 'SB') return 'S'
    return 'A'
  }
  return zone.type
}

function bullType(generic) {
  if (generic === 'S') return 'SB'
  if (generic === 'D') return 'B'
  return 'AB'
}

const isBullSelected = computed(() =>
  props.multiple ? props.modelValue.some(isBull) : isBull(props.modelValue)
)

function selectSector(sector) {
  if (!props.multiple) {
    const generic = genericType(props.modelValue)
    emit('update:modelValue', { sector, type: sector === null ? bullType(generic) : generic })
    return
  }
  const idx = props.modelValue.findIndex(z => z.sector === sector)
  if (idx >= 0) {
    if (props.modelValue.length > 1) emit('update:modelValue', props.modelValue.filter((_, i) => i !== idx))
    return
  }
  if (props.modelValue.length >= 5) return
  const generic = genericType(props.modelValue[0])
  emit('update:modelValue', [...props.modelValue, { sector, type: sector === null ? bullType(generic) : generic }])
}

function selectType(type) {
  if (!props.multiple) {
    emit('update:modelValue', { ...props.modelValue, type: isBull(props.modelValue) ? bullType(type) : type })
  } else {
    emit('update:modelValue', props.modelValue.map(z => ({ ...z, type: isBull(z) ? bullType(type) : type })))
  }
}

function cellSelected(n) {
  if (!props.multiple) return props.modelValue.sector === n
  return props.modelValue.some(z => z.sector === n)
}

function activeType() {
  if (!props.multiple) return genericType(props.modelValue)
  return genericType(props.modelValue[0])
}
</script>

<template>
  <div class="zone-picker">
    <div class="zone-picker__types">
      <AppButton v-for="t in TYPES" :key="t.id" size="small" variant="ghost" :active="activeType() === t.id"
        :disabled="t.id === 'T' && isBullSelected" @click="selectType(t.id)">{{ t.label }}</AppButton>
    </div>

    <div class="zone-picker__grid">
      <template v-for="row in SECTOR_ROWS" :key="row[0]">
        <button v-for="n in row" :key="n" class="zone-picker__cell"
          :class="{ 'zone-picker__cell--selected': cellSelected(n) }" @click="selectSector(n)">{{ n }}</button>
      </template>
      <button class="zone-picker__cell zone-picker__cell--bull"
        :class="{ 'zone-picker__cell--selected': cellSelected(null) }" @click="selectSector(null)">
        BULL
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-picker {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  flex: 1;

  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-radius: $radius-sm;
    overflow: hidden;
    border: $border-md solid $white;
    flex: 1;
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xl;
    background: $bg;
    color: $white;
    border-right: $border-md solid $white;
    border-bottom: $border-md solid $white;
    transition: filter 0.1s;

    &:nth-child(5n) {
      border-right: none;
    }

    &:active {
      filter: brightness(1.3);
    }

    &--selected {
      background: $blue;
    }

    &--bull {
      grid-column: 1 / -1;
      aspect-ratio: unset;
      padding: $padding-sm;
      @include title-lg;
      border-right: none;
      border-bottom: none;
    }
  }

  &__types {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) {
      flex: 1;
    }
  }
}

@media (min-width: $bp-tablet) {
  .zone-picker {
    flex: 1;

    &__grid {
      flex: 1;
    }

    &__cell {
      @include title-xxl;
      aspect-ratio: inherit
    }

    &__cell--bull {
      padding: 0;
      @include title-xl;
    }
  }
}
</style>
