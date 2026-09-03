<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { GAME_MODES } from '../data/gameModes.js'
import { useAuthStore } from '../store/authStore.js'
import AppIcon from '../components/AppIcon.vue'

const router    = useRouter()
const authStore = useAuthStore()

const trainModes = computed(() => GAME_MODES.filter((m) => m.group === 'train'))
const playModes  = computed(() => GAME_MODES.filter((m) => m.group !== 'train'))

function selectMode(mode) {
  router.push({ name: mode.settingsRoute })
}
</script>

<template>
  <div class="lobby">
    <header class="lobby__header">
      <div class="lobby__header-top">
        <h1 class="lobby__title">DARTS<br>TRAINER</h1>
        <button class="lobby__profile-btn" @click="router.push({ name: 'profile' })">
          <AppIcon name="user" :width="22" :height="22" />
          <span v-if="authStore.profile?.username" class="lobby__profile-name">{{ authStore.profile.username }}</span>
        </button>
      </div>
    </header>

    <main class="lobby__main">
      <section class="lobby__group">
        <h2 class="lobby__group-title">S'entraîner</h2>
        <div class="lobby__modes">
          <button v-for="mode in trainModes" :key="mode.id" class="mode-card" :style="{ '--mode-color': mode.color }"
            @click="selectMode(mode)">
            <h3 class="mode-card__title">{{ mode.title }}</h3>
            <p class="mode-card__desc">{{ mode.description }}</p>
          </button>

          <button class="lobby__wiki-card" @click="router.push({ name: 'checkout-wiki' })">
            <span class="lobby__wiki-title">CONSULTER LES CHECKOUTS</span>
            <span class="lobby__wiki-desc">Parcours toutes les sorties de 2 à 170 sans lancer de partie.</span>
          </button>
        </div>
      </section>

      <section class="lobby__group">
        <h2 class="lobby__group-title">Jouer</h2>
        <div class="lobby__modes">
          <button v-for="mode in playModes" :key="mode.id" class="mode-card" :style="{ '--mode-color': mode.color }"
            @click="selectMode(mode)">
            <h3 class="mode-card__title">{{ mode.title }}</h3>
            <p class="mode-card__desc">{{ mode.description }}</p>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  padding: $padding-lg $padding-md 0;
  gap: $padding-xl;
  @include nav-safe-bottom;

  &__header-top {
    padding-top: $padding-lg;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__profile-btn {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    color: $muted;
    transition: color 0.15s;

    &:active {
      color: $text-color;
    }
  }

  &__profile-name {
    @include text-sm;
    color: $muted;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    @include title-xs;
    color: $orange;
    text-transform: uppercase;
  }

  &__title {
    @include text-xxl;
    font-weight: 600;
    line-height: .9;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $padding-xl;
    flex: 1;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $padding-sm;
  }

  &__group-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__modes {
    display: flex;
    flex-direction: column;
    gap: $padding-sm;
  }

  &__wiki-card {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    width: 100%;
    background: rgba($white, 0.05);
    border: $border-sm solid rgba($white, 0.08);
    border-radius: $radius-lg;
    padding: $padding-lg;
    text-align: left;
    transition: transform 0.15s, opacity 0.15s;

    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
  }

  &__wiki-title {
    @include title-sm;
    color: $white;
  }

  &__wiki-desc {
    @include text-xs;
    color: $muted;
  }
}

.mode-card {
  width: 100%;
  background: var(--mode-color);
  border-radius: $radius-lg;
  padding: $padding-lg;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: $padding-xs;
  transition: transform 0.15s, opacity 0.15s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  &__title {
    @include title-lg;
    line-height: 100%;
    color: $white;
  }

  &__desc {
    @include text-sm;
    color: rgba($white, 0.75);
  }
}

@media (min-width: $bp-laptop) {
  .lobby {
    padding: $padding-xxl $padding-xxl 0;
    @include nav-safe-bottom($padding-xl);

    &__title {
      @include title-xxxl;
    }

    &__profile-name { @include text-md; }
    &__group-title { @include title-md; }
    &__wiki-title { @include title-md; }
    &__wiki-desc { @include text-sm; }

    .mode-card {
      gap: $gap-lg;
      padding: $padding-xxl;

      &__title { @include title-xl; }
      &__desc  { @include text-md; }
    }
  }
}
</style>
