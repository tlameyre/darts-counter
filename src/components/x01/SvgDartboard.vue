<script setup>
import { ref, computed, watch } from 'vue'
import { BOARD_SIZE, BOARD_BACKGROUND_PATH, NUMBER_LABEL_PATHS, DARTBOARD_SECTORS } from '../../data/dartboardSectors.js'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
  // When true (and on a touch pointer), a first tap zooms the board in on the
  // touched area so thin rings can be aimed precisely; the next tap selects.
  zoomable: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

const ZOOM = 2.5
const zoomEnabled = props.zoomable && window.matchMedia?.('(pointer: coarse)').matches
const zoomCenter = ref(null) // { x, y } in SVG coords, or null for the full board

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const viewBox = computed(() => {
  if (!zoomCenter.value) return `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`
  const w = BOARD_SIZE / ZOOM
  const x = clamp(zoomCenter.value.x - w / 2, 0, BOARD_SIZE - w)
  const y = clamp(zoomCenter.value.y - w / 2, 0, BOARD_SIZE - w)
  return `${x} ${y} ${w} ${w}`
})

// Map a click to a point in the SVG coordinate space, accounting for the
// current (possibly zoomed) viewBox.
function toSvgPoint(event) {
  const svg = event.currentTarget.ownerSVGElement
  const rect = svg.getBoundingClientRect()
  const [vx, vy, vw, vh] = viewBox.value.split(' ').map(Number)
  return {
    x: vx + ((event.clientX - rect.left) / rect.width) * vw,
    y: vy + ((event.clientY - rect.top) / rect.height) * vh,
  }
}

watch(() => props.locked, (v) => {
  if (v) zoomCenter.value = null
})

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

function flash(seg) {
  clearTimeout(_pressTimer)
  pressedKey.value = zoneKey(seg)
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
}

function tapZone(seg, event) {
  if (props.locked) return
  if (zoomEnabled && !zoomCenter.value) {
    zoomCenter.value = toSvgPoint(event)
    return
  }
  flash(seg)
  emit('dart', buildDart(seg))
  zoomCenter.value = null
}

const sectors = computed(() => DARTBOARD_SECTORS)
</script>

<template>
  <div class="dartboard-wrap">
    <svg class="dartboard" :class="{ 'dartboard--locked': locked }" :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg">
      <path class="dartboard__bg" :d="BOARD_BACKGROUND_PATH" />
      <path v-for="seg in sectors" :key="zoneKey(seg)" class="dartboard__zone" :class="[zoneClass(seg), {
        'dartboard__zone--pressed': pressedKey === zoneKey(seg),
      }]" :d="seg.d" @click="tapZone(seg, $event)" />
      <path v-for="(d, i) in NUMBER_LABEL_PATHS" :key="i" class="dartboard__label" :d="d" />
    </svg>
    <button v-if="zoomCenter" type="button" class="dartboard__reset" @click="zoomCenter = null">
      <AppIcon name="zoom-out" :width="18" :height="18" />
      Dézoomer
    </button>
  </div>
</template>

<style lang="scss" scoped>
.dartboard-wrap {
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.dartboard {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  touch-action: manipulation;

  &--locked {
    pointer-events: none;
    opacity: 0.6;
  }
}

.dartboard__reset {
  position: absolute;
  top: $padding-xs;
  right: $padding-xs;
  display: flex;
  align-items: center;
  gap: $gap-xxs;
  padding: $padding-xxs $padding-sm;
  border: $border-sm solid $white;
  border-radius: $radius-pill;
  background: $bg;
  color: $white;
  @include text-xs;
  transition: opacity 0.15s;

  &:active { opacity: 0.6; }
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
  .dartboard-wrap {
    max-width: 520px;
  }
}
</style>
