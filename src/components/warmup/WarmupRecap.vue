<script setup>
import { formatZoneLabel } from '../../composables/useWarmup.js'

defineProps({
  zoneRecapStats: { type: Array, required: true },
  sessionStats: { type: Object, required: true },
})

const emit = defineEmits(['restart', 'home'])

function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`
}
</script>

<template>
  <div class="warmup__recap">
    <div class="warmup__recap-title">SESSION TERMINÉE</div>

    <div class="warmup__recap-zones">
      <div v-for="zs in zoneRecapStats" :key="`${zs.zone.sector}-${zs.zone.type}`" class="warmup__recap-zone-card">
        <div class="warmup__recap-zone-header">
          <span class="warmup__recap-zone-name">{{ formatZoneLabel(zs.zone) }}</span>
          <span class="warmup__recap-zone-acc" :class="`warmup__recap-zone-acc--${zs.accuracy >= 70 ? 'good' : zs.accuracy >= 40 ? 'mid' : 'low'}`">
            {{ zs.accuracy }}%
          </span>
        </div>
        <div class="warmup__recap-zone-stats">
          <div class="warmup__recap-zone-stat">
            <span class="warmup__recap-zone-stat-val">{{ fmtDuration(zs.durationMs) }}</span>
            <span class="warmup__recap-zone-stat-lbl">temps</span>
          </div>
          <div class="warmup__recap-zone-sep" />
          <div class="warmup__recap-zone-stat">
            <span class="warmup__recap-zone-stat-val">{{ zs.total }}</span>
            <span class="warmup__recap-zone-stat-lbl">jetées</span>
          </div>
          <div class="warmup__recap-zone-sep" />
          <div class="warmup__recap-zone-stat">
            <span class="warmup__recap-zone-stat-val">{{ zs.hits }}</span>
            <span class="warmup__recap-zone-stat-lbl">touches</span>
          </div>
        </div>
      </div>
    </div>

    <div class="warmup__recap-total">
      <div class="warmup__recap-total-title">SESSION TOTALE</div>
      <div class="warmup__recap-stats">
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ sessionStats.total }}</span>
          <span class="warmup__recap-stat-lbl">fléchettes</span>
        </div>
        <div class="warmup__recap-sep" />
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ sessionStats.hits }}</span>
          <span class="warmup__recap-stat-lbl">touches</span>
        </div>
        <div class="warmup__recap-sep" />
        <div class="warmup__recap-stat">
          <span class="warmup__recap-stat-val">{{ sessionStats.accuracy }}%</span>
          <span class="warmup__recap-stat-lbl">précision</span>
        </div>
      </div>
    </div>

    <div class="warmup__recap-actions">
      <button class="warmup__recap-btn warmup__recap-btn--primary" @click="emit('restart')">Recommencer</button>
      <button class="warmup__recap-btn warmup__recap-btn--secondary" @click="emit('home')">Accueil</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warmup__recap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  padding-bottom: $padding-md;

  &-title {
    font-family: $font-display;
    font-size: $title-xs;
    letter-spacing: 2px;
    color: $muted;
    text-align: center;
    flex-shrink: 0;
  }

  &-zones {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &-zone-card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &-zone-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-zone-name {
    font-family: $font-display;
    font-size: $title-xxs;
    color: $text-color;
    letter-spacing: 1px;
  }

  &-zone-acc {
    font-family: $font-display;
    font-size: $title-xs;
    font-variant-numeric: tabular-nums;
    &--good { color: $accent; }
    &--mid  { color: $orange; }
    &--low  { color: $error; }
  }

  &-zone-stats {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &-zone-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    &-val {
      font-family: $font-display;
      font-size: $title-xxs;
      color: $text-color;
      font-variant-numeric: tabular-nums;
    }
    &-lbl {
      font-size: $text-xxs;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  &-zone-sep {
    width: 1px;
    height: 28px;
    background: $border;
  }

  &-total {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;

    &-title {
      font-size: $text-xs;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: $muted;
      font-weight: 700;
    }
  }

  &-stats {
    display: flex;
    align-items: center;
    gap: $padding-md;
    justify-content: space-around;
  }

  &-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    &-val {
      font-family: $font-display;
      font-size: $title-xs;
      color: $text-color;
      font-variant-numeric: tabular-nums;
    }
    &-lbl {
      font-size: $text-xxs;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  &-sep {
    width: 1px;
    height: 36px;
    background: $border;
  }

  &-actions {
    display: flex;
    gap: $padding-xs;
    flex-shrink: 0;
    margin-top: auto;
  }

  &-btn {
    flex: 1;
    border-radius: $radius-pill;
    font-size: $text-sm;
    font-weight: 700;
    padding: $padding-sm;
    transition: transform 0.1s, opacity 0.15s;
    &:active { transform: scale(0.97); opacity: 0.85; }
    &--primary   { background: #1D4ED8; color: $white; }
    &--secondary { background: $surface; border: 1px solid $border; color: $muted; }
  }
}
</style>
