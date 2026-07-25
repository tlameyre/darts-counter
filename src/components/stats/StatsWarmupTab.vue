<script setup>
import StatCell from '../StatCell.vue'
import AppIcon from '../AppIcon.vue'
import { formatZoneLabel, formatZonesLabel } from '../../composables/useWarmup.js'

const props = defineProps({
  summary:  { type: Object, default: null },
  sessions: { type: Array,  default: () => [] },
})

const emit = defineEmits(['open-detail', 'open-chart'])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function zoneCount(s) {
  return s.settings?.zoneRecap?.length ?? 1
}

function zoneNames(s) {
  if (s.settings?.zoneRecap?.length) {
    return s.settings.zoneRecap.map(z =>
      z.zones ? formatZonesLabel(z.zones) : formatZoneLabel(z.zone)
    ).join(', ')
  }
  return s.zone ?? '—'
}
</script>

<template>
  <section v-if="summary" class="tab__card tab__card--shrink">
    <div class="tab__section-header">
      <h2 class="tab__section-title">Résumé</h2>
      <button class="tab__detail-btn" @click="emit('open-chart')">
        Voir le détail
        <AppIcon name="arrow-right" :width="16" :height="16" />
      </button>
    </div>
    <div class="tab__grid">
      <StatCell :value="summary.sessions" label="Sessions" />
      <StatCell :value="summary.totalDarts" label="Fléchettes jetées" />
      <StatCell :value="summary.avgAccuracy + '%'" label="Précision" />
    </div>
  </section>

  <section v-if="sessions.length" class="tab__card tab__card--grow">
    <h2 class="tab__section-title">Historique</h2>
    <ul class="tab__history">
      <li v-for="s in sessions" :key="s.id" class="tab__session-card" @click="emit('open-detail', s)">
        <div class="tab__session-header">
          <span class="tab__session-title">Session {{ zoneCount(s) }} zone{{ zoneCount(s) > 1 ? 's' : '' }}</span>
          <span class="tab__session-date">{{ formatDate(s.played_at) }}</span>
        </div>
        <div class="tab__session-body">
          <span class="tab__session-line">Zones travaillées : <strong>{{ zoneNames(s) }}</strong></span>
          <span class="tab__session-line">Précision moyenne : <strong>{{ s.accuracy }} %</strong></span>
          <span class="tab__session-line">Fléchettes lancées : <strong>{{ s.total_darts }}</strong></span>
        </div>
      </li>
    </ul>
  </section>

  <p v-if="!summary && !sessions.length" class="tab__empty">
    Lance une session d'échauffement pour voir tes stats ici.
  </p>
</template>

<style lang="scss" scoped>
.tab {
  &__card {
    background: rgba($white, 0.05);
    border-radius: $radius-lg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-md;

    &--shrink { flex-shrink: 0; }

    &--grow {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding-bottom: 0;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  &__detail-btn {
    @include text-xs;
    color: $muted;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__grid {
    display: grid;
    gap: $gap-sm;
    grid-template-columns: repeat(3, 1fr);
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }

  &__history {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    padding-bottom: $padding-md;
  }

  &__session-card {
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__session-title {
    @include title-sm;
    color: $text-color;
  }

  &__session-date {
    @include text-xs;
    color: $muted;
    flex-shrink: 0;
  }

  &__session-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__session-line {
    @include text-xs;
    color: $muted;

    strong {
      color: $text-color;
      font-weight: 600;
    }
  }
}

@media (min-width: $bp-laptop) {
  .tab {
    &__card        { padding: $padding-xl; gap: $gap-lg; }
    &__section-title { @include title-md; }
    &__detail-btn  { @include text-sm; }
    &__empty       { @include text-md; }
    &__session-card  { padding: $padding-md $padding-lg; gap: $gap-sm; }
    &__session-title { @include title-md; }
    &__session-date  { @include text-sm; }
    &__session-line  { @include text-sm; }
  }
}
</style>
