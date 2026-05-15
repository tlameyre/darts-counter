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
</script>

<template>
  <div class="home">
    <div class="home__hero">
      <div class="home__title-wrap">
        <span class="home__title-sub">TRAINING</span>
        <h1 class="home__title">DARTS<br>COUNTER</h1>
      </div>
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
      JOUER
    </button>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: 0 16px 40px;
  max-width: 420px;
  margin: 0 auto;

  &__hero {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 40px 0 32px;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title-sub {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 3px;
    color: $orange;
    text-transform: uppercase;
  }

  &__title {
    font-family: $font-display;
    font-size: 64px;
    line-height: 0.9;
    color: $text;
    letter-spacing: -1px;
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: 18px;
  }

  &__start {
    margin-top: 20px;
    background: $orange;
    border-radius: $radius-pill;
    color: #fff;
    font-family: $font-display;
    font-size: 20px;
    letter-spacing: 3px;
    padding: 18px;
    width: 100%;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $orange-dark;
      transform: scale(0.98);
    }
  }
}
</style>
