<script setup>
import { ref } from 'vue'
import DartSlotsBar from './DartSlotsBar.vue'
import SectorGrid from './SectorGrid.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import NumPad from '../NumPad.vue'
import GameBottomBar from './GameBottomBar.vue'

const props = defineProps({
  darts:      { type: Array,   required: true },
  valueKey:   { type: String,  default: 'label' },
  bust:       { type: Boolean, default: false },
  locked:     { type: Boolean, default: false },
  toggleable: { type: Boolean, default: false },
})

const emit = defineEmits(['dart', 'miss', 'bust', 'validate', 'undo'])

const mode = ref('volley')
const volleyStr = ref('')

function selectMode(newMode) {
  if (props.locked || props.bust) return
  mode.value = newMode
  volleyStr.value = ''
}

function appendDigit(d) {
  if (volleyStr.value.length >= 3) return
  const next = volleyStr.value + d
  if (Number(next) > 180) return
  volleyStr.value = next
}

function deleteDigit() {
  volleyStr.value = volleyStr.value.slice(0, -1)
}

function submitVolley() {
  if (!volleyStr.value) return
  emit('validate', Number(volleyStr.value))
  volleyStr.value = ''
}

function handleUndo() {
  if (mode.value === 'volley' && volleyStr.value.length > 0) {
    deleteDigit()
  } else {
    emit('undo')
  }
}
</script>

<template>
  <div class="game-input">
    <DartSlotsBar
      :mode="mode"
      :darts="darts"
      :value-key="valueKey"
      :value="volleyStr"
      :bust="bust"
      :toggleable="toggleable"
      @select="selectMode"
      @validate="submitVolley"
    />

    <SectorGrid v-if="mode === 'dart'" :locked="locked || bust" @dart="$emit('dart', $event)" />

    <SvgDartboard v-else-if="mode === 'board'" class="game-input__dartboard" :locked="locked || bust" @dart="$emit('dart', $event)" />

    <NumPad v-else class="game-input__numpad" @digit="appendDigit" @delete="deleteDigit" @validate="submitVolley" />

    <GameBottomBar
      :bust-mode="mode === 'volley'"
      :locked="locked"
      @undo="handleUndo"
      @miss="$emit('miss')"
      @bust="$emit('bust')"
    >
      <template #right>
        <slot name="right" />
      </template>
    </GameBottomBar>
  </div>
</template>

<style lang="scss" scoped>
.game-input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__numpad {
    min-height: 0;
    border-top: $border-md solid $white;
  }

  &__dartboard {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>