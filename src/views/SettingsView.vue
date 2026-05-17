<script setup>
import { reactive, computed } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import AppHeader      from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import { GAME_MODES } from '../data/gameModes.js'
import { gameSettings } from '../store/gameStore.js'

const route  = useRoute()
const router = useRouter()

const mode = computed(() => GAME_MODES.find(m => m.id === 'score-training'))

const settings = reactive({
  difficulty:       'easy',
  maxQuestions:     10,
  timeLimit:        null,
  doubleValidation: false,
})

const difficultyOptions = [
  { value: 'easy',   label: 'Facile'    },
  { value: 'medium', label: 'Moyen'     },
  { value: 'hard',   label: 'Difficile' },
]

const questionOptions = [
  { value: 10,   label: '10'       },
  { value: 20,   label: '20'       },
  { value: null, label: 'Illimité' },
]

const timeOptions = [
  { value: 15,   label: '15 s'  },
  { value: 30,   label: '30 s'  },
  { value: null, label: 'Libre' },
]

function startGame() {
  gameSettings.value = { ...settings }
  router.push({ name: 'score-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader
      :title="mode?.title.replace('\n', ' ')"
      @back="router.push({ name: 'lobby' })"
    />

    <main class="settings__main">
      <div class="settings__cards">
        <div class="settings__card">
          <OptionSelector
            label="Difficulté des volées"
            :options="difficultyOptions"
            v-model="settings.difficulty"
          />
        </div>
        <div class="settings__card">
          <OptionSelector
            label="Nombre de questions"
            :options="questionOptions"
            v-model="settings.maxQuestions"
          />
        </div>
        <div class="settings__card">
          <OptionSelector
            label="Temps par question"
            :options="timeOptions"
            v-model="settings.timeLimit"
          />
        </div>

        <button
          class="settings__toggle"
          :class="{ 'settings__toggle--on': settings.doubleValidation }"
          @click="settings.doubleValidation = !settings.doubleValidation"
        >
          <div class="settings__toggle-text">
            <span class="settings__toggle-title">Double calcul</span>
            <span class="settings__toggle-desc">
              Après une bonne réponse, calcule aussi le score restant
            </span>
          </div>
          <div
            class="settings__toggle-switch"
            :class="{ 'settings__toggle-switch--on': settings.doubleValidation }"
          >
            <div class="settings__toggle-knob" />
          </div>
        </button>
      </div>

      <button class="settings__start" @click="startGame">
        JOUER
      </button>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    padding: $padding-xs $padding-md $padding-xl;
    gap: $padding-lg;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: $padding-xs;
    flex: 1;
    justify-content: center;
  }

  &__card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm;
  }

  &__toggle {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm $padding-md;
    display: flex;
    align-items: center;
    gap: $padding-sm;
    text-align: left;
    transition: border-color 0.2s;

    &--on { border-color: rgba($orange, 0.6); }
  }

  &__toggle-text { flex: 1; }

  &__toggle-title {
    display: block;
    font-size: $text-sm;
    font-weight: 700;
    color: $text-color;
    margin-bottom: $padding-xxs;
  }

  &__toggle-desc {
    display: block;
    font-size: $text-xs;
    color: $muted;
    line-height: 1.4;
  }

  &__toggle-switch {
    width: 44px;
    height: 26px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;

    &--on { background: $orange; border-color: $orange; }
  }

  &__toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: $white;
    border-radius: 50%;
    transition: transform 0.2s;

    .settings__toggle-switch--on & { transform: translateX(18px); }
  }

  &__start {
    background: $orange;
    border-radius: $radius-pill;
    color: $white;
    font-family: $font-display;
    font-size: $title-sm;
    letter-spacing: 2px;
    padding: $padding-md;
    width: 100%;
    transition: background 0.15s, transform 0.1s;

    &:active { background: $orange-dark; transform: scale(0.98); }
  }
}
</style>
