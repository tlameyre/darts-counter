<script setup>
import { reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import AppButton from '../components/AppButton.vue'
import { GAME_MODES } from '../data/gameModes.js'
import { useGameStore } from '../store/gameStore.js'

const route     = useRoute()
const router    = useRouter()
const gameStore = useGameStore()

const mode = computed(() => GAME_MODES.find(m => m.id === 'score-training'))

const settings = reactive({
  difficulty: 'easy',
  maxQuestions: 10,
  timeLimit: null,
  doubleValidation: false,
  showDartValue: false,
})

const difficultyOptions = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
]

const questionOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: null, label: 'Infini' },
]

const timeOptions = [
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: null, label: 'Libre' },
]

function startGame() {
  gameStore.gameSettings = { ...settings }
  router.push({ name: 'score-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader :title="mode?.title.replace('\n', ' ')" @back="router.push({ name: 'home' })" />
    <main class="settings__main">
      <div class="settings__card">
        <OptionSelector label="Difficulté des volées" :options="difficultyOptions" v-model="settings.difficulty" />
      </div>
      <div class="settings__card">
        <OptionSelector label="Nombre de questions" :options="questionOptions" v-model="settings.maxQuestions" />
      </div>
      <div class="settings__card">
        <OptionSelector label="Temps par question" :options="timeOptions" v-model="settings.timeLimit" />
      </div>

      <ToggleSwitch v-model="settings.doubleValidation" title="Double calcul"
        description="Après une bonne réponse, calcule aussi le score restant" />

      <ToggleSwitch v-model="settings.showDartValue" title="Valeur des fléchettes"
        description="Affiche les points sous chaque fléchette (ex: 60 pts sous T20)" />

    </main>
    <AppButton @click="startGame">JOUER</AppButton>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 69px);
  gap: $gap-xl;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    gap: $gap-md;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }
}

@media (min-width: $bp-tablet) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xl + 69px);
  }
}
</style>
