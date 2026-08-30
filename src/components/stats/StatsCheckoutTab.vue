<script setup>
import { computed } from 'vue'
import StatCell from '../StatCell.vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['open-detail'])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const summary = computed(() => {
  if (!props.sessions.length) return null
  const totalQ = props.sessions.reduce((s, r) => s + r.questions, 0)
  const totalC = props.sessions.reduce((s, r) => s + r.correct_count, 0)
  return {
    sessions: props.sessions.length,
    rate: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
    bestStreak: Math.max(...props.sessions.map((r) => r.best_streak ?? 0)),
  }
})
</script>

<template>
  <section v-if="summary" class="tab__card tab__card--shrink">
    <h2 class="tab__section-title">Résumé</h2>
    <div class="tab__grid">
      <StatCell :value="summary.sessions" label="Sessions" />
      <StatCell :value="summary.rate + '%'" label="Réussite" />
      <StatCell :value="summary.bestStreak" label="Meilleure série" />
    </div>
  </section>

  <section v-if="sessions.length" class="tab__card tab__card--grow">
    <h2 class="tab__section-title">Historique</h2>
    <ul class="tab__history">
      <li v-for="s in sessions" :key="s.id" class="tab__session-card" @click="emit('open-detail', s)">
        <div class="tab__session-header">
          <span class="tab__session-title">Quiz {{ s.questions }} checkouts</span>
          <span class="tab__session-date">{{ formatDate(s.played_at) }}</span>
        </div>
        <div class="tab__session-body">
          <span class="tab__session-line">Réussite : <strong>{{ s.correct_count }}/{{ s.questions }}</strong></span>
          <span class="tab__session-line">Routes optimales : <strong>{{ s.optimal_count }}</strong> · {{ s.points }} pts</span>
        </div>
      </li>
    </ul>
  </section>

  <p v-if="!sessions.length" class="tab__empty">
    Lance un quiz Checkouts pour voir tes stats ici.
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

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
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
    &__card { padding: $padding-xl; gap: $gap-lg; }
    &__section-title { @include title-md; }
    &__empty { @include text-md; }
    &__session-card { padding: $padding-md $padding-lg; gap: $gap-sm; }
    &__session-title { @include title-md; }
    &__session-date { @include text-sm; }
    &__session-line { @include text-sm; }
  }
}
</style>
