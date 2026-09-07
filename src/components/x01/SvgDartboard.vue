<script setup>
import { ref, computed, watch } from 'vue'
import {
  BOARD_SIZE,
  BOARD_BACKGROUND_PATH,
  NUMBER_LABEL_PATHS,
  DARTBOARD_SECTORS,
  SECTOR_ORDER,
} from '../../data/dartboardSectors.js'

const props = defineProps({
  locked: { type: Boolean, default: false },
  // When true (and on a touch pointer), a quick tap enters the dart directly at
  // the touched point, while pressing or dragging zooms the board in under the
  // finger with a crosshair + live label so thin rings can be aimed precisely.
  zoomable: { type: Boolean, default: false },
  // When true, the board grows to the largest square that fits its parent, bounded
  // by both width and height, instead of the fixed max-width. The parent must
  // establish a size container (`container-type: size`) with a constrained height.
  fill: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

const ZOOM = 3
const AIM_OFFSET = 26 // px, lifts the aim point above the fingertip
const MOVE_THRESHOLD = 12 // px of travel before a press becomes an aim gesture
const HOLD_MS = 220 // stationary press that long also starts aiming
const AIM_GAIN = 0.35 // crosshair moves this fraction of the finger travel while aiming

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
const zoomCenter = ref(null) // { x, y } in SVG coords while aiming, else null
const aimPoint = ref(null) // crosshair position in SVG coords
const aiming = ref(false)
const heldSeg = ref(null) // last valid zone under the aim point

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

// px per SVG unit at the current zoom.
function pxPerUnit() {
  const [, , vw] = viewBox.value.split(' ').map(Number)
  return svgEl.value.getBoundingClientRect().width / vw
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

// ─── Pointer gesture: tap = enter, press/drag = zoomed aim ───────────
let holdTimer = null
let startClient = null
let lastClient = null
let aimAnchorClient = null // finger screen pos when aiming started
let aimAnchorSvg = null // board point under the anchor (full-board frame)

function onPointerDown(e) {
  if (props.locked) return
  try { svgEl.value?.setPointerCapture(e.pointerId) } catch { /* pointer already released */ }
  startClient = { x: e.clientX, y: e.clientY }
  lastClient = { ...startClient }
  clearTimeout(holdTimer)
  if (zoomEnabled) holdTimer = setTimeout(enterAim, HOLD_MS)
}

function onPointerMove(e) {
  if (!startClient) return
  lastClient = { x: e.clientX, y: e.clientY }
  if (aiming.value) return updateAim()
  if (zoomEnabled && Math.hypot(e.clientX - startClient.x, e.clientY - startClient.y) > MOVE_THRESHOLD) {
    enterAim()
  }
}

function enterAim() {
  clearTimeout(holdTimer)
  if (!zoomEnabled || aiming.value || !startClient) return
  aiming.value = true
  aimAnchorClient = { x: lastClient.x, y: lastClient.y }
  aimAnchorSvg = clientToSvg(lastClient.x, lastClient.y - AIM_OFFSET)
  aimPoint.value = { ...aimAnchorSvg }
  zoomCenter.value = { ...aimAnchorSvg }
  refreshHeld()
}

// The crosshair tracks finger travel at reduced gain, so a large finger move is
// a small, controllable aim adjustment. The board stays put and only pans once
// the crosshair nears the visible edge.
function updateAim() {
  if (!aimAnchorClient) return
  const k = AIM_GAIN / pxPerUnit()
  const p = {
    x: clamp(aimAnchorSvg.x + (lastClient.x - aimAnchorClient.x) * k, 0, BOARD_SIZE),
    y: clamp(aimAnchorSvg.y + (lastClient.y - aimAnchorClient.y) * k, 0, BOARD_SIZE),
  }
  aimPoint.value = p

  const half = BOARD_SIZE / ZOOM / 2
  const keep = half * 0.72 // pan to keep the crosshair within this radius of centre
  const zc = { ...zoomCenter.value }
  for (const ax of ['x', 'y']) {
    const d = p[ax] - zc[ax]
    if (d > keep) zc[ax] += d - keep
    else if (d < -keep) zc[ax] += d + keep
  }
  zoomCenter.value = zc
  refreshHeld()
}

function refreshHeld() {
  const seg = segAtSvg(aimPoint.value.x, aimPoint.value.y)
  if (seg) heldSeg.value = seg
}

function onPointerUp(e) {
  clearTimeout(holdTimer)
  if (!startClient) return
  const travel = Math.hypot(e.clientX - startClient.x, e.clientY - startClient.y)
  const seg = aiming.value
    ? heldSeg.value
    : (travel <= MOVE_THRESHOLD ? segAtClient(e.clientX, e.clientY) : null)
  if (seg) {
    flash(seg)
    emit('dart', buildDart(seg))
  }
  reset()
}

function reset() {
  clearTimeout(holdTimer)
  aiming.value = false
  zoomCenter.value = null
  aimPoint.value = null
  heldSeg.value = null
  startClient = null
  lastClient = null
  aimAnchorClient = null
  aimAnchorSvg = null
}

watch(() => props.locked, (v) => { if (v) reset() })

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
      @pointercancel="reset"
    >
      <path class="dartboard__bg" :d="BOARD_BACKGROUND_PATH" />
      <path v-for="seg in sectors" :key="zoneKey(seg)" class="dartboard__zone" :class="[zoneClass(seg), {
        'dartboard__zone--pressed': pressedKey === zoneKey(seg),
      }]" :d="seg.d" />
      <path v-for="(d, i) in NUMBER_LABEL_PATHS" :key="i" class="dartboard__label" :d="d" />
      <g v-if="aiming && aimPoint" class="dartboard__crosshair"
        :transform="`translate(${aimPoint.x} ${aimPoint.y})`">
        <circle r="9" />
        <line x1="-15" y1="0" x2="15" y2="0" />
        <line x1="0" y1="-15" x2="0" y2="15" />
      </g>
    </svg>
    <div v-if="aiming" class="dartboard__aim-label">{{ heldSeg ? buildDart(heldSeg).label : '—' }}</div>
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
    touch-action: none;
  }

  &--locked {
    pointer-events: none;
    opacity: 0.6;
  }
}

.dartboard__crosshair {
  pointer-events: none;
  fill: none;
  stroke: $white;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;

  circle {
    fill: rgba($white, 0.14);
  }
}

.dartboard__aim-label {
  position: absolute;
  top: $padding-xs;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  padding: $padding-xxs $padding-sm;
  border: $border-sm solid $white;
  border-radius: $radius-pill;
  background: $bg;
  color: $white;
  @include title-sm;
  font-variant-numeric: tabular-nums;
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
