<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import X01Result from '../x01/X01Result.vue'
import GameOver from '../GameOver.vue'
import WarmupRecap from '../warmup/WarmupRecap.vue'

const props = defineProps({
  show:    { type: Boolean, required: true },
  session: { type: Object,  default: null },
  mode:    { type: String,  required: true },
})

const emit = defineEmits(['close', 'delete'])

// Normalise un item zoneRecap vers le format { zones: [...] } attendu par WarmupRecap
function normalizeZoneItem(item) {
  if (item.zones) return item
  // Ancien format : { zone: { sector, type }, ... }
  return { ...item, zones: item.zone ? [item.zone] : [] }
}

// Mappe les données DB → format WarmupRecap
const warmupZoneStats = computed(() => {
  const s = props.session
  if (!s) return []
  if (s.settings?.zoneRecap?.length) return s.settings.zoneRecap.map(normalizeZoneItem)
  // Fallback : zone unique stockée en DB (anciennes sessions sans zoneRecap)
  return [{
    zones:      s.zone ? [s.zone] : [],
    accuracy:   s.accuracy,
    durationMs: (s.duration_s ?? 0) * 1000,
    total:      s.total_darts,
    hits:       s.hits,
  }]
})

const warmupSessionStats = computed(() => {
  const s = props.session
  if (!s) return { total: 0, hits: 0, accuracy: 0 }
  return { total: s.total_darts, hits: s.hits, accuracy: s.accuracy }
})

// Mappe les données DB → format attendu par X01Result
const x01Stats = computed(() => {
  const s = props.session
  if (!s) return null
  return {
    avgVolley:        s.avg_volley,
    avg9darts:        s.avg_9darts,
    avgDartsToFinish: s.avg_darts_to_finish,
    doublesHit:       s.doubles_hit,
    doublesAttempted: s.doubles_attempted,
    highestFinish:    s.highest_finish,
    highestVolley:    s.highest_volley,
    bestLeg:             s.min_darts != null ? { darts: s.min_darts, checkoutScore: null } : null,
    worstLeg:            s.max_darts != null ? { darts: s.max_darts, checkoutScore: null } : null,
    volleyDistribution:  s.volley_distribution ?? null,
    legAverages:         s.leg_averages        ?? null,
  }
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show && session" class="session-detail">

      <!-- Barre du haut -->
      <div class="session-detail__topbar">
        <button class="session-detail__close" @click="$emit('close')">
          <AppIcon name="arrow-left" :width="20" :height="20" />
        </button>
        <span class="session-detail__date">{{ formatDate(session.played_at) }}</span>
        <button class="session-detail__delete" @click="$emit('delete', session.id)">
          <AppIcon name="trash" :width="18" :height="18" />
        </button>
      </div>

      <span v-if="session.tournament_id" class="session-detail__badge">
        <AppIcon name="trophy" :width="12" :height="12" />
        {{ session.tournaments?.name ?? 'Tournoi' }}
      </span>

      <!-- Résultat 501 -->
      <template v-if="mode === 'x01'">
        <X01Result
          :stats="x01Stats"
          :legs-played="session.legs_played"
          :start-score="session.start_score"
          hide-actions
        />
      </template>

      <!-- Résultat Score Training -->
      <template v-else-if="mode === 'score'">
        <GameOver
          :correct-count="session.correct_count"
          :max-questions="session.total_questions"
          :best="session.best_streak"
          hide-actions
        />
      </template>

      <!-- Résultat Échauffement -->
      <template v-else-if="mode === 'warmup'">
        <WarmupRecap
          :zone-recap-stats="warmupZoneStats"
          :session-stats="warmupSessionStats"
          hide-actions
        />
      </template>

    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.session-detail {
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: $padding-md $padding-md 0;

  &__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
    margin-bottom: $gap-md;
    flex-shrink: 0;
  }

  &__close,
  &__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    background: rgba($white, 0.07);
    color: $text-color;
    transition: opacity 0.15s;
    flex-shrink: 0;

    &:active { opacity: 0.6; }
  }

  &__delete { color: $error; background: rgba($error, 0.1); }

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    align-self: center;
    background: rgba($orange, 0.15);
    color: $orange;
    border-radius: $radius-pill;
    padding: $padding-xxs $padding-sm;
    @include text-xxs;
    margin-bottom: $gap-md;
    flex-shrink: 0;
  }

  &__date {
    @include title-xs;
    color: $muted;
    text-transform: capitalize;
    text-align: center;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


}

@media (min-width: $bp-laptop) {
  .session-detail {
    padding: $padding-xl;

    &__date { @include title-sm; }
    &__badge { @include text-xs; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(30px); opacity: 0; }
</style>
