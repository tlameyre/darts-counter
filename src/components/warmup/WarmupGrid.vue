<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const TABS = [
  { id: 'single', label: 'S', multiplier: 1 },
  { id: 'double', label: 'D', multiplier: 2 },
  { id: 'triple', label: 'T', multiplier: 3 },
]

const GRID_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const activeTab = ref('single')
const pressedKey = ref(null)
let _pressTimer = null

const currentMultiplier = computed(
  () => TABS.find(t => t.id === activeTab.value)?.multiplier ?? 1
)

function cellStyle(sector) {
  if (activeTab.value === 'single') {
    return RED_NUMBERS.has(sector)
      ? { background: '#000000', color: '#ffffff' }
      : { background: '#f0e8d0', color: '#111111' }
  }
  return RED_NUMBERS.has(sector)
    ? { background: '#B21327', color: '#ffffff' }
    : { background: '#36cc86', color: '#ffffff' }
}

function flash(key) {
  clearTimeout(_pressTimer)
  pressedKey.value = key
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
}

function tapSector(sector) {
  if (props.locked) return
  const tab = TABS.find(t => t.id === activeTab.value)
  flash(`s-${sector}`)
  emit('dart', {
    type: tab.id,
    sector,
    pts: sector * tab.multiplier,
    label: tab.id === 'single' ? String(sector) : `${tab.id === 'double' ? 'D' : 'T'}${sector}`,
  })
}

function tapBull() {
  if (props.locked) return
  flash('bull')
  emit('dart', { type: 'bull', sector: null, pts: 50, label: 'Bull' })
}

function tapOuter() {
  if (props.locked) return
  flash('outer')
  emit('dart', { type: 'bull', sector: null, pts: 25, label: 'Outer' })
}
</script>

<template>
  <div class="warmup__grid">
    <button v-for="tab in TABS" :key="tab.id" class="warmup__gtab"
      :class="{ 'warmup__gtab--active': activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
    <button class="warmup__gtab warmup__gtab--sb" :class="{ 'warmup__gtab--pressed': pressedKey === 'outer' }"
      @click="tapOuter">SB</button>
    <button class="warmup__gtab warmup__gtab--b" :class="{ 'warmup__gtab--pressed': pressedKey === 'bull' }"
      @click="tapBull">B</button>
    <template v-for="row in GRID_ROWS" :key="row[0]">
      <button v-for="n in row" :key="n" class="warmup__cell" :style="cellStyle(n)"
        :class="{ 'warmup__cell--pressed': pressedKey === `s-${n}` }" @click="tapSector(n)">
        <span class="warmup__cell-num">{{ n }}</span>
        <span v-if="activeTab !== 'single'" class="warmup__cell-pts">{{ n * currentMultiplier }}</span>
      </button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.warmup__gtab {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-display;
  font-size: $title-xxs;
  font-weight: 700;
  color: $muted;
  border-right: 1px solid $border;
  transition: background 0.12s, color 0.12s, filter 0.1s;

  &:last-child { border-right: none; }

  &--active {
    color: $white;
    background: rgba(255, 255, 255, 0.12);
  }

  &--sb { background: $dart-green; color: $white; }
  &--b  { background: $dart-red;   color: $white; }
  &--pressed { filter: brightness(1.35); }
}

.warmup__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-self: start;
  width: 100%;
}

.warmup__cell {
  aspect-ratio: 1;
  display: flex;
  gap: $gap-xxs;
  align-items: center;
  justify-content: center;
  border-right: 2px solid $border;
  border-bottom: 2px solid $border;
  transition: filter 0.1s, transform 0.1s;

  &--pressed {
    filter: brightness(1.45);
    transform: scale(0.93);
  }

  &-num {
    font-family: $font-display;
    font-size: $title-sm;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &-pts {
    font-family: $font-display;
    font-size: $text-xs;
    opacity: .8;
  }
}
</style>
