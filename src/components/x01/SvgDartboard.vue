<script setup>
import { ref, computed } from 'vue'
import { BOARD_SIZE, BOARD_BACKGROUND_PATH, NUMBER_LABEL_PATHS, DARTBOARD_SECTORS } from '../../data/dartboardSectors.js'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

// Secteurs rouges/noirs sur la cible (doubles/triples = rouge, simple = noir)
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const pressedKey = ref(null)
let _pressTimer = null

function zoneKey(seg) {
  return `${seg.ring}-${seg.sector}`
}

function zoneClass(seg) {
  if (seg.ring === 'bull-outer') return 'dartboard__zone--bull-outer'
  if (seg.ring === 'bull-inner') return 'dartboard__zone--bull-inner'
  const isRed = RED_NUMBERS.has(seg.sector)
  if (seg.ring === 'double' || seg.ring === 'triple') {
    return isRed ? 'dartboard__zone--red' : 'dartboard__zone--green'
  }
  return isRed ? 'dartboard__zone--black' : 'dartboard__zone--cream'
}

function buildDart(seg) {
  if (seg.ring === 'bull-outer') return { type: 'bull', sector: null, pts: 25, label: 'Outer' }
  if (seg.ring === 'bull-inner') return { type: 'bull', sector: null, pts: 50, label: 'Bull' }
  if (seg.ring === 'double') return { type: 'double', sector: seg.sector, pts: seg.sector * 2, label: `D${seg.sector}` }
  if (seg.ring === 'triple') return { type: 'triple', sector: seg.sector, pts: seg.sector * 3, label: `T${seg.sector}` }
  return { type: 'single', sector: seg.sector, pts: seg.sector, label: String(seg.sector) }
}

function tapZone(seg) {
  if (props.locked) return
  clearTimeout(_pressTimer)
  pressedKey.value = zoneKey(seg)
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
  emit('dart', buildDart(seg))
}

const sectors = computed(() => DARTBOARD_SECTORS)
</script>

<template>
  <svg class="dartboard" :class="{ 'dartboard--locked': locked }" :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`"
    xmlns="http://www.w3.org/2000/svg">
    <path class="dartboard__bg" :d="BOARD_BACKGROUND_PATH" />
    <path v-for="seg in sectors" :key="zoneKey(seg)" class="dartboard__zone" :class="[zoneClass(seg), {
      'dartboard__zone--pressed': pressedKey === zoneKey(seg),
    }]" :d="seg.d" @click="tapZone(seg)" />
    <path v-for="(d, i) in NUMBER_LABEL_PATHS" :key="i" class="dartboard__label" :d="d" />
  </svg>
</template>

<style lang="scss" scoped>
.dartboard {
  display: block;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  aspect-ratio: 1;
  touch-action: manipulation;

  &--locked {
    pointer-events: none;
    opacity: 0.6;
  }
}

.dartboard__bg {
  fill: $dart-black;
}

.dartboard__zone {
  stroke: $dart-border;
  stroke-width: 1.1;
  cursor: pointer;
  transition: filter 0.1s;

  &--red { fill: $dart-red; }
  &--green { fill: $dart-green; }
  &--black { fill: $dart-black; }
  &--cream { fill: $dart-cream; }
  &--bull-outer { fill: $dart-green; }
  &--bull-inner { fill: $dart-red; }

  &--pressed {
    filter: brightness(1.45);
  }
}

.dartboard__label {
  fill: $white;
  pointer-events: none;
}

@media (min-width: $bp-laptop) {
  .dartboard {
    max-width: 520px;
  }
}
</style>
