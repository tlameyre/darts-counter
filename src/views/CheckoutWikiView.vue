<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { CHECKOUT_SCORES, CHECKOUT_BRACKETS, CHECKOUT_DATA_SOURCE } from '../composables/useCheckouts.js'

const router = useRouter()

const groups = computed(() =>
  CHECKOUT_BRACKETS
    .map((b) => ({
      label: b.label,
      scores: CHECKOUT_SCORES.filter((s) => s >= b.range[0] && s <= b.range[1]),
    }))
    .filter((g) => g.scores.length > 0),
)

function openScore(score) {
  router.push({ name: 'checkout-wiki-detail', params: { score } })
}

// Consultable depuis /play, les réglages checkout ou l'accueil : on revient d'où on vient.
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'play' })
}
</script>

<template>
  <div class="wiki">
    <AppHeader title="CHECKOUTS" @back="goBack" />

    <p class="wiki__intro">Toutes les sorties de 2 à 170. Touche un score pour voir la cible et les routes.</p>

    <main class="wiki__main">
      <section v-for="group in groups" :key="group.label" class="wiki__group">
        <h2 class="wiki__group-title">{{ group.label }}</h2>
        <div class="wiki__grid">
          <button
            v-for="score in group.scores"
            :key="score"
            type="button"
            class="wiki__card"
            @click="openScore(score)"
          >
            {{ score }}
          </button>
        </div>
      </section>
    </main>

    <p class="wiki__source">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
  </div>
</template>

<style lang="scss" scoped>
.wiki {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  padding: $padding-lg $padding-md 0;
  gap: $gap-lg;
  @include nav-safe-bottom;

  &__intro {
    @include text-sm;
    color: $muted;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__group-title {
    @include title-md;
    color: $white;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
    gap: $gap-xs;
  }

  &__card {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background: rgba($white, 0.05);
    border: $border-sm solid rgba($white, 0.08);
    border-radius: $radius-md;
    color: $white;
    @include title-lg;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: transform 0.15s, background 0.15s;

    &:active {
      transform: scale(0.94);
      background: rgba($accent, 0.2);
    }
  }

  &__source {
    @include text-xs;
    color: $muted;
    text-align: center;
    margin-top: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .wiki {
    padding: $padding-xxl $padding-xxl 0;
    @include nav-safe-bottom($padding-xl);

    &__intro { @include text-md; }
    &__group-title { @include title-lg; }

    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
      gap: $gap-sm;
    }

    &__card { @include title-xl; }

    &__source { @include text-sm; }
  }
}
</style>
