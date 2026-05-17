<script setup>
import { computed } from 'vue'

const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const SECTOR_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const TYPES_NUM  = [
  { id: 'S', label: 'Simple' },
  { id: 'D', label: 'Double' },
  { id: 'T', label: 'Triple' },
  { id: 'A', label: 'Tout'   },
]
const TYPES_BULL = [
  { id: 'SB', label: 'Outer (25)' },
  { id: 'B',  label: 'Bull (50)'  },
]

const props = defineProps({
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const availableTypes = computed(() =>
  props.modelValue.sector === null ? TYPES_BULL : TYPES_NUM
)

function selectSector(sector) {
  let type = props.modelValue.type
  if (sector === null && !['B', 'SB'].includes(type)) type = 'B'
  if (sector !== null && !['S', 'D', 'T', 'A'].includes(type)) type = 'D'
  emit('update:modelValue', { sector, type })
}

function selectType(type) {
  emit('update:modelValue', { ...props.modelValue, type })
}

function cellStyle(n) {
  if (props.modelValue.sector === n) return { background: '#1D4ED8', color: '#fff' }
  return RED_NUMBERS.has(n)
    ? { background: '#1e1e1e', color: '#fff' }
    : { background: '#e8ddc8', color: '#111' }
}
</script>

<template>
  <div class="zone-picker">
    <div class="zone-picker__grid">
      <template v-for="row in SECTOR_ROWS" :key="row[0]">
        <button
          v-for="n in row"
          :key="n"
          class="zone-picker__cell"
          :style="cellStyle(n)"
          @click="selectSector(n)"
        >{{ n }}</button>
      </template>
    </div>

    <button
      class="zone-picker__bull"
      :class="{ 'zone-picker__bull--active': modelValue.sector === null }"
      @click="selectSector(null)"
    >BULL</button>

    <div class="zone-picker__types">
      <button
        v-for="t in availableTypes"
        :key="t.id"
        class="zone-picker__type"
        :class="{ 'zone-picker__type--active': modelValue.type === t.id }"
        @click="selectType(t.id)"
      >{{ t.label }}</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-picker {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-radius: $radius-sm;
    overflow: hidden;
    border: 1px solid $border;
  }

  &__cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-size: $title-xxs;
    border-right: 1px solid rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    transition: filter 0.1s;
    &:active { filter: brightness(1.3); }
  }

  &__bull {
    width: 100%;
    padding: $padding-xs;
    background: $dart-green;
    color: $white;
    font-family: $font-display;
    font-size: $title-xxs;
    border-radius: $radius-sm;
    transition: filter 0.1s;
    &:active { filter: brightness(1.2); }
    &--active { background: #1D4ED8; }
  }

  &__types {
    display: flex;
    gap: $gap-xs;
  }

  &__type {
    flex: 1;
    padding: $padding-xs;
    background: rgba(255, 255, 255, 0.05);
    border: 1.5px solid $border;
    border-radius: $radius-md;
    color: $muted;
    font-family: $font-body;
    font-size: $text-xs;
    font-weight: 700;
    transition: all 0.15s;
    &--active {
      background: $orange;
      border-color: $orange;
      color: $white;
    }
  }
}
</style>
