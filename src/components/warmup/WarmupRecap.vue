<script setup>
import { computed } from 'vue'
import { formatZonesLabel } from '../../composables/useWarmup.js'
import AppButton from '../AppButton.vue'

const props = defineProps({
  zoneRecapStats: { type: Array,    required: true },
  sessionStats:   { type: Object,   required: true },
  hideActions:    { type: Boolean,  default: false },
})

const emit = defineEmits(['restart', 'home'])

// Même logique de couleurs que DartChip
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

function cardStyle(zones) {
  if (zones.length > 1) {
    return { '--card-bg': 'rgba(255,255,255,0.07)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'var(--text-color)' }
  }
  const zone = zones[0]

  if (zone.type === 'AB') {
    return { '--card-bg': '#000000', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'var(--text-color)' }
  }

  if (zone.type === 'A') {
    return RED_NUMBERS.has(zone.sector)
      ? { '--card-bg': 'var(--dart-black)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'var(--text-color)' }
      : { '--card-bg': 'var(--dart-cream)', '--card-text': 'var(--dart-cream-text)', '--card-muted': 'rgba(0,0,0,0.4)', '--card-sep': 'rgba(0,0,0,0.5)' }
  }

  if (zone.sector === null) {
    const bg = zone.type === 'B' ? 'var(--dart-red)' : 'var(--dart-green)'
    return { '--card-bg': bg, '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.7)', '--card-sep': 'var(--text-color)' }
  }

  const isRed = RED_NUMBERS.has(zone.sector)

  if (zone.type === 'S') {
    return isRed
      ? { '--card-bg': 'var(--dart-black)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'var(--text-color)' }
      : { '--card-bg': 'var(--dart-cream)', '--card-text': 'var(--dart-cream-text)', '--card-muted': 'rgba(0,0,0,0.4)', '--card-sep': 'rgba(0,0,0,0.5)' }
  }

  return isRed
    ? { '--card-bg': 'var(--dart-red)',   '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.7)', '--card-sep': 'var(--text-color)' }
    : { '--card-bg': 'var(--dart-green)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.7)', '--card-sep': 'var(--text-color)' }
}

function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m} min ${sec}s` : `${sec}s`
}

function zoneLabel(zones) {
  return formatZonesLabel(zones)
}

const totalDurationMs = computed(() =>
  props.zoneRecapStats.reduce((sum, zs) => sum + zs.durationMs, 0)
)
</script>

<template>
  <div class="recap">
    <!-- Titre -->
    <h1 class="recap__title">RECAP PAR ZONES</h1>

    <!-- Cards par zone -->
    <div class="recap__zones">
      <div v-for="zs in zoneRecapStats" :key="JSON.stringify(zs.zones)" class="recap__zone-card"
        :style="cardStyle(zs.zones)">
        <div class="recap__zone-header">
          <span class="recap__zone-name">Zone travaillée : {{ zoneLabel(zs.zones) }}</span>
          <span class="recap__zone-acc">{{ zs.accuracy }}%</span>
        </div>

        <div class="recap__zone-stats">
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ fmtDuration(zs.durationMs) }}</span>
            <span class="recap__zone-stat-lbl">Temps</span>
          </div>
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ zs.total }}</span>
            <span class="recap__zone-stat-lbl">Jetées</span>
          </div>
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ zs.hits }}</span>
            <span class="recap__zone-stat-lbl">Touchées</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Total session -->
    <div class="recap__total">
      <div class="recap__total-title">TOTAL DE SESSION</div>
      <div class="recap__total-grid">
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ fmtDuration(totalDurationMs) }}</span>
          <span class="recap__total-lbl">Temps</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.total }}</span>
          <span class="recap__total-lbl">Jetées</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.hits }}</span>
          <span class="recap__total-lbl">Touchées</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.accuracy }}%</span>
          <span class="recap__total-lbl">Précision</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!hideActions" class="recap__actions">
      <AppButton @click="emit('restart')">Recommencer</AppButton>
      <AppButton variant="secondary" @click="emit('home')">Accueil</AppButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  padding-bottom: $padding-md;

  &__title {
    @include title-xxl;
    color: $white;
    text-align: center;
    flex-shrink: 0;
  }

  // ── Zone cards ──────────────────────────────────
  &__zones {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  &__zone-card {
    background: var(--card-bg);
    border-radius: $radius-sm;
    padding: $padding-sm;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    border: $border-md solid $white;
    height: min-content;
  }

  &__zone-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__zone-name {
    @include title-lg;
    color: var(--card-text);
  }

  &__zone-acc {
    @include title-xl;
    color: var(--card-text);
    font-variant-numeric: tabular-nums;
  }

  &__zone-stats {
    display: flex;
    align-items: center;
  }

  &__zone-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 $padding-xs;
    height: 100%;
    justify-content: center;

    &:first-child { padding-left: 0; }
    &:last-child  { padding-right: 0; }


    &-val {
      @include title-lg;
      color: var(--card-text);
      font-variant-numeric: tabular-nums;
      text-align: center
    }

    &-lbl {
      @include text-sm;
      color: var(--card-text);
    }

    &:not(:last-child) {
      border-right: $border-md solid var(--card-sep);
    }
  }

  // ── Total session ────────────────────────────────
  &__total {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__total-title {
    @include title-xl;
    color: $white;
    text-align: center;
  }

  &__total-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    > :nth-child(odd) {
      border-right: $border-md solid $white;
    }

    > :nth-child(-n+2) {
      border-bottom: $border-md solid $white;
    }
  }

  &__total-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-md;
  }

  &__total-val {
    @include title-xl;
    color: $white;
    font-variant-numeric: tabular-nums;
    text-align: center
  }

  &__total-lbl {
    @include text-sm;
    color: $white;
  }

  // ── Boutons ──────────────────────────────────────
  &__actions {
    display: flex;
    gap: $gap-md;
    width: 100%;

    :deep(.btn) { flex: 1; }
  }
}

@media (min-width: $bp-laptop) {
  .recap {
    &__title         { @include display-xs; }
    &__zone-card     { padding: $padding-md; gap: $gap-sm; }
    &__zone-name     { @include title-xl; }
    &__zone-acc      { @include title-xxl; }
    &__zone-stat-val { @include title-xl; }
    &__zone-stat-lbl { @include text-md; }
    &__zone-sep      { height: 48px; }
    &__total-title   { @include title-xxl; }
    &__total-cell    { padding: $padding-lg; }
    &__total-val     { @include title-xxl; }
    &__total-lbl     { @include text-md; }
  }
}
</style>
