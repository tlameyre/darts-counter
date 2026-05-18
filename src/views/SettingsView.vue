<script setup>
import { reactive, computed } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import AppHeader      from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import ToggleSwitch   from '../components/ToggleSwitch.vue'
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

        <ToggleSwitch
          v-model="settings.doubleValidation"
          title="Double calcul"
          description="Après une bonne réponse, calcule aussi le score restant"
        />
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
