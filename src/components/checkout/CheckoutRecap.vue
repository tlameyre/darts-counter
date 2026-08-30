<script setup>
import { computed } from 'vue'
import AppButton from '../AppButton.vue'
import StatCell from '../StatCell.vue'

const props = defineProps({
  variant: { type: String, required: true },
  sessionStats: { type: Object, default: null }, // quiz
  reviewedCount: { type: Number, default: 0 }, // review
  hideActions: { type: Boolean, default: false },
})

const emit = defineEmits(['restart', 'home'])

const successRate = computed(() => {
  const s = props.sessionStats
  return s && s.questions ? Math.round((s.correct / s.questions) * 100) : 0
})
</script>

<template>
  <div class="co-recap">
    <h1 class="co-recap__title">{{ variant === 'quiz' ? 'RÉCAP QUIZ' : 'RÉVISION TERMINÉE' }}</h1>

    <template v-if="variant === 'quiz' && sessionStats">
      <div class="co-recap__score">
        {{ sessionStats.correct }}<span>/{{ sessionStats.questions }}</span>
      </div>
      <div class="co-recap__label">sorties réussies · {{ successRate }}%</div>

      <div class="co-recap__grid">
        <StatCell :value="sessionStats.optimal" label="Routes optimales" />
        <StatCell :value="sessionStats.bestStreak" label="Meilleure série" />
        <StatCell :value="sessionStats.points" label="Points" />
      </div>
    </template>

    <template v-else>
      <div class="co-recap__score">{{ reviewedCount }}</div>
      <div class="co-recap__label">checkouts acquis</div>
    </template>

    <div v-if="!hideActions" class="co-recap__actions">
      <AppButton @click="emit('restart')">Recommencer</AppButton>
      <AppButton variant="secondary" @click="emit('home')">Accueil</AppButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.co-recap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $gap-lg;
  text-align: center;

  &__title {
    @include title-xxl;
    color: $white;
  }

  &__score {
    @include display-lg;
    color: $accent;
    font-variant-numeric: tabular-nums;
    line-height: 1;

    span {
      @include display-xs;
      font-weight: 300;
      color: $white;
    }
  }

  &__label {
    @include text-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $gap-sm;
    width: 100%;
    max-width: 420px;
  }

  &__actions {
    display: flex;
    gap: $gap-md;
    width: 100%;
    max-width: 420px;

    :deep(.btn) { flex: 1; }
  }
}

@media (min-width: $bp-laptop) {
  .co-recap {
    &__title { @include display-xs; }
    &__label { @include text-xl; }
    &__grid, &__actions { max-width: 520px; }
  }
}
</style>
