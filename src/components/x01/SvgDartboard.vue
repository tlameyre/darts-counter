<script setup>
import { ref, computed, watch } from 'vue'
import {
  BOARD_SIZE,
  BOARD_BACKGROUND_PATH,
  NUMBER_LABEL_PATHS,
  DARTBOARD_SECTORS,
  SECTOR_ORDER,
} from '../../data/dartboardSectors.js'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
  // When true (and on a touch pointer): a short tap selects the touched point,
  // a long press zooms the board in on that spot and stays zoomed so thin rings
  // can be picked. The zoomed view can't be panned — long-press again to
  // re-centre, or use the reset button.
  zoomable: { type: Boolean, default: false },
  // When true, the board grows to the largest square that fits its parent, bounded
  // by both width and height, instead of the fixed max-width. The parent must
  // establish a size container (`container-type: size`) with a constrained height.
  fill: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

const ZOOM = 3
const HOLD_MS = 250 // press held this long zooms in
const TAP_SLOP = 10 // px of travel still counts as a tap; more cancels the zoom

// Ring radii in the 453-unit board space (centre = BOARD_SIZE / 2). Matches the
// geometry baked into DARTBOARD_SECTORS / CheckoutBoardRoute.
const C = BOARD_SIZE / 2
const RING_BY_RADIUS = [
  { max: 6.9, ring: 'bull-inner' },
  { max: 16.45, ring: 'bull-outer' },
  { max: 98.45, ring: 'single-inner' },
  { max: 107.55, ring: 'triple' },
  { max: 161.45, ring: 'single-outer' },
  { max: 170.55, ring: 'double' },
]

const zoomEnabled = props.zoomable && window.matchMedia?.('(pointer: coarse)').matches

const svgEl = ref(null)
const zoomCenter = ref(null) // { x, y } in SVG coords while zoomed, else null
const zoomed = ref(false)

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const viewBox = computed(() => {
  if (!zoomCenter.value) return `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`
  const w = BOARD_SIZE / ZOOM
  const x = clamp(zoomCenter.value.x - w / 2, 0, BOARD_SIZE - w)
  const y = clamp(zoomCenter.value.y - w / 2, 0, BOARD_SIZE - w)
  return `${x} ${y} ${w} ${w}`
})

// Screen point -> point in the current (possibly zoomed) SVG coordinate space.
function clientToSvg(cx, cy) {
  const rect = svgEl.value.getBoundingClientRect()
  const [vx, vy, vw, vh] = viewBox.value.split(' ').map(Number)
  return {
    x: vx + ((cx - rect.left) / rect.width) * vw,
    y: vy + ((cy - rect.top) / rect.height) * vh,
  }
}

// Zone at a point in SVG coords, computed from board geometry (frame-accurate,
// no dependency on the rendered DOM). Returns null outside the scoring area.
function segAtSvg(x, y) {
  const dx = x - C
  const dy = y - C
  const r = Math.hypot(dx, dy)
  const band = RING_BY_RADIUS.find((b) => r <= b.max)
  if (!band) return null
  if (band.ring === 'bull-inner' || band.ring === 'bull-outer') {
    return sectors.value.find((s) => s.ring === band.ring) ?? null
  }
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (deg < 0) deg += 360
  const sector = SECTOR_ORDER[Math.round(deg / 18) % 20]
  return sectors.value.find((s) => s.ring === band.ring && s.sector === sector) ?? null
}

function segAtClient(cx, cy) {
  const p = clientToSvg(cx, cy)
  return segAtSvg(p.x, p.y)
}

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

// ─── Pointer gesture: short tap selects, long press zooms ────────────
let holdTimer = null
let downClient = null
let moved = false
let holdFired = false

function onPointerDown(e) {
  if (props.locked) return
  try { svgEl.value?.setPointerCapture(e.pointerId) } catch { /* pointer already released */ }
  downClient = { x: e.clientX, y: e.clientY }
  moved = false
  holdFired = false
  clearTimeout(holdTimer)
  if (zoomEnabled) holdTimer = setTimeout(() => zoomAt(downClient), HOLD_MS)
}

function onPointerMove(e) {
  if (!downClient || moved) return
  if (Math.hypot(e.clientX - downClient.x, e.clientY - downClient.y) > TAP_SLOP) {
    moved = true
    clearTimeout(holdTimer)
  }
}

function zoomAt(pt) {
  const p = clientToSvg(pt.x, pt.y)
  zoomCenter.value = { x: clamp(p.x, 0, BOARD_SIZE), y: clamp(p.y, 0, BOARD_SIZE) }
  zoomed.value = true
  holdFired = true
}

function onPointerUp(e) {
  clearTimeout(holdTimer)
  if (!downClient) return
  if (!holdFired && !moved) {
    const seg = segAtClient(e.clientX, e.clientY)
    if (seg) {
      flash(seg)
      emit('dart', buildDart(seg))
      resetZoom()
    }
  }
  endGesture()
}

function endGesture() {
  clearTimeout(holdTimer)
  downClient = null
  moved = false
  holdFired = false
}

function resetZoom() {
  zoomed.value = false
  zoomCenter.value = null
}

watch(() => props.locked, (v) => { if (v) { resetZoom(); endGesture() } })

const sectors = computed(() => DARTBOARD_SECTORS)
</script>

<template>
  <div class="dartboard-wrap" :class="{ 'dartboard-wrap--fill': fill }">
    <svg
      ref="svgEl"
      class="dartboard"
      :class="{ 'dartboard--locked': locked, 'dartboard--zoomable': zoomable }"
      :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="endGesture"
      @contextmenu.prevent
    >
      <path class="dartboard__bg" :d="BOARD_BACKGROUND_PATH" />
      <path v-for="seg in sectors" :key="zoneKey(seg)" class="dartboard__zone" :class="[zoneClass(seg), {
        'dartboard__zone--pressed': pressedKey === zoneKey(seg),
      }]" :d="seg.d" />
      <path v-for="(d, i) in NUMBER_LABEL_PATHS" :key="i" class="dartboard__label" :d="d" />
    </svg>
    <button v-if="zoomed" type="button" class="dartboard__reset" @click="resetZoom">
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

  // Grow to the largest square that fits the parent box (width *and* height).
  // Relies on the parent being a size container — see the `fill` prop.
  &--fill {
    width: min(100cqw, 100cqh);
    max-width: min(100cqw, 100cqh);
  }
}

.dartboard {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  touch-action: manipulation;
  user-select: none;

  &--zoomable {
    touch-action: pan-y;
  }

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
  .dartboard-wrap:not(.dartboard-wrap--fill) {
    max-width: 520px;
  }
}
</style>
