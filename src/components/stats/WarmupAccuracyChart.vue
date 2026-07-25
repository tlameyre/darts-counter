<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  // [{ key, label, color, points: [{ id, played_at, accuracy, secondaryAccuracy?, sessions: [...] }] }]
  // `points` triés par played_at ascendant ; `sessions` liste les séances brutes derrière un point
  // (plusieurs si regroupées sur un même jour).
  series: { type: Array, default: () => [] },
  // 'month' : la période affichée est un seul mois → 4 graduations JJ/MM réparties uniformément
  periodMode: { type: String, default: 'default' },
})

const emit = defineEmits(['open-session'])

const VIEW_W = 320
const VIEW_H = 160
const PAD_LEFT = 28
const PAD_RIGHT = 8
const PAD_TOP = 12
const PAD_BOTTOM = 20
const POINT_INSET = 14 // marge entre le 1er/dernier point et les bords du graphique

const activeCoord = ref(null) // { x, y } en unités du viewBox, ou null
const COINCIDENCE_TOLERANCE = 5 // points considérés "au même endroit" en dessous de cette distance

const allRawPoints = computed(() => props.series.flatMap(s => s.points))

const timestamps = computed(() => allRawPoints.value.map(p => new Date(p.played_at).getTime()))
const minTime = computed(() => Math.min(...timestamps.value))
const maxTime = computed(() => Math.max(...timestamps.value))

function xFor(time) {
  const left = PAD_LEFT + POINT_INSET
  const right = VIEW_W - PAD_RIGHT - POINT_INSET
  if (maxTime.value === minTime.value) return left + (right - left) / 2
  return left + ((time - minTime.value) / (maxTime.value - minTime.value)) * (right - left)
}

// Pas "rond" (1/2/5 × 10^n) pour ~4 graduations sur l'échelle Y
function niceStep(range) {
  const rough = range / 4
  const mag = Math.pow(10, Math.floor(Math.log10(rough || 1)))
  const norm = rough / mag
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10
  return step * mag
}

// Échelle Y auto-ajustée aux données de toutes les courbes (évite d'écraser sur un axe 0-100 fixe)
const yDomain = computed(() => {
  const values = allRawPoints.value.map(p => Number(p.accuracy))
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) { min -= 10; max += 10 }
  const pad = (max - min) * 0.15
  min = Math.max(0, min - pad)
  max = Math.min(100, max + pad)
  const step = niceStep(max - min)
  return {
    min: Math.max(0, Math.floor(min / step) * step),
    max: Math.min(100, Math.ceil(max / step) * step),
    step,
  }
})

const yTicks = computed(() => {
  const { min, max, step } = yDomain.value
  const ticks = []
  for (let v = min; v <= max + 0.001; v += step) ticks.push(Math.round(v))
  return ticks
})

function yFor(accuracy) {
  const { min, max } = yDomain.value
  const usableH = VIEW_H - PAD_TOP - PAD_BOTTOM
  const t = max === min ? 0.5 : (Number(accuracy) - min) / (max - min)
  return PAD_TOP + (1 - t) * usableH
}

function startOfMonth(time) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

function addMonths(time, n) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime()
}

// Graduations majeures : chaque début de mois visible dans la période
const monthTicks = computed(() => {
  if (props.periodMode === 'month' || allRawPoints.value.length < 2) return []
  const ticks = []
  let cur = addMonths(startOfMonth(minTime.value), 1)
  while (cur <= maxTime.value) {
    ticks.push({ time: cur, label: new Date(cur).toLocaleDateString('fr-FR', { month: 'short' }) })
    cur = addMonths(cur, 1)
  }
  return ticks
})

// Graduations mineures (sans label) : tous les quarts de mois
const quarterTicks = computed(() => {
  if (props.periodMode === 'month' || allRawPoints.value.length < 2) return []
  const ticks = []
  let monthStart = startOfMonth(minTime.value)
  while (monthStart <= maxTime.value) {
    const nextMonth = addMonths(monthStart, 1)
    const dayMs = (nextMonth - monthStart) / 4
    for (let i = 1; i <= 3; i++) {
      const t = monthStart + i * dayMs
      if (t >= minTime.value && t <= maxTime.value) ticks.push(t)
    }
    monthStart = nextMonth
  }
  return ticks
})

// Vue "Mois" : 4 graduations JJ/MM réparties uniformément sur la période affichée
const monthModeTicks = computed(() => {
  if (props.periodMode !== 'month' || allRawPoints.value.length < 2) return []
  const ticks = []
  for (let i = 0; i < 4; i++) {
    const t = minTime.value + (i / 3) * (maxTime.value - minTime.value)
    ticks.push({ time: t, label: new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) })
  }
  return ticks
})

const renderedSeries = computed(() =>
  props.series.map(s => {
    const points = s.points.map((p, i) => ({
      id: p.id ?? i,
      x: xFor(new Date(p.played_at).getTime()),
      y: yFor(p.accuracy),
      accuracy: Number(p.accuracy),
      secondaryAccuracy: p.secondaryAccuracy != null ? Number(p.secondaryAccuracy) : null,
      playedAt: p.played_at,
      sessions: p.sessions ?? [],
    }))
    return {
      key: s.key,
      label: s.label,
      color: s.color,
      points,
      polyline: points.map(p => `${p.x},${p.y}`).join(' '),
    }
  })
)

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isCoincident(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= COINCIDENCE_TOLERANCE
}

function handlePointClick(point) {
  activeCoord.value = activeCoord.value && isCoincident(activeCoord.value, point)
    ? null
    : { x: point.x, y: point.y }
}

function openSession(session) {
  activeCoord.value = null
  emit('open-session', session)
}

// Toutes les courbes ayant un point au même endroit (à la tolérance près) que le point actif
const activeGroup = computed(() => {
  if (!activeCoord.value) return []
  const group = []
  for (const s of renderedSeries.value) {
    for (const p of s.points) {
      if (isCoincident(activeCoord.value, p)) {
        group.push({ seriesKey: s.key, seriesLabel: s.label, seriesColor: s.color, point: p })
      }
    }
  }
  return group
})

// Sessions uniques du groupe actif — une session présente dans plusieurs courbes (même période
// combinant plusieurs zones) n'apparaît qu'une fois, avec une pastille de couleur par courbe.
const mergedSessionRows = computed(() => {
  const map = new Map()
  for (const g of activeGroup.value) {
    for (const sess of g.point.sessions) {
      if (!map.has(sess.id)) {
        map.set(sess.id, {
          id: sess.id,
          playedAt: sess.played_at,
          secondaryAccuracy: sess.secondaryAccuracy,
          raw: sess,
          values: [],
        })
      }
      map.get(sess.id).values.push({ color: g.seriesColor, accuracy: sess.displayAccuracy })
    }
  }
  return [...map.values()].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt))
})

function handleDocumentClick(event) {
  if (!activeCoord.value) return
  if (event.target.closest('.chart__popover, .chart__point')) return
  activeCoord.value = null
}

onMounted(() => document.addEventListener('click', handleDocumentClick, true))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick, true))
</script>

<template>
  <div class="chart">
    <div v-if="series.length > 1" class="chart__legend">
      <div v-for="s in series" :key="s.key" class="chart__legend-item">
        <span class="chart__legend-swatch" :style="{ background: s.color }" />
        {{ s.label }}
      </div>
    </div>

    <svg class="chart__svg" :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`" preserveAspectRatio="xMidYMid meet">
      <g class="chart__grid">
        <template v-for="v in yTicks" :key="v">
          <line
            :x1="PAD_LEFT" :x2="VIEW_W - PAD_RIGHT"
            :y1="yFor(v)" :y2="yFor(v)"
            class="chart__gridline"
          />
          <text :x="PAD_LEFT - 4" :y="yFor(v)" class="chart__axis-label chart__axis-label--y">{{ v }}</text>
        </template>
      </g>

      <!-- Graduations mineures : un trait tous les quarts de mois -->
      <line
        v-for="(t, i) in quarterTicks" :key="`q-${i}`"
        :x1="xFor(t)" :x2="xFor(t)"
        :y1="VIEW_H - PAD_BOTTOM" :y2="VIEW_H - PAD_BOTTOM + 3"
        class="chart__tick--minor"
      />

      <!-- Graduations majeures : chaque début de mois (vue par défaut) -->
      <g v-for="(t, i) in monthTicks" :key="`m-${i}`">
        <line :x1="xFor(t.time)" :x2="xFor(t.time)" :y1="PAD_TOP" :y2="VIEW_H - PAD_BOTTOM" class="chart__gridline--month" />
        <text :x="xFor(t.time)" :y="VIEW_H - 4" class="chart__axis-label chart__axis-label--x">{{ t.label }}</text>
      </g>

      <!-- Vue "Mois" : 4 graduations JJ/MM réparties uniformément -->
      <g v-for="(t, i) in monthModeTicks" :key="`mm-${i}`">
        <line :x1="xFor(t.time)" :x2="xFor(t.time)" :y1="PAD_TOP" :y2="VIEW_H - PAD_BOTTOM" class="chart__gridline--month" />
        <text :x="xFor(t.time)" :y="VIEW_H - 4" class="chart__axis-label chart__axis-label--x">{{ t.label }}</text>
      </g>

      <template v-for="s in renderedSeries" :key="s.key">
        <polyline v-if="s.points.length > 1" :points="s.polyline" class="chart__line" :style="{ stroke: s.color }" />

        <g v-for="p in s.points" :key="p.id">
          <circle
            :cx="p.x" :cy="p.y" r="3"
            class="chart__point"
            :class="{ 'chart__point--active': activeCoord && isCoincident(activeCoord, p) }"
            :style="{ fill: s.color }"
            @click="handlePointClick(p)"
          />
        </g>
      </template>
    </svg>

    <div
      v-if="activeGroup.length"
      class="chart__popover"
      :style="{ left: (activeCoord.x / VIEW_W * 100) + '%', top: (activeCoord.y / VIEW_H * 100) + '%' }"
    >
      <div class="chart__popover-date">{{ formatShortDate(activeGroup[0].point.playedAt) }}</div>

      <button
        v-for="row in mergedSessionRows" :key="row.id"
        class="chart__popover-row"
        @click="openSession(row.raw)"
      >
        <span class="chart__popover-time">{{ formatTime(row.playedAt) }}</span>
        <span class="chart__popover-value">
          <span class="chart__popover-dots">
            <span v-for="(v, i) in row.values" :key="i" class="chart__popover-dot" :style="{ background: v.color }" />
          </span>
          {{ row.values[0].accuracy }}%
          <span v-if="row.secondaryAccuracy !== null" class="chart__popover-secondary">
            (session : {{ row.secondaryAccuracy }}%)
          </span>
        </span>
        <AppIcon name="arrow-right" :width="14" :height="14" class="chart__popover-arrow" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart {
  position: relative;
  width: 100%;

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-sm;
    margin-bottom: $gap-xs;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include text-xxs;
    color: $muted;
  }

  &__legend-swatch {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    flex-shrink: 0;
  }

  &__svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }

  &__gridline {
    stroke: rgba($white, 0.08);
    stroke-width: 1;

    &--month {
      stroke: rgba($white, 0.06);
      stroke-width: 1;
    }
  }

  &__tick {
    &--minor {
      stroke: rgba($white, 0.2);
      stroke-width: 1;
    }
  }

  &__axis-label {
    @include text-xxs;
    fill: $muted;

    &--y {
      text-anchor: end;
      dominant-baseline: middle;
    }

    &--x {
      text-anchor: middle;
    }
  }

  &__line {
    fill: none;
    stroke: $blue;
    stroke-width: 2;
  }

  &__point {
    fill: $blue;
    stroke: $bg;
    stroke-width: 1;
    cursor: pointer;
    transition: r 0.15s;

    &--active {
      r: 6;
    }
  }

  &__popover {
    position: absolute;
    transform: translate(-50%, -100%);
    margin-top: -$gap-sm;
    background: $text-color;
    border-radius: $radius-sm;
    overflow: hidden;
    min-width: 160px;
    box-shadow: 0 4px 16px rgba($black, 0.4);
    z-index: 10;
  }

  &__popover-date {
    @include text-xxs;
    font-weight: 600;
    color: $bg;
    opacity: 0.6;
    padding: $padding-xxs $padding-sm 0;
  }

  &__popover-row {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    width: 100%;
    padding: $padding-xxs $padding-sm;
    color: $bg;
    white-space: nowrap;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__popover-time {
    @include text-xs;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__popover-value {
    @include text-xs;
    font-weight: 600;
    flex: 1;
    text-align: left;
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__popover-dots {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  &__popover-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    flex-shrink: 0;
  }

  &__popover-secondary {
    font-weight: 400;
    opacity: 0.7;
  }

  &__popover-arrow {
    flex-shrink: 0;
    opacity: 0.5;
  }
}

@media (min-width: $bp-laptop) {
  .chart {
    // Plafonne la taille réelle du SVG : au-delà, le viewBox fixe (320x160) grossit
    // proportionnellement texte/traits/hauteur — d'où le rendu "trop haut" en pleine largeur.
    max-width: 800px;
    margin: 0 auto;

    &__legend-item { @include text-xs; }
    &__popover-date { @include text-xs; }
    &__popover-time { @include text-sm; }
    &__popover-value { @include text-sm; }
  }
}
</style>
