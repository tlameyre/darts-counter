<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'

const router    = useRouter()
const gameStore = useGameStore()

const MOCK_PLAYERS = [
  { id: 'mock-1', name: 'Toi', isMe: true },
  { id: 'mock-2', name: 'Bob', isFriend: true },
]

const settings = gameStore.gameSettings ?? { players: MOCK_PLAYERS }

function shuffle(list) {
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const order = ref(shuffle(settings.players ?? MOCK_PLAYERS))

function reshuffle() {
  order.value = shuffle(order.value)
}

function confirmOrder() {
  if (gameStore.gameSettings) gameStore.gameSettings.players = order.value
  router.push({ name: 'tactics-game' })
}
</script>

<template>
  <div class="starter">
    <AppHeader title="Qui commence ?" @back="router.push({ name: 'tactics-settings' })" />

    <main class="starter__main">
      <div class="starter__card">
        <p class="starter__hint">
          Tirage au sort effectué — glisse pour ajuster l'ordre si besoin.
        </p>

        <X01PlayerOrderList v-model="order" />

        <button class="starter__reshuffle" @click="reshuffle">
          Relancer le tirage
        </button>
      </div>
    </main>

    <AppButton @click="confirmOrder">COMMENCER</AppButton>
  </div>
</template>

<style lang="scss" scoped>
.starter {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: $padding-md 0;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }

  &__reshuffle {
    @include text-sm;
    color: $muted;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    border: $border-sm dashed rgba($white, 0.2);
    text-align: center;
    transition: border-color 0.15s, color 0.15s;

    &:active {
      border-color: $orange;
      color: $orange;
    }
  }
}

@media (min-width: $bp-laptop) {
  .starter {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-lg;

    &__main {
      padding: $padding-lg 0;
    }

    &__hint { @include title-md; }
  }
}
</style>
