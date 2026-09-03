<script setup>
import { computed, shallowRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import CheckoutBoardRoute from '../components/checkout/CheckoutBoardRoute.vue'
import CheckoutRouteCard from '../components/checkout/CheckoutRouteCard.vue'
import { CHECKOUT_SCORES, getCheckout } from '../composables/useCheckouts.js'

const route = useRoute()
const router = useRouter()

const score = computed(() => Number(route.params.score))
const checkout = computed(() => getCheckout(score.value))

// Score inconnu (impossible ou hors barème) : retour à la liste.
watchEffect(() => {
  if (route.name === 'checkout-wiki-detail' && !checkout.value) {
    router.replace({ name: 'checkout-wiki' })
  }
})

// Route affichée sur la cible — remise sur la recommandée à chaque score.
const selectedRoute = shallowRef(null)
watch(
  score,
  () => { selectedRoute.value = checkout.value?.primary ?? null },
  { immediate: true },
)

const idx = computed(() => CHECKOUT_SCORES.indexOf(score.value))
const prevScore = computed(() => (idx.value > 0 ? CHECKOUT_SCORES[idx.value - 1] : null))
const nextScore = computed(() =>
  idx.value >= 0 && idx.value < CHECKOUT_SCORES.length - 1 ? CHECKOUT_SCORES[idx.value + 1] : null,
)

function goto(target) {
  if (target == null) return
  router.replace({ name: 'checkout-wiki-detail', params: { score: target } })
}

// Préc./suiv. utilisent `replace` : un seul retour ramène à la liste.
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'checkout-wiki' })
}
</script>

<template>
  <div v-if="checkout" class="co-detail">
    <AppHeader :title="String(score)" @back="goBack" />

    <main class="co-detail__main">
      <div class="co-detail__board">
        <CheckoutBoardRoute :route="selectedRoute || []" />
      </div>

      <div class="co-detail__info">
        <div class="co-detail__score">{{ score }}</div>
        <CheckoutRouteCard
          :checkout="checkout"
          size="md"
          selectable
          :selected="selectedRoute"
          class="co-detail__routes"
          @select="selectedRoute = $event"
        />
      </div>
    </main>

    <nav class="co-detail__nav">
      <button type="button" class="co-detail__nav-btn" :disabled="prevScore == null" @click="goto(prevScore)">
        <AppIcon name="arrow-left" :width="20" :height="20" />
        <span>{{ prevScore ?? '—' }}</span>
      </button>
      <button type="button" class="co-detail__nav-btn" :disabled="nextScore == null" @click="goto(nextScore)">
        <span>{{ nextScore ?? '—' }}</span>
        <AppIcon name="arrow-right" :width="20" :height="20" />
      </button>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.co-detail {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;
  gap: $gap-md;

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-md;
    overflow: hidden;
  }

  &__board {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  &__score {
    @include display-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    flex-shrink: 0;
  }

  &__routes {
    width: 100%;
    max-width: 460px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: $padding-sm;
  }

  &__nav {
    display: flex;
    gap: $gap-sm;
    flex-shrink: 0;

    > * { flex: 1; }
  }

  &__nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 48px;
    border-radius: $radius-sm;
    background: rgba($white, 0.05);
    border: $border-sm solid rgba($white, 0.08);
    color: $white;
    @include title-sm;
    font-variant-numeric: tabular-nums;
    transition: filter 0.15s, opacity 0.15s;

    &:active { filter: brightness(1.2); }

    &:disabled {
      opacity: 0.35;
      pointer-events: none;
    }
  }
}

@media (min-width: $bp-laptop) {
  .co-detail {
    padding: $padding-xl;

    &__main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
      gap: $gap-xl;
    }

    &__board {
      min-width: 0;
      min-height: 0;
      align-items: flex-start;

      :deep(.board) {
        max-width: min(100%, calc(100dvh - 180px));
      }
    }

    &__info {
      min-width: 0;
      align-items: stretch;
    }

    &__score {
      @include display-md;
      text-align: center;
    }

    &__routes { max-width: none; }

    &__nav-btn {
      height: 52px;
      @include title-md;
    }
  }
}
</style>
