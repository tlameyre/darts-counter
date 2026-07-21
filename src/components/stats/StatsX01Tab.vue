<script setup>
import { computed } from 'vue'
import StatCell from '../StatCell.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['open-detail'])

const summary = computed(() => {
  const s = props.sessions
  if (!s.length) return null

  const totalDoublesHit = s.reduce((acc, r) => acc + (r.doubles_hit ?? 0), 0)
  const totalDoublesAttempted = s.reduce((acc, r) => acc + (r.doubles_attempted ?? 0), 0)

  return {
    sessions: s.length,
    avgVolley: (s.reduce((acc, r) => acc + Number(r.avg_volley), 0) / s.length).toFixed(2),
    avg9darts: (s.reduce((acc, r) => acc + Number(r.avg_9darts), 0) / s.length).toFixed(2),
    pctFinish: totalDoublesAttempted > 0
      ? (totalDoublesHit / totalDoublesAttempted * 100).toFixed(2) + '%'
      : '—',
    avgDartsToFinish: (s.reduce((acc, r) => acc + Number(r.avg_darts_to_finish), 0) / s.length).toFixed(2),
    avgHighestFinish: Math.round(s.reduce((acc, r) => acc + (r.highest_finish ?? 0), 0) / s.length),
  }
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function hasBot(s) {
  return !!s.settings?.aiProfile
}

function humanOpponents(s) {
  return s.settings?.opponents ?? []
}

function legsToWin(s) {
  return s.settings?.legsToWin ?? 0
}
</script>

<template>
  <section v-if="summary" class="tab__card tab__card--shrink">
    <h2 class="tab__section-title">Résumé</h2>
    <div class="tab__grid">
      <StatCell :value="summary.avgVolley" label="Moyenne volée" />
      <StatCell :value="summary.avg9darts" label="Moy. 9 premières" />
      <StatCell :value="summary.pctFinish" label="% de finish" />
      <StatCell :value="summary.avgHighestFinish" label="Finish moyen" />
      <StatCell :value="summary.avgDartsToFinish" label="Fléchettes / leg" />
      <StatCell :value="summary.sessions" label="Parties" />
    </div>
  </section>

  <section v-if="sessions.length" class="tab__card tab__card--grow">
    <h2 class="tab__section-title">Historique</h2>
    <ul class="tab__history">
      <li v-for="s in sessions" :key="s.id" class="tab__session-card" @click="emit('open-detail', s)">
        <div class="tab__session-header">
          <span class="tab__session-title">{{ s.start_score }} – {{ s.legs_played }} manche{{ s.legs_played > 1 ? 's' :
            '' }}</span>
          <div class="tab__session-header-right">
            <span class="tab__session-date">{{ formatDate(s.played_at) }}</span>
            <AppIcon name="arrow-right" :width="16" :height="16" class="tab__session-arrow" />
          </div>
        </div>
        <div class="tab__session-body">
          <div class="tab__player-row" :class="{ winner: s.settings?.humanLegsWon >= (s.settings?.legsToWin ?? 0) }">
            <div class="tab__player-infos">
              <span class="tab__player-name">{{ s.settings?.humanName ?? 'Joueur' }}</span>
              <AppIcon
                v-if="s.settings?.humanLegsWon != null && s.settings.humanLegsWon >= (s.settings?.legsToWin ?? 0)"
                name="trophy" :width="20" :height="20" class="tab__player-trophy" />
            </div>
            <div class="tab__player-stats">
              <span class="tab__player-legs">{{ s.settings?.humanLegsWon ?? '–' }}</span>
              <span class="tab__player-avg">{{ Number(s.avg_volley).toFixed(2) }}</span>
            </div>
          </div>
          <!-- DartBot opponent -->
          <div v-if="hasBot(s)" class="tab__player-row"
            :class="{ winner: s.settings?.aiLegsWon >= legsToWin(s) }">
            <div class="tab__player-infos">
              <span class="tab__player-name">Dartbot</span>
              <AppIcon v-if="s.settings?.aiLegsWon != null && s.settings.aiLegsWon >= legsToWin(s)"
                name="trophy" :width="20" :height="20" class="tab__player-trophy" />
            </div>
            <div class="tab__player-stats">
              <span class="tab__player-legs">{{ s.settings?.aiLegsWon ?? '–' }}</span>
              <span class="tab__player-avg">{{ s.settings?.aiAvgVolley != null ?
                Number(s.settings.aiAvgVolley).toFixed(2) : '–' }}</span>
            </div>
          </div>
          <!-- Human opponents (multi-player) -->
          <div
            v-for="(opp, oi) in humanOpponents(s)"
            :key="oi"
            class="tab__player-row"
            :class="{ winner: opp.legsWon >= legsToWin(s) }"
          >
            <div class="tab__player-infos">
              <span class="tab__player-name">{{ opp.name }}</span>
              <AppIcon v-if="opp.legsWon >= legsToWin(s)"
                name="trophy" :width="20" :height="20" class="tab__player-trophy" />
            </div>
            <div class="tab__player-stats">
              <span class="tab__player-legs">{{ opp.legsWon }}</span>
              <span class="tab__player-avg">{{ opp.avgVolley != null ? Number(opp.avgVolley).toFixed(2) : '–' }}</span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>

  <p v-if="!summary && !sessions.length" class="tab__empty">
    Lance une partie x01 pour voir tes stats ici.
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

    &--shrink {
      flex-shrink: 0;
    }

    &--grow {
      flex: 1;
      min-height: 0;
      overflow-y: scroll;
      padding-bottom: 0;
    }
  }

  &__section-title {
    @include title-sm;
    color: $white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  &__grid {
    display: grid;
    gap: $gap-md;
    grid-template-columns: repeat(3, 1fr);
  }

  &__empty {
    @include text-sm;
    color: $white;
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

  // ── Card session ───────────────────────────────────────────────────────────
  &__session-card {
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.6;
    }
  }

  &__session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-md;
  }

  &__session-title {
    @include title-md;
    color: $white;
  }

  &__session-header-right {
    display: flex;
    align-items: center;
    gap: $gap-md;
    flex-shrink: 0;
  }

  &__session-date {
    @include text-xs;
    color: $white;
  }

  &__session-arrow {
    color: $white;
  }

  &__session-body {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  // ── Lignes joueur ──────────────────────────────────────────────────────────
  &__player-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__player-infos,
  &__player-stats {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-xs;
  }

  &__player-name {
    @include text-xs;
    color: $white;
  }

  &__player-legs {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    color: $white;
    border-radius: $radius-xs;
    padding: $padding-xxs;
    font-variant-numeric: tabular-nums;
  }

  &__player-avg {
    @include title-xs;
    color: $white;
    font-variant-numeric: tabular-nums;
    min-width: 36px;
    text-align: right;
  }

  &__player-row.winner {
    .tab__player-name {
      @include title-xs;
    }
    .tab__player-legs {
      background: $orange;
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  .tab {
    &__card {
      padding: $padding-xl;
      gap: $gap-lg;
    }

    &__section-title {
      @include title-md;
    }

    &__empty {
      @include text-md;
    }

    &__session-card {
      padding: $padding-md;
      gap: $gap-sm;
    }

    &__session-title {
      @include title-md;
    }

    &__session-date {
      @include text-sm;
    }

    &__player-name {
      @include text-sm;
    }

    &__player-avg {
      @include text-sm;
    }

    &__player-legs {
      @include title-sm;
    }
  }
}
</style>
