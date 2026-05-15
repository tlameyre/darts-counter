<script setup>
import { reactive } from 'vue'
import OptionSelector from '../components/OptionSelector.vue'

const emit = defineEmits(['start'])

const settings = reactive({
  difficulty:   'easy',
  maxQuestions: 10,
  timeLimit:    null,
})

const difficultyOptions = [
  { value: 'easy',   label: 'Facile'  },
  { value: 'medium', label: 'Moyen'   },
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
</script>

<template>
  <div class="home">
    <div class="home__hero">
      <div class="home__icon">&#9673;</div>
      <h1 class="home__title">Darts <span>Counter</span></h1>
      <p class="home__subtitle">Entraîne-toi au comptage des fléchettes</p>
    </div>

    <div class="home__settings">
      <div class="home__card">
        <OptionSelector
          label="Difficulté des volées"
          :options="difficultyOptions"
          v-model="settings.difficulty"
        />
      </div>

      <div class="home__card">
        <OptionSelector
          label="Nombre de questions"
          :options="questionOptions"
          v-model="settings.maxQuestions"
        />
      </div>

      <div class="home__card">
        <OptionSelector
          label="Temps par question"
          :options="timeOptions"
          v-model="settings.timeLimit"
        />
      </div>
    </div>

    <button class="home__start" @click="emit('start', { ...settings })">
      Commencer la partie
    </button>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: 0 16px 48px;
  max-width: 420px;
  margin: 0 auto;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 52px 0 36px;
    gap: 8px;
  }

  &__icon {
    font-size: 52px;
    line-height: 1;
    color: $accent;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;

    span { color: $accent; }
  }

  &__subtitle {
    font-size: 14px;
    color: $muted;
    text-align: center;
  }

  &__settings {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__card {
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: 20px;
  }

  &__start {
    margin-top: 28px;
    width: 100%;
    background: $accent;
    border-radius: $radius-lg;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    padding: 18px;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $accent-dark;
      transform: scale(0.98);
    }
  }
}
</style>
