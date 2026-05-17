<script setup>
import { useRouter } from 'vue-router'
import { GAME_MODES } from '../data/gameModes.js'

const router = useRouter()

function selectMode(mode) {
  router.push({ name: mode.settingsRoute })
}
</script>

<template>
  <div class="lobby">
    <header class="lobby__header">
      <span class="lobby__sub">TRAINING</span>
      <h1 class="lobby__title">DARTS<br>COUNTER</h1>
    </header>

    <main class="lobby__modes">
      <button
        v-for="mode in GAME_MODES"
        :key="mode.id"
        class="mode-card"
        :style="{ '--mode-color': mode.color }"
        @click="selectMode(mode)"
      >
        <h2 class="mode-card__title">{{ mode.title }}</h2>
        <p class="mode-card__desc">{{ mode.description }}</p>
      </button>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md $padding-xl;
  gap: $padding-xl;

  &__header {
    display: flex;
    flex-direction: column;
    gap: $padding-xxs;
    padding-top: $padding-lg;
  }

  &__sub {
    font-size: $text-xs;
    font-weight: 700;
    letter-spacing: 3px;
    color: $orange;
    text-transform: uppercase;
  }

  &__title {
    font-family: $font-display;
    font-size: $title-xl;
    line-height: 0.9;
    letter-spacing: 1px;
    color: $text-color;
  }

  &__modes {
    display: flex;
    flex-direction: column;
    gap: $padding-sm;
    flex: 1;
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
    font-family: $font-display;
    font-size: $title-xs;
    line-height: 1;
    color: $white;
    white-space: pre-line;
  }

  &__desc {
    font-size: $text-sm;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.4;
    max-width: 260px;
  }
}
</style>
