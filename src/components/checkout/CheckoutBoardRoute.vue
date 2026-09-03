<script setup>
import { computed } from 'vue'
import {
  BOARD_SIZE,
  BOARD_BACKGROUND_PATH,
  NUMBER_LABEL_PATHS,
  DARTBOARD_SECTORS,
  SECTOR_ORDER,
} from '../../data/dartboardSectors.js'

const props = defineProps({
  route: { type: Array, default: () => [] }, // Dart[] { type, sector, pts, label }
})

const C = BOARD_SIZE / 2

// Rayons des bandes visibles (cf. géométrie de dartboardSectors.js)
const BAND = {
  double: [161.45, 170.55],
  'single-outer': [107.55, 161.45],
  triple: [98.45, 107.55],
  'single-inner': [16.45, 98.45],
  'bull-outer': [6.9, 16.45],
  'bull-inner': [0, 6.9],
}

// Mêmes couleurs que SvgDartboard.vue
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

function zoneKey(seg) {
  return `${seg.ring}-${seg.sector}`
}

function zoneClass(seg) {
  if (seg.ring === 'bull-outer') return 'board__zone--bull-outer'
  if (seg.ring === 'bull-inner') return 'board__zone--bull-inner'
  const isRed = RED_NUMBERS.has(seg.sector)
  if (seg.ring === 'double' || seg.ring === 'triple') {
    return isRed ? 'board__zone--red' : 'board__zone--green'
  }
  return isRed ? 'board__zone--black' : 'board__zone--cream'
}

// Fléchette -> ring visé (single = grande bande externe)
function ringOf(dart) {
  if (dart.type === 'double') return 'double'
  if (dart.type === 'triple') return 'triple'
  if (dart.type === 'bull') return dart.pts === 50 ? 'bull-inner' : 'bull-outer'
  return 'single-outer'
}

const polar = (a, r) => ({ x: C + r * Math.sin(a), y: C - r * Math.cos(a) })

// Chemin d'une bande annulaire (secteur i, ring)
function bandPath(sector, ring) {
  const [rIn, rOut] = BAND[ring]
  if (sector == null) {
    // bull : cercle plein (inner) ou anneau approché par un disque
    return `M ${C - rOut} ${C} A ${rOut} ${rOut} 0 1 0 ${C + rOut} ${C} A ${rOut} ${rOut} 0 1 0 ${C - rOut} ${C} Z`
  }
  const i = SECTOR_ORDER.indexOf(sector)
  const a1 = ((i * 18 - 9) * Math.PI) / 180
  const a2 = ((i * 18 + 9) * Math.PI) / 180
  const p1 = polar(a1, rOut)
  const p2 = polar(a2, rOut)
  const p3 = polar(a2, rIn)
  const p4 = polar(a1, rIn)
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 0 0 ${p4.x} ${p4.y} Z`
}

function badgeCenter(sector, ring) {
  if (sector == null) return { x: C, y: C }
  const [rIn, rOut] = BAND[ring]
  return polar((SECTOR_ORDER.indexOf(sector) * 18 * Math.PI) / 180, (rIn + rOut) / 2)
}

function dartTarget(dart) {
  const ring = ringOf(dart)
  const sector = dart.type === 'bull' ? null : dart.sector
  return { ring, sector, key: `${ring}:${sector}` }
}

// Fléchettes regroupées par zone : deux fléchettes au même endroit -> une seule pastille "1·2".
const marks = computed(() => {
  const groups = new Map()
  props.route.forEach((dart, i) => {
    const t = dartTarget(dart)
    if (!groups.has(t.key)) {
      groups.set(t.key, {
        key: t.key,
        path: bandPath(t.sector, t.ring),
        ...badgeCenter(t.sector, t.ring),
        orders: [],
      })
    }
    groups.get(t.key).orders.push(i + 1)
  })
  return [...groups.values()].map((g) => ({ ...g, label: g.orders.join(' - ') }))
})

const linePoints = computed(() => {
  if (props.route.length < 2) return null
  return props.route
    .map((dart) => {
      const t = dartTarget(dart)
      const c = badgeCenter(t.sector, t.ring)
      return `${c.x},${c.y}`
    })
    .join(' ')
})

const badgeW = (label) => 34 + Math.max(0, label.length - 1) * 7
</script>

<template>
  <svg class="board" :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`" xmlns="http://www.w3.org/2000/svg">
    <path class="board__bg" :d="BOARD_BACKGROUND_PATH" />
    <path
      v-for="seg in DARTBOARD_SECTORS"
      :key="zoneKey(seg)"
      class="board__zone"
      :class="zoneClass(seg)"
      :d="seg.d"
    />

    <circle v-if="marks.length" class="board__dim" :cx="C" :cy="C" r="212" />

    <path v-for="m in marks" :key="`hl-${m.key}`" class="board__target" :d="m.path" />
    <polyline v-if="linePoints" class="board__link" :points="linePoints" />

    <path v-for="(d, i) in NUMBER_LABEL_PATHS" :key="i" class="board__label" :d="d" />

    <g v-for="m in marks" :key="`badge-${m.key}`" class="board__badge">
      <rect
        :x="m.x - badgeW(m.label) / 2"
        :y="m.y - 15"
        :width="badgeW(m.label)"
        height="30"
        rx="15"
      />
      <text :x="m.x" :y="m.y">{{ m.label }}</text>
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.board {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  aspect-ratio: 1;
}

@media (min-width: $bp-laptop) {
  .board { max-width: 440px; }
}

.board__bg { fill: $dart-black; }

.board__zone {
  stroke: $dart-border;
  stroke-width: 1.1;

  &--red { fill: $dart-red; }
  &--green { fill: $dart-green; }
  &--black { fill: $dart-black; }
  &--cream { fill: $dart-cream; }
  &--bull-outer { fill: $dart-green; }
  &--bull-inner { fill: $dart-red; }
}

.board__label {
  fill: $white;
  pointer-events: none;
}

.board__dim {
  fill: rgba(#000, 0.42);
  pointer-events: none;
}

.board__target {
  fill: rgba($accent, 0.5);
  stroke: $accent;
  stroke-width: 4;
  stroke-linejoin: round;
  paint-order: stroke;
}

.board__link {
  fill: none;
  stroke: $white;
  stroke-width: 3.5;
  stroke-dasharray: 3 8;
  stroke-linecap: round;
}

.board__badge {
  rect {
    fill: $accent;
    stroke: $white;
    stroke-width: 2.5;
  }

  text {
    fill: $white;
    font-weight: 700;
    font-size: 19px;
    text-anchor: middle;
    dominant-baseline: central;
  }
}
</style>
