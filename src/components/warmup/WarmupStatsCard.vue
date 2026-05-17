<script setup>
import { formatZoneLabel } from '../../composables/useWarmup.js'

defineProps({
  zone: { type: Object, required: true },
  stats: { type: Object, required: true },
})
</script>

<template>
  <div class="stats-card">
    <div class="stats-card__zone">{{ formatZoneLabel(zone) }}</div>
    <div class="stats-card__rows">
      <div class="stats-card__row">
        <span class="stats-card__lbl">Fléchettes jetées</span>
        <span class="stats-card__val">{{ stats.total }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__lbl">Fléchettes touchées</span>
        <span class="stats-card__val">{{ stats.hits }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__lbl">Taux de réussite</span>
        <span class="stats-card__val">{{ stats.accuracy }}%</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-card {
  background: #1D4ED8;
  border-radius: $radius-lg;
  padding: $padding-md;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  flex-shrink: 0;
  flex: 1;

  &__zone {
    font-family: $font-display;
    font-size: $title-xl;
    color: $white;
    line-height: 1;
    text-align: center;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__lbl {
    font-size: $text-md;
    color: rgba(255, 255, 255, 0.75);
  }

  &__val {
    font-size: $text-md;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
  }
}
</style>
